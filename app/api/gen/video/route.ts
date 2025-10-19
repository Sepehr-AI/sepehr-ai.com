/* eslint-disable @typescript-eslint/no-explicit-any */
import { error, info, warn } from "@/lib/log";
import prisma from "@/lib/prisma";
import { ratioLabelToEnumKey } from "@/lib/ratio";
import { resolveReplicateEndpoint } from "@/lib/replicateModels";
import { NEXT_PUBLIC_BASE_URL } from "@/lib/url";
import { getVideoModelsForWeb } from "@/lib/videoModels";
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
    `/api/gen/video/stream?jobId=${encodeURIComponent(String(jobId))}`,
    NEXT_PUBLIC_BASE_URL,
  ).toString();
}

function extractVideoUrl(output: unknown): string | null {
  if (!output) return null;

  if (typeof output === "string") return output;

  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "video" in (first as any)) {
      const v = (first as any).video;
      if (typeof v === "string") return v;
      if (Array.isArray(v) && v.length > 0) return String(v[0]);
    }
  }

  if (typeof output === "object" && "video" in (output as any)) {
    const v = (output as any).video;
    if (typeof v === "string") return v;
    if (Array.isArray(v) && v.length > 0) return String(v[0]);
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

function getUserId(req: NextRequest): number {
  const userId = Number(req.headers.get("userId") || "abc");
  if (isNaN(userId)) {
    // Unauthorized attempts are expected but noteworthy
    warn("Video.Auth.InvalidUserIdHeader", {
      header: req.headers.get("userId"),
    });
    const err = new Error("دسترسی غیرمجاز") as Error & { code?: number };
    err.code = 401;
    throw err;
  }
  return userId;
}

/**
 * ------------- Replicate helpers -------------
 */
async function createReplicatePrediction(
  modelId: string,
  input: Record<string, unknown>,
) {
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
    const errMsg = `Replicate create FAILED (${resp.status}): ${
      text || resp.statusText
    }`;
    error("Video.Replicate.CreateFailed", {
      modelId,
      status: resp.status,
      statusText: resp.statusText,
      bodyPreview:
        typeof body === "string" && body.length > 1000
          ? `${body.slice(0, 1000)}...`
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

  info("Video.Replicate.CreateSucceeded", {
    modelId,
    predictionId: json.id,
    status: json.status,
  });

  return json;
}

async function getReplicatePrediction(predictionIdOrUrl: string) {
  const url = predictionIdOrUrl.startsWith("http")
    ? predictionIdOrUrl
    : `https://api.replicate.com/v1/predictions/${predictionIdOrUrl}`;

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
    cache: "no-store",
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    const errMsg = `Replicate get FAILED (${resp.status}): ${
      text || resp.statusText
    }`;
    error("Video.Replicate.GetFailed", {
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
 * ------------- file keys for upload -------------
 */
const singleFileKeys = [
  "image",
  "start_image",
  "end_image",
  "first_frame_image",
  "last_frame_image",
  "audio",
] as const;

/**
 * POST /api/gen/video
 */
export async function POST(req: NextRequest) {
  let userId: number | undefined;
  try {
    userId = getUserId(req);

    const videoModels = await getVideoModelsForWeb().catch((e) => {
      error("Video.POST.GetModelsFailed", { error: e });
      throw e;
    });

    const form = await req.formData().catch((e) => {
      error("Video.POST.ParseFormFailed", { error: e });
      throw e;
    });

    const prompt = String(form.get("prompt") || "").trim();
    if (!prompt) {
      warn("Video.POST.Validation.MissingPrompt", { userId });
      return jsonError("وارد کردن پرامپت الزامی است.", 400);
    }

    const modelCode = String(form.get("model") || "");
    const spec = videoModels.find((m) => m.code === modelCode);
    if (!spec) {
      warn("Video.POST.Validation.InvalidModel", { userId, modelCode });
      return jsonError("شناسه مدل معتبر نیست.", 400);
    }

    const dbModel = await prisma.videoModel
      .findUnique({
        where: { code: spec.code },
        select: { cost: true, disabled: true },
      })
      .catch((e) => {
        error("Video.POST.DB.FindVideoModelFailed", {
          userId,
          modelCode,
          error: e,
        });
        throw e;
      });

    if (!dbModel || dbModel.disabled) {
      warn("Video.POST.Validation.ModelDisabledOrMissing", {
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

    const lengthRaw = form.get("lengthSec");
    const lengthSec =
      typeof lengthRaw === "string" && lengthRaw.trim().length
        ? Math.max(1, Math.min(60, Number(lengthRaw)))
        : null;

    let userOptions: Record<string, unknown> | undefined;
    const optionsRaw = form.get("options");
    if (typeof optionsRaw === "string" && optionsRaw.trim().length) {
      try {
        userOptions = JSON.parse(optionsRaw);
      } catch (e) {
        warn("Video.POST.Options.JSONParseFailed", {
          userId,
          optionsRawPreview:
            optionsRaw.length > 500
              ? `${optionsRaw.slice(0, 500)}...`
              : optionsRaw,
          error: e,
        });
      }
    }

    const media: Record<string, string | string[]> = {};

    // single-file fields (only if model supports)
    for (const k of singleFileKeys) {
      const supports =
        (k === "image" && spec.image) ||
        (k === "start_image" && spec.startImage) ||
        (k === "end_image" && spec.endImage) ||
        (k === "first_frame_image" && spec.firstFrameImage) ||
        (k === "last_frame_image" && spec.lastFrameImage) ||
        (k === "audio" && spec.audio);

      if (!supports) continue;
      const part = form.get(k);
      if (part instanceof File) {
        try {
          media[k] = await fileToDataUrl(part);
        } catch (e) {
          error("Video.POST.FileToDataUrlFailed", { userId, key: k, error: e });
          return jsonError("در بارگذاری فایل خطایی رخ داد.", 400);
        }
      }
    }

    // multi-file: reference_images
    if (spec.allowedReferenceImages) {
      const refs = form
        .getAll("reference_images")
        .filter((x): x is File => x instanceof File);
      if (refs.length > 0) {
        try {
          media["reference_images"] = await Promise.all(
            refs.map(fileToDataUrl),
          );
        } catch (e) {
          error("Video.POST.ReferenceImages.ToDataUrlFailed", {
            userId,
            count: refs.length,
            error: e,
          });
          return jsonError("در بارگذاری تصاویر مرجع خطایی رخ داد.", 400);
        }
      }
    }

    // Replicate input
    const input: Record<string, unknown> = {
      prompt,
      ...((spec.defaultOptions as any) || {}),
      ...(userOptions || {}),
      ...(ratio && ratio !== "X:Y" ? { aspect_ratio: ratio } : {}),
      ...(typeof lengthSec === "number" ? { duration: lengthSec } : {}),
      ...media,
    };

    // 1) Atomic debit
    const debit = await prisma.user
      .updateMany({
        where: { id: userId, balance: { gte: cost } },
        data: { balance: { decrement: cost } },
      })
      .catch((e) => {
        error("Video.POST.DB.DebitFailed", { userId, cost, error: e });
        throw e;
      });

    if (debit.count <= 0) {
      warn("Video.POST.Validation.InsufficientBalance", { userId, cost });
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
      // Refund
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { balance: { increment: cost } },
        });
      } catch (refundErr) {
        error("Video.POST.DB.RefundFailedAfterCreateError", {
          userId,
          cost,
          error: refundErr,
        });
      }
      // Bubble up to outer catch to return 500
      throw e;
    }

    const initialStatus = mapReplicateStatus(prediction.status);
    const initialVideoUrl = extractVideoUrl(prediction.output);

    // 3) Create job; refund if fails
    try {
      const job = await prisma.videoJob.create({
        data: {
          userId,
          prompt,
          model: spec.code,
          lengthSec: lengthSec ?? undefined,
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
          videoUrl: initialVideoUrl ?? undefined,
          cost,
        },
        select: { id: true },
      });

      info("Video.POST.JobCreated", {
        jobId: job.id,
        userId,
        model: spec.code,
        status: initialStatus,
      });

      return json({ jobId: job.id }, 202);
    } catch (e) {
      // Refund on DB job create failure
      error("Video.POST.DB.CreateJobFailed", { userId, error: e });
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { balance: { increment: cost } },
        });
      } catch (refundErr) {
        error("Video.POST.DB.RefundFailedAfterJobCreateError", {
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
        : "در ایجاد درخواست ساخت ویدئو خطایی رخ داد.";

    error("Video.POST.Unhandled", {
      userId: userId ?? null,
      status,
      error: err,
    });

    return jsonError(msg, status);
  }
}

/**
 * GET /api/gen/video?jobId=...
 */
export async function GET(req: NextRequest) {
  let userId: number | undefined;
  let jobId: number | undefined;

  try {
    userId = getUserId(req);

    const jobIdRaw = req.nextUrl.searchParams.get("jobId");
    jobId = Number(jobIdRaw);
    if (!jobIdRaw || Number.isNaN(jobId)) {
      warn("Video.GET.Validation.InvalidJobId", { userId, jobIdRaw });
      return jsonError("شناسه کار نامعتبر است.", 404);
    }

    const job = await prisma.videoJob
      .findFirst({
        where: { id: jobId, userId },
        select: {
          id: true,
          status: true,
          progress: true,
          createdAt: true,
          videoUrl: true,
          replicateGetUrl: true,
          cost: true,
        },
      })
      .catch((e) => {
        error("Video.GET.DB.FindJobFailed", { userId, jobId, error: e });
        throw e;
      });

    if (!job) {
      warn("Video.GET.Validation.JobNotFound", { userId, jobId });
      return jsonError("کار مورد نظر یافت نشد.", 404);
    }

    const makeStreamUrl = () =>
      job.videoUrl ? buildStreamUrl(job.id) : undefined;

    if (job.status === "SUCCEEDED") {
      return json({
        status: job.status,
        progress: job.progress,
        videoUrl: makeStreamUrl(),
      });
    }

    if (!job.replicateGetUrl) {
      error("Video.GET.InvalidState.MissingReplicateGetUrl", { userId, jobId });
      return jsonError("پیش‌بینی هنوز مقداردهی نشده است.", 500);
    }

    const pred = await getReplicatePrediction(job.replicateGetUrl);
    const mapped = mapReplicateStatus(pred.status);
    const nextProgress = estimateProgress(job.progress, mapped);

    let videoUrl = job.videoUrl ?? undefined;
    if (!videoUrl && pred.status === "SUCCEEDED") {
      videoUrl = extractVideoUrl(pred.output) ?? undefined;
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
        info("Video.GET.Refunded", { userId, jobId, amount: job.cost });
      }
      return tx.videoJob.update({
        where: { id: job.id },
        data: {
          status: mapped,
          progress: nextProgress,
          ...(videoUrl ? { videoUrl } : {}),
        },
        select: {
          status: true,
          progress: true,
          createdAt: true,
          videoUrl: true,
          id: true,
        },
      });
    });

    return json({
      status: updated.status,
      progress: updated.progress,
      videoUrl: updated.videoUrl ? buildStreamUrl(updated.id) : undefined,
      ...(updated.status === "FAILED"
        ? { error: "ساخت ویدئو ناموفق بود." }
        : {}),
    });
  } catch (e: any) {
    // soft fallback (same approach as image route) but with logging
    error("Video.GET.Unhandled", {
      userId: userId ?? null,
      jobId: jobId ?? null,
      error: e,
    });

    const jobIdRaw = req.nextUrl.searchParams.get("jobId");
    const safeJobId = Number(jobIdRaw);
    const safeUserId = Number(req.headers.get("userId") || "0");

    const safe = Number.isFinite(safeJobId)
      ? await prisma.videoJob
          .findFirst({
            where: { id: safeJobId, userId: safeUserId },
            select: { status: true, progress: true, videoUrl: true, id: true },
          })
          .catch((err) => {
            error("Video.GET.Fallback.DB.FindJobFailed", {
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
        videoUrl: safe?.videoUrl ? buildStreamUrl(safe.id) : undefined,
        warning: "در هنگام دریافت وضعیت از سرویس خطایی رخ داد.",
      },
      200,
    );
  }
}
