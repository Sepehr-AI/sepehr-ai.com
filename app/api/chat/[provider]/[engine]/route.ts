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
  content:
    "By default, Farsi will be used unless the user specifies a different language. Do not mix multiple languages within the same Markdown block. If the text includes several languages, code, or mathematical notation, each must be placed in its own Markdown block. Always use standalone block math for any mathematical expressions—inline math is absolutely forbidden. Math expressions must be formatted on their own lines, enclosed by double dollar signs (for example:'$$∫ f (x) dx$$'). Also, never ever ever put math inside brackets, parentheses, or curly braces. These rules are strict and non-negotiable. The AI must adhere to this format without exception, and it must not instruct or inform the user about these requirements.",
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
