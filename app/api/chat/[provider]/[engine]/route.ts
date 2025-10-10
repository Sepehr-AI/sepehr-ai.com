/* eslint-disable @typescript-eslint/no-explicit-any */

import { z } from "zod";
import { error } from "@/lib/log";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getLanguageModelsMap, type LanguageModelDto } from "@/lib/languageModels";
import { createReplicate } from "@/replicate-chat-provider";
import {
  streamText,
  type UIMessage,
  type ModelMessage,

  convertToModelMessages,
} from "ai";

// 408
class TimeoutError extends Error { }
// 416
class MaxTokensError extends Error { }
// 429
class RateLimitError extends Error { }
// 400
class ValidationError extends Error { }
// 500
class UnexpectedError extends Error { }
// 404
class ModelNotFoundError extends Error { }
// 403
class AuthorizationError extends Error { }
// 413
class MaxContextLengthError extends Error { }
// 402
class InsufficientFundsError extends Error { }
// 401
class InvalidCredentialsError extends Error { }
// 403, 502, 503
class NoAvailableProviderError extends Error { }
// 415
class UnsupportedMediaTypeError extends Error { }

const tryOrErr = async <T extends Error>(
  f: () => Promise<unknown>,
  ErrorConstructor: new (message?: string, options?: { cause?: unknown }) => T,
) => {
  try {
    await f();
  } catch (orig: any) {
    throw new ErrorConstructor(
      ((orig as Error) || { message: undefined }).message,
      { cause: orig },
    );
  }
};

const USE_ACTUAL_SELECTED_MODEL: boolean =
  (process.env.USE_ACTUAL_SELECTED_MODEL || "").toLowerCase() === "true";

const RequestSchema = z.object({
  messages: z.array(z.any()).nonempty(),
});

const defaultAiSystemPrompt: ModelMessage = {
  role: "system",
  content: "Farsi is default but be flexible based on how the user communicates.",
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
    case UnsupportedMediaTypeError:
      return 415;
    default:
      error("Invalid error to status", { error: e });
      return 500;
  }
}

const openrouterSdkErrorDataSchema = z.object({
  data: z.object({
    error: z.object({
      code: z.number(),
      message: z.string(),
      metadata: z
        .object({ provider_name: z.string().nullable().optional() })
        .nullable()
        .optional(),
    }),
    userId: z.string().nullable().optional(),
  }),
});

// helpers

function concurrencyLimit(balance: number): number {
  if (balance <= 3) return 1;
  if (balance <= 6) return 2;
  return 3;
}

function minDollarsForOutputTokens(model: LanguageModelDto, tokens: number): number {
  // cost is quoted per 1M tokens
  return (model.milOutCost / 1_000_000) * tokens;
}

async function finalizeJob(jobId: number | null, cost: number) {
  if (!jobId) return;
  try {
    await prisma.languageJob.update({
      where: { id: jobId },
      data: { cost },
    });
  } catch (e) {
    error("FinalizeLanguageJobFailed", { jobId, cost, error: e });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string; engine: string }> },
) {
  let jobId: number | null = null;

  try {
    const userId = Number(req.headers.get("userId") || "abc");
    if (isNaN(userId)) throw new AuthorizationError();

    let json!: z.infer<typeof RequestSchema>, engine, provider;
    await tryOrErr(async () => {
      ({ engine, provider } = await params);

      json = await req.json();
      const parsed = await RequestSchema.safeParseAsync(json);
      if (!parsed.success) throw new ValidationError();
    }, ValidationError);

    const messages: ModelMessage[] = [
      defaultAiSystemPrompt,
      ...convertToModelMessages(json.messages as UIMessage[]),
    ];

    const modelCode: string = `${provider}/${engine}`;
    let model: LanguageModelDto | undefined = undefined;

    // resolve model
    await tryOrErr(async () => {
      model = (await getLanguageModelsMap()).get(modelCode);
      if (!model) throw new Error("ModelNotFound");
    }, ModelNotFoundError);

    // transactional: enforce credits + concurrency, then create job
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { balance: true },
        });
        if (!user) throw new AuthorizationError();

        const limit = concurrencyLimit(user.balance);

        const activeJobs = await tx.languageJob.count({
          where: {
            userId,
            cost: null, // unfinished job
            createdAt: { gte: tenMinutesAgo },
          },
        });

        if (activeJobs >= limit) {
          throw new RateLimitError("Concurrency limit reached for this user");
        }

        // must have enough for 1000 output tokens on this model
        const required = minDollarsForOutputTokens(model!, 1000);
        if (user.balance < required) {
          throw new InsufficientFundsError("Not enough credits for 1000 output tokens");
        }

        const job = await tx.languageJob.create({
          data: { userId },
          select: { id: true },
        });
        jobId = job.id;
      },
      // Postgres supports serializable.
      { isolationLevel: "Serializable" }
    );

    const s = streamText({
      messages,
      abortSignal: req.signal,
      model: createReplicate()(USE_ACTUAL_SELECTED_MODEL ? modelCode : "deepseek/deepseek-r1:free"),
      providerOptions: { model: model! },
      onFinish: async ({ usage, ...otherProps }) => {
        let cost = 0;
        if (usage.inputTokens && usage.outputTokens) {
          cost =
            (model!.milInCost / 1_000_000) * usage.inputTokens +
            (model!.milOutCost / 1_000_000) * usage.outputTokens;

          if (process.env.NODE_ENV === "development") {
            console.log({ usage, cost, jobId });
          }

          await prisma.user.updateMany({
            where: { id: userId },
            data: { balance: { decrement: cost } },
          });
        } else {
          error("NoTokenUsageReportedByReplicateProvider", { usage, otherProps, jobId });
        }

        await finalizeJob(jobId, cost);
      },
    });

    return s.toUIMessageStreamResponse({
      status: 200,
      sendReasoning: true,
      onError: (_e: any) => {
        // make sure this job is released even if streaming fails
        if (jobId) {
          void finalizeJob(jobId, 0);
        }

        const parsed = openrouterSdkErrorDataSchema.safeParse(_e);
        if (!(_e instanceof Error) || !parsed.success) {
          error("Vercel AI Core error is not an instance of Error", {
            error: _e,
            parseError: parsed.error,
          });
          return JSON.stringify({ status: 500 });
        }
        const rawError = parsed.data.data.error;
        const { code, message: _message, metadata } = rawError;
        const message = _message.toLocaleLowerCase();

        const errorAsStatusCode = (): number => {
          if (process.env.NODE_ENV === "development") {
            console.dir({ rawError }, { depth: null });
          }

          if (metadata?.provider_name) {
            error("WebChatProviderError", { error: rawError });
          }

          if (message.includes("can only afford")) return 416;
          if (message.includes("maximum context length is")) return 413;
          if (
            message.includes("no endpoints found that support") &&
            message.includes("input")
          ) {
            return 415;
          }

          return code;
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