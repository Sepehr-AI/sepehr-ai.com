/* eslint-disable @typescript-eslint/no-explicit-any */

import { z } from "zod";
import { error } from "@/lib/log";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getModelsMap } from "@/lib/models";
import { decrypt } from "@/lib/openrouterApiKey";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, type CoreMessage, coreMessageSchema } from "ai";

// 408
class TimeoutError extends Error {}
// 416
class MaxTokensError extends Error {}
// 429
class RateLimitError extends Error {}
// 400
class ValidationError extends Error {}
// 500
class UnexpectedError extends Error {}
// 404
class ModelNotFoundError extends Error {}
// 403
class AuthorizationError extends Error {}
// 413
class MaxContextLengthError extends Error {}
// 402
class InsufficientFundsError extends Error {}
// 401
class InvalidCredentialsError extends Error {}
// 403, 502, 503
class NoAvailableProviderError extends Error {}

const tryOrErr = async <T extends Error>(
  f: () => Promise<unknown>,
  ErrorConstructor: new () => T,
) => {
  try {
    await f();
  } catch {
    const e = new ErrorConstructor();
    // @ts-expect-error attach for debugging
    e.cause = origErr;
    throw e;
  }
};

const USE_ACTUAL_SELECTED_MODEL: boolean =
  (process.env.USE_ACTUAL_SELECTED_MODEL || "").toLowerCase() === "true";
const AES_ENCRYPTION_MASTERKEY: Buffer = Buffer.from(
  process.env.AES_ENCRYPTION_MASTERKEY || "",
  "hex",
);

const RequestSchema = z.object({
  messages: z.array(coreMessageSchema).nonempty(),
});

const defaultAiSystemPrompt: CoreMessage = {
  role: "system",
  content:
    "Farsi is default but be flexible based on how the user communicates.",
};

function errorToStatus(e: any): number {
  if (typeof e !== "object" || typeof e.constructor !== "function") return 500;

  switch (e.constructor) {
    case TimeoutError:
      return 408;
    case MaxTokensError:
      return 416;
    case RateLimitError:
      return 429;
    case ValidationError:
      return 400;
    case UnexpectedError:
      return 500;
    case ModelNotFoundError:
      return 404;
    case AuthorizationError:
      return 403;
    case MaxContextLengthError:
      return 413;
    case InsufficientFundsError:
      return 402;
    case InvalidCredentialsError:
      return 401;
    case NoAvailableProviderError:
      return 503;
    default:
      return 500;
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string; engine: string }> },
) {
  try {
    const userId = Number(req.headers.get("userId") || "abc");
    if (isNaN(userId)) throw new AuthorizationError();

    let apiKey!: string;
    await tryOrErr(async () => {
      const res = await prisma.openrouterApiKey.findUnique({
        where: { userId },
        select: { metadata: true },
      });
      if (!res || !res.metadata.length) throw new InsufficientFundsError();

      apiKey = decrypt(res.metadata, AES_ENCRYPTION_MASTERKEY);
    }, InsufficientFundsError);

    let json!: z.infer<typeof RequestSchema>, engine, provider;
    await tryOrErr(async () => {
      ({ engine, provider } = await params);

      json = await req.json();
      const parsed = await RequestSchema.safeParseAsync(json);
      if (!parsed.success) throw new ValidationError();
    }, ValidationError);
    const messages: CoreMessage[] = [defaultAiSystemPrompt, ...json.messages];

    const modelCode: string = `${provider}/${engine}`;
    await tryOrErr(async () => {
      const model = (await getModelsMap()).get(modelCode);
      if (!model) throw new Error("ModelNotFound");
    }, ModelNotFoundError);

    const s = streamText({
      messages,
      abortSignal: req.signal,
      model: createOpenRouter({
        apiKey,
        extraBody: {
          usage: { include: true },
          reasoning: { include: true },
        },
      })(USE_ACTUAL_SELECTED_MODEL ? modelCode : "deepseek/deepseek-r1:free"),
    });

    s.consumeStream();
    return s.toDataStreamResponse({
      status: 200,
      sendUsage: false,
      sendReasoning: true,
      getErrorMessage: (e: any) => {
        const errorAsStatusCode = (): number => {
          if (e.value?.error) {
            const raw = e.value as {
              error: {
                message: string;
                code: number;
                metadata?: { provider_name: string | null };
              };
              user_id?: string;
            };
            if (process.env.NODE_ENV === "development") {
              console.dir({ rawError: raw }, { depth: null });
            }

            if (raw.error.metadata?.provider_name) {
              error("WebChatProviderError", { error: raw });
            }

            const msg = raw.error.message.toLowerCase();
            if (msg.includes("can only afford")) return 416;
            if (msg.includes("maximum context length is")) return 413;

            return raw.error.code;
          }

          return 500;
        };

        return JSON.stringify({ status: errorAsStatusCode() });
      },
    });
  } catch (e: any) {
    const status = errorToStatus(e);
    return NextResponse.json({ status }, { status });
  }
}

export const config = {
  api: {
    responseLimit: "20mb",
  },
  maxDuration: 300,
};
