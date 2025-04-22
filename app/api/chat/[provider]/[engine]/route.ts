/* eslint-disable @typescript-eslint/no-explicit-any */

import { z } from "zod";
import { error } from "@/lib/log";
import { NextResponse } from "next/server";
import { getModelsMap } from "@/lib/models";
import { decrypt } from "@/lib/openrouterApiKey";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  streamText,
  type CoreMessage,
  coreMessageSchema,
  TypeValidationError,
} from "ai";

class ModelError extends Error {}
class ContextError extends Error {}
class PaymentError extends Error {}
class MessagesError extends Error {}
class ValidationError extends Error {}
class UnexpectedError extends Error {}
class AuthorizationError extends Error {}
class NotEnoughCreditsError extends Error {}
const tryOrErr = async <T extends Error>(
  f: () => Promise<unknown>,
  ErrorConstructor: new () => T,
) => {
  try {
    await f();
  } catch {
    throw new ErrorConstructor();
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
    case ModelError:
      return 404;
    case ContextError:
      return 413;
    case PaymentError:
      return 402;
    case MessagesError:
      return 400;
    case ValidationError:
      return 422;
    case UnexpectedError:
      return 500;
    case AuthorizationError:
      return 403;
    case NotEnoughCreditsError:
      return 416;
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
      if (!res || !res.metadata.length) throw new PaymentError();

      apiKey = decrypt(res.metadata, AES_ENCRYPTION_MASTERKEY);
    }, PaymentError);
    const openrouter = createOpenRouter({
      apiKey,
      extraBody: {
        usage: { include: true },
        reasoning: { include: true },
      },
    });

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
    }, ModelError);

    const s = streamText({
      messages,
      abortSignal: req.signal,
      onError: (e) => error("WebChatStreamingError", { error: e }),
      model: openrouter(
        USE_ACTUAL_SELECTED_MODEL ? modelCode : "deepseek/deepseek-r1:free",
        // "deepseek/deepseek-r1:free"
      ),
    });

    s.consumeStream();
    return s.toDataStreamResponse({
      status: 200,
      sendUsage: false,
      sendReasoning: true,
      getErrorMessage: (e) => {
        const errorAsStatusCode = () => {
          if (e && TypeValidationError.isInstance(e)) {
            if (e.message.toLowerCase().includes("maximum context length is")) {
              return 413;
            }
            if (e.message.toLowerCase().includes("can only afford")) {
              return 416;
            }

            return 400;
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
