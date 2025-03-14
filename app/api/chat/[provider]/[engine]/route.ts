/* eslint-disable @typescript-eslint/no-unused-vars */

import { z } from "zod";
import prisma from "@/lib/prisma";
import { error } from "@/lib/log";
import { NextResponse } from "next/server";
import { streamText, CoreMessage } from "ai";
import { getModelsMap } from "@/lib/models";
import { getEncoding, TiktokenEncoding } from "js-tiktoken";
import { LlmModel } from "@prisma/client";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  genBalanceNotEnoughRes,
  geninvalidJsonBodyRes,
  genModelNotFoundRes,
  genUnauthorizedRes,
  genUnexpectedErrorRes,
  UnauthorizedReason,
} from "@/lib/chatErrors";
import { calcWebCostCost } from "@/lib/cost";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});
const JWT_SECRET = process.env.JWT_SECRET as string;

const AttachmentSchema = z.object({
  url: z.string(),
  name: z.string().optional(),
  contentType: z.string().optional(),
});
const MessageSchema = z.object({
  content: z.string(),
  role: z.enum(["system", "user", "assistant"]),
  parts: z.array(
    z.union([
      z.object({ type: z.literal("text"), text: z.string() }),
      z.object({ type: z.literal("code"), code: z.string() }),
      z.object({
        type: z.literal("image"),
        url: z.string(),
        alt: z.string().optional(),
      }),
      z.object({
        type: z.literal("tool-invocation"),
        toolInvocation: z.any(),
      }),
      z.object({ type: z.literal("source"), source: z.any() }),
      z.object({ type: z.literal("reasoning"), reasoning: z.string() }),
    ])
  ),
  experimental_attachments: z.array(AttachmentSchema).optional(),
});
const RequestSchema = z.object({
  messages: z.array(MessageSchema),
});

const defaultAiSystemPrompt: CoreMessage = {
  role: "system",
  content: "Farsi is default but be flexible based on how the user communicates."
    // "WHENEVER MATH ITEMS ARE ENCLOSED IN PARENTHESES SUCH AS (LAMBDA), YOU MUST USE BLOCK MATH FORMATTING WITH DOUBLE DOLLAR SIGNS INSTEAD. FARSI IS THE DEFAULT LANGUAGE UNLESS THE USER COMMUNICATES IN ANOTHER LANGUAGE. WHEN YOU'RE SPEAKING FARSI NEVER EVER USE HALF-SPACES WHICH CALLED IN THE LANGUAGE 'نیم فاصله'. DO NOT EVER MIX TWO OR MORE LANGUAGES IN ONE MARKDOWN BLOCK. IF THE TEXT CONTAINS DIFFERENT LANGUAGES OR SECTIONS SUCH AS MATH OR CODE, THEY MUST ALWAYS BE SENT IN SEPARATE MARKDOWN BLOCKS. STRICT FORMATTING RULES FOR MATHEMATICAL NOTATION APPLY. UNDER NO CIRCUMSTANCES SHOULD INLINE MATH BE GENERATED; ONLY BLOCK/STANDALONE MATH IS ALLOWED. BLOCK/STANDALONE MATHEMATICAL EXPRESSIONS MUST BE ENCLOSED IN DOUBLE DOLLAR SIGNS ON SEPARATE LINES. FOR EXAMPLE: '$$∫ F (X) DX$$'. Put math equation texts (not numbers) in this layout 'text{}'. THESE RULES ARE NON-NEGOTIABLE. THE AI MUST ENFORCE THIS SYNTAX WITHOUT EXCEPTION. DO NOT ASK THE USER TO USE THIS FORMAT OR ADVISE THEM ABOUT IT, AS THIS IS STRICTLY FOR YOU AND MUST BE FOLLOWED ONLY BY YOU.",
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string; engine: string }> }
) {
  let provider, engine;
  try {
    const gottenParams = await params;
    engine = gottenParams.engine;
    provider = gottenParams.provider;
  } catch {
    return genModelNotFoundRes();
  }

  let userId: number, webBalance: number;
  try {
    const userIdMayBeNan = Number(req.headers.get("userId") || "abc");
    const webBalanceMayBeNan = Number(
      req.headers.get("userWebBalance") || "abc"
    );
    if (isNaN(userIdMayBeNan) || isNaN(webBalanceMayBeNan)) {
      throw new Error("Unauthorized");
    }

    userId = userIdMayBeNan;
    webBalance = webBalanceMayBeNan;
  } catch {
    return genUnauthorizedRes(UnauthorizedReason.UNAUTH);
  }
  if (!webBalance) return genBalanceNotEnoughRes();

  let parsed;
  try {
    const json = await req.json();
    parsed = RequestSchema.safeParse(json);
    if (!parsed.success) throw new Error("InvalidJson");
  } catch (e: unknown) {
    if ((e as { message: string }).message === "InvalidJson") {
      return NextResponse.json(
        { error: parsed?.error?.format() },
        { status: 400 }
      );
    }

    return geninvalidJsonBodyRes();
  }

  const { messages: _messages } = parsed.data;
  if (!_messages?.length) return NextResponse.json({}, { status: 204 });
  const messages: CoreMessage[] = [defaultAiSystemPrompt, ..._messages];

  let model;
  try {
    const code: string = `${provider}/${engine}`;
    model = (await getModelsMap()).get(code);
    if (!model) throw new Error("ModelNotFound");
  } catch {
    return genModelNotFoundRes();
  }

  try {
    const enc = getEncoding(
      `${model.estimatedEncodingBase.toLocaleLowerCase()}_base` as TiktokenEncoding
    );
    const inTokenEstCount = enc.encode(
      messages.map((m) => m.content).join(" ")
    ).length;

    if (calcWebCostCost(inTokenEstCount, 1000, model) > webBalance) {
      throw new Error("BalanceInsufficient");
    }
  } catch (e: unknown) {
    if ((e as { message: string }).message !== "BalanceInsufficient") {
      error("WebChatTikTokenUnexpectedError", { error: e });
    }

    return genBalanceNotEnoughRes();
  }

  try {
    const s = streamText({
      messages,
      // With the current implemention of Vercel AI SDK there's no way to calculate user token usage if cancelled.
      // Instead we're continuing it and charging the user with.
      // abortSignal: req.signal,
      // experimental_transform: smoothStream({chunking: 'word'}),
      model: openrouter("deepseek/deepseek-r1:free"),
      onError: (e) => error("WebChatStreamingError", { error: e }),
      onFinish: async ({ usage }) => {
        const cost = calcWebCostCost(
          usage.promptTokens,
          usage.completionTokens,
          model
        );
        const newWebLlmRequest = {
          data: {
            cost,
            userId,
            llmModelId: model.id,
            inputTokensUsed: usage.promptTokens,
            outputTokensUsed: usage.completionTokens,
          },
        };

        try {
          await Promise.all([
            prisma.webLlmRequest.create(newWebLlmRequest),
            prisma.user.update({
              where: { id: userId },
              data: { webBalance: { increment: -cost } },
            }),
          ]);
        } catch (e) {
          error("WebChatUsageUpdateError", { error: e, newWebLlmRequest });
        }
      },
    });

    s.consumeStream();
    return s.toDataStreamResponse({
      status: 200,
      sendUsage: false,
      sendReasoning: true,
    });
  } catch (e) {
    error("WebChatUnexpectedError", { error: e });
    return genUnexpectedErrorRes(e);
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
    responseLimit: "20mb",
  },
  maxDuration: 120,
};
