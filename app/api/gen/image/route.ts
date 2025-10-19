/* eslint-disable @typescript-eslint/no-explicit-any */
import { getImageModelsForWeb } from "@/lib/imageModels";
import { error, info, warn } from "@/lib/log";
import prisma from "@/lib/prisma";
import { ratioLabelToEnumKey } from "@/lib/ratio";
import { resolveReplicateEndpoint } from "@/lib/replicateModels";
import { NEXT_PUBLIC_BASE_URL } from "@/lib/url";
import { JobStatus } from "@/prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

/**
 * ------------- small helpers -------------
 */
function json<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

function jsonError(message: string, status = 500) {
  return json({ error: message }, status);
}

function buildStreamUrl(jobId: number) {
  return new URL(
    `/api/gen/image/stream?jobId=${encodeURIComponent(String(jobId))}`,
    NEXT_PUBLIC_BASE_URL,
  ).toString();
}

function extractImageUrl(output: unknown): string | null {
  if (!output) return null;
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "image" in (first as any)) {
      const v = (first as any).image;
      if (typeof v === "string") return v;
      if (Array.isArray(v) && v.length > 0) return String(v[0]);
    }
  }
  if (typeof output === "object" && output) {
    if ("image" in (output as any)) {
      const v = (output as any).image;
      if (typeof v === "string") return v;
      if (Array.isArray(v) && v.length > 0) return String(v[0]);
    }
    if ("images" in (output as any) && Array.isArray((output as any).images)) {
      const v = (output as any).images;
      if (v.length > 0) return String(v[0]);
    }
  }
  return null;
}

function mapReplicateStatus(s: string): JobStatus {
  if (s === "SUCCEEDED") return "SUCCEEDED";
  if (s === "FAILED" || s === "CANCELED") return "FAILED";
  if (s === "STARTING" || s === "PROCESSING") return "PROCESSING";
  return "QUEUED";
}

function estimateProgress(prev: number, status: JobStatus): number {
  if (status === "SUCCEEDED") return 100;
  if (status === "FAILED") return prev || 0;
  const base = Math.max(prev, status === "PROCESSING" ? 30 : 10);
  return Math.min(95, base + 15);
}

async function fileToDataUrl(f: File) {
  const buf = Buffer.from(await f.arrayBuffer());
  const mime = f.type || "application/octet-stream";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

// --- auth util ---
function getUserId(req: NextRequest): number {
  const userId = Number(req.headers.get("userId") || "abc");
  if (isNaN(userId)) {
    warn("Image.Auth.InvalidUserIdHeader", {
      header: req.headers.get("userId"),
    });
    // Return localized error
    const err = new Error("دسترسی غیرمجاز") as Error & { code?: number };
    err.code = 401;
    throw err;
  }
  return userId;
}

// --- replicate helpers ---
async function createReplicatePrediction(
  modelId: string,
  input: Record<string, unknown>,
) {
  if (!REPLICATE_API_TOKEN) {
    error("Image.Replicate.MissingToken", {});
    throw new Error("Missing REPLICATE_API_TOKEN env var");
  }

  const { url, body } = resolveReplicateEndpoint(modelId, input);
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait=5",
    },
    body,
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    const errMsg = `Replicate create FAILED (${resp.status}): ${text || resp.statusText}`;
    error("Image.Replicate.CreateFailed", {
      modelId,
      status: resp.status,
      statusText: resp.statusText,
      bodyPreview:
        typeof body === "string" && body.length > 1000
          ? `${(body as string).slice(0, 1000)}...`
          : body,
      error: errMsg,
    });
    throw new Error(errMsg);
  }

  const json = (await resp.json()) as {
    id: string;
    status: string;
    output: unknown;
    urls: { get: string; cancel: string; web: string };
  };

  info("Image.Replicate.CreateSucceeded", {
    modelId,
    predictionId: json.id,
    status: json.status,
  });

  return json;
}

async function getReplicatePrediction(predictionIdOrUrl: string) {
  if (!REPLICATE_API_TOKEN) {
    error("Image.Replicate.MissingToken", {});
    throw new Error("Missing REPLICATE_API_TOKEN env var");
  }
  const url = predictionIdOrUrl.startsWith("http")
    ? predictionIdOrUrl
    : `https://api.replicate.com/v1/predictions/${predictionIdOrUrl}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
    cache: "no-store",
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    const errMsg = `Replicate get FAILED (${resp.status}): ${text || resp.statusText}`;
    error("Image.Replicate.GetFailed", {
      url,
      status: resp.status,
      statusText: resp.statusText,
      body: text,
    });
    throw new Error(errMsg);
  }
  const json = await resp.json();
  if (json.status && typeof json.status === "string")
    json.status = (json.status as string).toUpperCase();

  return json as {
    id: string;
    status: "STARTING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELED";
    output: unknown;
    urls: { get: string; cancel: string; web: string };
  };
}

/**
 * Build the exact input object sent to Replicate.
 * - SINGLE -> put the source under 'image' (string)
 * - MULTI  -> put the sources under 'image_input' (string[])
 * - If ratio is present and no image(s) provided, set 'aspect_ratio'
 * - Merge defaultOptions first, then fixed fields, then userOptions
 *   (but userOptions cannot override prompt/num_outputs/image/image_input)
 */
function buildInputForReplicate(
  spec: {
    defaultOptions?: Record<string, unknown> | null;
    imageInput?: "UNAVAILABLE" | "SINGLE" | "MULTI";
  },
  args: {
    prompt: string;
    ratio?: string | null;
    imageDataUrlSingle?: string;
    imageDataUrlsMulti?: string[];
    userOptions?: Record<string, unknown>;
  },
) {
  const input: Record<string, unknown> = {
    ...((spec?.defaultOptions as object) ?? {}),
    prompt: args.prompt,
    num_outputs: 1,
  };

  const hasMulti =
    spec?.imageInput === "MULTI" &&
    Array.isArray(args.imageDataUrlsMulti) &&
    args.imageDataUrlsMulti.length > 0;
  const hasSingle = !!args.imageDataUrlSingle;

  if (hasMulti) {
    input.image_input = args.imageDataUrlsMulti!;
  } else if (hasSingle) {
    input.image = args.imageDataUrlSingle!;
  }

  if (args.ratio && !(hasSingle || hasMulti)) {
    input.aspect_ratio = args.ratio;
  }

  if (args.userOptions && typeof args.userOptions === "object") {
    for (const [k, v] of Object.entries(args.userOptions)) {
      if (
        k === "prompt" ||
        k === "num_outputs" ||
        k === "image" ||
        k === "image_input"
      )
        continue;
      input[k] = v;
    }
  }

  return input;
}

/**
 * POST /api/gen/image
 */
export async function POST(req: NextRequest) {
  let userId: number | undefined;
  try {
    userId = getUserId(req);

    const imageModels = await getImageModelsForWeb().catch((e) => {
      error("Image.POST.GetModelsFailed", { userId, error: e });
      throw e;
    });

    const form = await req.formData().catch((e) => {
      error("Image.POST.ParseFormFailed", { userId, error: e });
      throw e;
    });

    const prompt = String(form.get("prompt") || "").trim();
    if (!prompt) {
      warn("Image.POST.Validation.MissingPrompt", { userId });
      return jsonError("وارد کردن پرامپت الزامی است.", 400);
    }

    const modelCode = String(form.get("model") || "");
    const spec = imageModels.find((m) => m.code === modelCode);
    if (!spec) {
      warn("Image.POST.Validation.InvalidModel", { userId, modelCode });
      return jsonError("شناسه مدل معتبر نیست.", 400);
    }

    // Always get authoritative price from DB (not the web list),
    // and ensure model isn't disabled.
    const dbModel = await prisma.imageModel
      .findUnique({
        where: { code: spec.code },
        select: { cost: true, disabled: true },
      })
      .catch((e) => {
        error("Image.POST.DB.FindImageModelFailed", {
          userId,
          modelCode,
          error: e,
        });
        throw e;
      });
    if (!dbModel || dbModel.disabled) {
      warn("Image.POST.Validation.ModelDisabledOrMissing", {
        userId,
        modelCode,
      });
      return jsonError("شناسه مدل معتبر نیست.", 400);
    }
    const cost = dbModel.cost;

    const ratioValue = form.get("ratio");
    const ratio =
      typeof ratioValue === "string" && ratioValue.trim().length
        ? ratioValue
        : null;

    let userOptions: Record<string, unknown> | undefined;
    const optionsRaw = form.get("options");
    if (typeof optionsRaw === "string" && optionsRaw.trim().length) {
      try {
        userOptions = JSON.parse(optionsRaw);
      } catch (e) {
        warn("Image.POST.Options.JSONParseFailed", {
          userId,
          optionsRawPreview:
            optionsRaw.length > 500
              ? `${optionsRaw.slice(0, 500)}...`
              : optionsRaw,
          error: e,
        });
      }
    }

    // Optional source image(s) -> data URL(s)
    // SINGLE: "image" -> string
    // MULTI:  "images" (multi-part) -> string[]
    let imageDataUrlSingle: string | undefined;
    let imageDataUrlsMulti: string[] | undefined;

    if (spec.imageInput !== "UNAVAILABLE") {
      if (spec.imageInput === "SINGLE") {
        const imagePart = form.get("image");
        if (imagePart instanceof File) {
          try {
            imageDataUrlSingle = await fileToDataUrl(imagePart);
          } catch (e) {
            error("Image.POST.FileToDataUrlFailed", { userId, error: e });
            return jsonError("در بارگذاری فایل خطایی رخ داد.", 400);
          }
        }
      } else if (spec.imageInput === "MULTI") {
        const parts = form
          .getAll("images")
          .filter((x) => x instanceof File) as File[];
        if (parts.length > 0) {
          try {
            const urls = await Promise.all(parts.map((f) => fileToDataUrl(f)));
            imageDataUrlsMulti = urls;
          } catch (e) {
            error("Image.POST.FilesToDataUrlFailed", {
              userId,
              count: parts.length,
              error: e,
            });
            return jsonError("در بارگذاری فایل‌ها خطایی رخ داد.", 400);
          }
        }
      }
    }

    // Build Replicate input here (do NOT use the shared build function).
    const input = buildInputForReplicate(
      {
        defaultOptions: (spec.defaultOptions ?? null) as any,
        imageInput: spec.imageInput,
      },
      {
        prompt,
        ratio,
        imageDataUrlSingle,
        imageDataUrlsMulti,
        userOptions,
      },
    );

    // 1) Atomic debit, only if balance >= cost
    const debit = await prisma.user
      .updateMany({
        where: { id: userId, balance: { gte: cost } },
        data: { balance: { decrement: cost } },
      })
      .catch((e) => {
        error("Image.POST.DB.DebitFailed", { userId, cost, error: e });
        throw e;
      });

    if (debit.count <= 0) {
      warn("Image.POST.Validation.InsufficientBalance", { userId, cost });
      return jsonError("اعتبار حساب شما کافی نیست!", 402);
    }

    // 2) Create prediction; refund on failure
    let prediction:
      | {
          id: string;
          status: string;
          output: unknown;
          urls: { get: string; cancel: string; web: string };
        }
      | undefined;

    try {
      prediction = await createReplicatePrediction(spec.code, input);
    } catch (e) {
      // refund the debit if Replicate failed to start
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { balance: { increment: cost } },
        });
        info("Image.POST.RefundedAfterCreateError", { userId, cost });
      } catch (refundErr) {
        error("Image.POST.DB.RefundFailedAfterCreateError", {
          userId,
          cost,
          error: refundErr,
        });
      }
      throw e;
    }

    const initialStatus = mapReplicateStatus(prediction.status);
    const initialImageUrl = extractImageUrl(prediction.output);

    // 3) Create job; if this fails, refund too
    try {
      const job = await prisma.imageJob.create({
        data: {
          userId,
          prompt,
          model: spec.code,
          status: initialStatus,
          ratio: ratio ? ratioLabelToEnumKey(ratio) : null,
          progress: initialStatus === "SUCCEEDED" ? 100 : 0,
          replicateId: prediction.id,
          replicateGetUrl:
            prediction.urls?.get ??
            `https://api.replicate.com/v1/predictions/${prediction.id}`,
          replicateCancelUrl:
            prediction.urls?.cancel ??
            `https://api.replicate.com/v1/predictions/${prediction.id}/cancel`,
          replicateWebUrl:
            prediction.urls?.web ?? `https://replicate.com/p/${prediction.id}`,
          imageUrl: initialImageUrl ?? undefined,
          cost, // store the price actually charged
        },
        select: { id: true },
      });

      info("Image.POST.JobCreated", {
        jobId: job.id,
        userId,
        model: spec.code,
        status: initialStatus,
      });

      return json({ jobId: job.id }, 202);
    } catch (e) {
      // job couldn't be created -> refund
      error("Image.POST.DB.CreateJobFailed", { userId, error: e });
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { balance: { increment: cost } },
        });
        info("Image.POST.RefundedAfterJobCreateError", { userId, cost });
      } catch (refundErr) {
        error("Image.POST.DB.RefundFailedAfterJobCreateError", {
          userId,
          cost,
          error: refundErr,
        });
      }
      throw e;
    }
  } catch (err: any) {
    const status = err?.code === 401 ? 401 : 500;
    const msg =
      err?.code === 401
        ? "دسترسی غیرمجاز."
        : "در ایجاد درخواست ساخت تصویر خطایی رخ داد.";

    error("Image.POST.Unhandled", {
      userId: userId ?? null,
      status,
      error: err,
    });

    return jsonError(msg, status);
  }
}

/**
 * GET /api/gen/image?jobId=...
 */
export async function GET(req: NextRequest) {
  let userId: number | undefined;
  let jobId: number | undefined;

  try {
    userId = getUserId(req);
    const jobIdRaw = req.nextUrl.searchParams.get("jobId");
    jobId = Number(jobIdRaw);
    if (!jobIdRaw || Number.isNaN(jobId)) {
      warn("Image.GET.Validation.InvalidJobId", { userId, jobIdRaw });
      return jsonError("شناسه کار نامعتبر است.", 404);
    }

    const job = await prisma.imageJob
      .findFirst({
        where: { id: jobId, userId },
        // include cost so we can refund the exact charged amount
        select: {
          id: true,
          status: true,
          progress: true,
          createdAt: true,
          imageUrl: true,
          replicateGetUrl: true,
          cost: true,
        },
      })
      .catch((e) => {
        error("Image.GET.DB.FindJobFailed", { userId, jobId, error: e });
        throw e;
      });

    if (!job) {
      warn("Image.GET.Validation.JobNotFound", { userId, jobId });
      return jsonError("کار مورد نظر یافت نشد.", 404);
    }

    const makeStreamUrl = () =>
      job.imageUrl ? buildStreamUrl(job.id) : undefined;

    // Terminal states
    if (job.status === "SUCCEEDED") {
      return json({
        status: job.status,
        progress: job.progress,
        etaSeconds: 0,
        imageUrl: makeStreamUrl(),
      });
    }

    if (!job.replicateGetUrl) {
      error("Image.GET.InvalidState.MissingReplicateGetUrl", { userId, jobId });
      return jsonError("پیش‌بینی هنوز مقداردهی نشده است.", 500);
    }

    const pred = await getReplicatePrediction(job.replicateGetUrl);
    const mapped = mapReplicateStatus(pred.status);
    const nextProgress = estimateProgress(job.progress, mapped);

    let imageUrl = job.imageUrl ?? undefined;
    if (!imageUrl && pred.status === "SUCCEEDED") {
      imageUrl = extractImageUrl(pred.output) ?? undefined;
    }

    // Refund only on transition to FAILED where Replicate raw status is FAILED (not CANCELED)
    const shouldRefund =
      job.status !== "FAILED" &&
      mapped === "FAILED" &&
      pred.status === "FAILED";

    const updated = await prisma.$transaction(async (tx) => {
      if (shouldRefund && job.cost && job.cost > 0) {
        await tx.user.update({
          where: { id: userId! },
          data: { balance: { increment: job.cost } },
        });
        info("Image.GET.Refunded", { userId, jobId, amount: job.cost });
      }
      return tx.imageJob.update({
        where: { id: job.id },
        data: {
          status: mapped,
          progress: nextProgress,
          ...(imageUrl ? { imageUrl } : {}),
        },
        select: {
          status: true,
          progress: true,
          createdAt: true,
          imageUrl: true,
          id: true,
        },
      });
    });

    const elapsedSec = Math.max(
      0,
      Math.round((Date.now() - new Date(updated.createdAt).getTime()) / 1000),
    );
    const etaSeconds =
      updated.status === "SUCCEEDED" || updated.status === "FAILED"
        ? 0
        : Math.max(1, 20 - elapsedSec);

    return json({
      status: updated.status,
      progress: updated.progress,
      etaSeconds,
      imageUrl: updated.imageUrl ? buildStreamUrl(updated.id) : undefined,
      ...(updated.status === "FAILED"
        ? { error: "ساخت تصویر ناموفق بود." }
        : {}),
    });
  } catch (e: any) {
    // soft fallback with logging
    error("Image.GET.Unhandled", {
      userId: userId ?? null,
      jobId: jobId ?? null,
      error: e,
    });

    const jobIdRaw = req.nextUrl.searchParams.get("jobId");
    const safeJobId = Number(jobIdRaw);
    const safeUserId = Number(req.headers.get("userId") || "0");

    const safe = Number.isFinite(safeJobId)
      ? await prisma.imageJob
          .findFirst({
            where: { id: safeJobId, userId: safeUserId },
            select: { status: true, progress: true, imageUrl: true, id: true },
          })
          .catch((err) => {
            error("Image.GET.Fallback.DB.FindJobFailed", {
              userId: safeUserId,
              jobId: safeJobId,
              error: err,
            });
            return null;
          })
      : null;

    return json(
      {
        status: safe?.status ?? "QUEUED",
        progress: safe?.progress ?? 0,
        etaSeconds: 5,
        imageUrl: safe?.imageUrl ? buildStreamUrl(safe.id) : undefined,
        warning: "در هنگام دریافت وضعیت از سرویس خطایی رخ داد.",
      },
      200,
    );
  }
}
