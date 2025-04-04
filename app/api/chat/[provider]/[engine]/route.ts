import { z } from "zod";
import prisma from "@/lib/prisma";
import { error } from "@/lib/log";
import { NextResponse } from "next/server";
import { streamText, CoreMessage, coreMessageSchema } from "ai";
import { getModelsMap } from "@/lib/models";
import { getEncoding, TiktokenEncoding } from "js-tiktoken";
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

const USE_ACTUAL_SELECTED_MODEL = Boolean(
  process.env.USE_ACTUAL_SELECTED_MODEL || "false"
);

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const RequestSchema = z.object({
  messages: z.array(coreMessageSchema),
});

const defaultAiSystemPrompt: CoreMessage = {
  role: "system",
  content:
    "Farsi is default but be flexible based on how the user communicates.",
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
  const code: string = `${provider}/${engine}`;
  try {
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
      model: openrouter(
        USE_ACTUAL_SELECTED_MODEL ? code : "deepseek/deepseek-r1:free"
      ),
      onError: (e) => error("WebChatStreamingError", { error: e }),
      onFinish: async ({ usage }) => {
        if (
          !usage ||
          typeof usage.promptTokens === "undefined" ||
          typeof usage.completionTokens === "undefined" ||
          usage.promptTokens === null ||
          usage.completionTokens === null
        ) {
          return;
        }

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
