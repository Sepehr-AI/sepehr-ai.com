/* eslint-disable @typescript-eslint/no-explicit-any */
import { getImageModelsForWeb } from "@/lib/imageModels";
import prisma from "@/lib/prisma";
import { ratioLabelToEnumKey } from "@/lib/ratio";
import {
  buildReplicateImageInput,
  resolveReplicateEndpoint,
  parseSize as sharedParseSize,
} from "@/lib/replicateModels";
import { NEXT_PUBLIC_BASE_URL } from "@/lib/url";
import { JobStatus } from "@/prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// --- auth util ---
function getUserId(req: NextRequest): number {
  const userId = Number(req.headers.get("userId") || "abc");
  if (isNaN(userId)) {
    // Return localized error
    throw Object.assign(new Error("دسترسی غیرمجاز"), { code: 401 });
  }
  return userId;
}

// --- replicate helpers ---
async function createReplicatePrediction(
  modelId: string,
  input: Record<string, unknown>,
) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("Missing REPLICATE_API_TOKEN env var");

  const { url, body } = resolveReplicateEndpoint(modelId, input);
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "wait=5",
    },
    body,
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `Replicate create FAILED (${resp.status}): ${text || resp.statusText}`,
    );
  }
  return (await resp.json()) as {
    id: string;
    status: string;
    output: unknown;
    urls: { get: string; cancel: string; web: string };
  };
}

async function getReplicatePrediction(predictionIdOrUrl: string) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("Missing REPLICATE_API_TOKEN env var");
  const url = predictionIdOrUrl.startsWith("http")
    ? predictionIdOrUrl
    : `https://api.replicate.com/v1/predictions/${predictionIdOrUrl}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `Replicate get FAILED (${resp.status}): ${text || resp.statusText}`,
    );
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

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const imageModels = await getImageModelsForWeb();
    const form = await req.formData();

    const prompt = String(form.get("prompt") || "");
    if (!prompt.trim()) {
      return NextResponse.json(
        { error: "وارد کردن پرامپت الزامی است." },
        { status: 400 },
      );
    }

    const model = String(form.get("model") || "");
    const spec = imageModels.find((m) => m.code === model);
    if (!spec) {
      return NextResponse.json(
        { error: "شناسه مدل معتبر نیست." },
        { status: 400 },
      );
    }

    // Always get authoritative price from DB (not the web list),
    // and ensure model isn't disabled.
    const dbModel = await prisma.imageModel.findUnique({
      where: { code: spec.code },
      select: { cost: true, disabled: true },
    });
    if (!dbModel || dbModel.disabled) {
      return NextResponse.json(
        { error: "شناسه مدل معتبر نیست." },
        { status: 400 },
      );
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
      } catch {
        /* ignore */
      }
    }

    // Optional source image -> data URL (small images only)
    let imageDataUrl: string | undefined;
    const imagePart = form.get("image");
    if (imagePart instanceof File && spec.imageInput !== "UNAVAILABLE") {
      const buf = Buffer.from(await imagePart.arrayBuffer());
      const mime = imagePart.type || "application/octet-stream";
      imageDataUrl = `data:${mime};base64,${buf.toString("base64")}`;
    }

    const { w, h } = sharedParseSize(ratio);
    const input = buildReplicateImageInput(spec, {
      prompt,
      ratio,
      width: w,
      height: h,
      imageDataUrl,
      userOptions,
    });

    // 1) Atomic debit, only if balance >= cost
    const debit = await prisma.user.updateMany({
      where: { id: userId, balance: { gte: cost } },
      data: { balance: { decrement: cost } },
    });
    if (debit.count <= 0) {
      return NextResponse.json(
        { error: "اعتبار حساب شما کافی نیست!" },
        { status: 402 },
      ); // Payment Required
    }

    // 2) Create prediction; refund on failure
    let prediction: {
      id: string;
      status: string;
      output: unknown;
      urls: { get: string; cancel: string; web: string };
    };
    try {
      prediction = await createReplicatePrediction(spec.code, input);
    } catch (e) {
      // refund the debit if Replicate failed to start
      await prisma.user.update({
        where: { id: userId },
        data: { balance: { increment: cost } },
      });
      throw e;
    }

    const initialStatus = mapReplicateStatus(prediction.status);
    const initialImageUrl =
      Array.isArray(prediction.output) && prediction.output.length > 0
        ? String(prediction.output[0])
        : typeof prediction.output === "string"
          ? prediction.output
          : null;

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

      return NextResponse.json({ jobId: job.id }, { status: 202 });
    } catch (e) {
      // job couldn't be created -> refund
      await prisma.user.update({
        where: { id: userId },
        data: { balance: { increment: cost } },
      });
      throw e;
    }
  } catch (err: any) {
    const status = err?.code === 401 ? 401 : 500;
    const msg =
      err?.code === 401
        ? "دسترسی غیرمجاز."
        : "در ایجاد درخواست ساخت تصویر خطایی رخ داد.";
    return NextResponse.json({ error: msg }, { status });
  }
}

// GET /api/gen/image?jobId=...
export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const jobIdRaw = req.nextUrl.searchParams.get("jobId");
    const jobId = Number(jobIdRaw);
    if (!jobIdRaw || Number.isNaN(jobId)) {
      return NextResponse.json(
        { error: "شناسه کار نامعتبر است." },
        { status: 404 },
      );
    }

    const job = await prisma.imageJob.findFirst({
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
    });

    if (!job) {
      return NextResponse.json(
        { error: "کار مورد نظر یافت نشد." },
        { status: 404 },
      );
    }

    const makeStreamUrl = () =>
      job.imageUrl
        ? new URL(
            `/api/gen/image/stream?jobId=${encodeURIComponent(String(job.id))}`,
            NEXT_PUBLIC_BASE_URL,
          ).toString()
        : undefined;

    // Terminal states
    if (job.status === "SUCCEEDED") {
      return NextResponse.json({
        status: job.status,
        progress: job.progress,
        etaSeconds: 0,
        imageUrl: makeStreamUrl(),
        // ...(job.status === "FAILED" ? { error: "ساخت تصویر ناموفق بود." } : {}),
      });
    }

    if (!job.replicateGetUrl) {
      return NextResponse.json(
        { error: "پیش‌بینی هنوز مقداردهی نشده است." },
        { status: 500 },
      );
    }

    const pred = await getReplicatePrediction(job.replicateGetUrl);
    const mapped = mapReplicateStatus(pred.status);
    const nextProgress = estimateProgress(job.progress, mapped);

    let imageUrl = job.imageUrl ?? undefined;
    if (!imageUrl && pred.status === "SUCCEEDED") {
      if (Array.isArray(pred.output) && pred.output.length > 0) {
        imageUrl = String(pred.output[0]);
      } else if (typeof pred.output === "string") {
        imageUrl = pred.output;
      }
    }

    // Refund only on transition to FAILED where Replicate raw status is FAILED (not CANCELED)
    const shouldRefund =
      job.status !== "FAILED" &&
      mapped === "FAILED" &&
      pred.status === "FAILED";

    const updated = await prisma.$transaction(async (tx) => {
      if (shouldRefund && job.cost && job.cost > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { balance: { increment: job.cost } },
        });
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

    return NextResponse.json({
      status: updated.status,
      progress: updated.progress,
      etaSeconds,
      imageUrl: updated.imageUrl
        ? new URL(
            `/api/gen/image/stream?jobId=${encodeURIComponent(String(updated.id))}`,
            NEXT_PUBLIC_BASE_URL,
          ).toString()
        : undefined,
      ...(updated.status === "FAILED"
        ? { error: "ساخت تصویر ناموفق بود." }
        : {}),
    });
  } catch {
    // unchanged fallback
    const jobIdRaw = req.nextUrl.searchParams.get("jobId");
    const jobId = Number(jobIdRaw);
    const userId = Number(req.headers.get("userId") || "0");

    const safe = Number.isFinite(jobId)
      ? await prisma.imageJob.findFirst({
          where: { id: jobId, userId },
          select: { status: true, progress: true, imageUrl: true, id: true },
        })
      : null;

    return NextResponse.json(
      {
        status: safe?.status ?? "QUEUED",
        progress: safe?.progress ?? 0,
        etaSeconds: 5,
        imageUrl: safe?.imageUrl
          ? new URL(
              `/api/gen/image/stream?jobId=${encodeURIComponent(String(safe.id))}`,
              NEXT_PUBLIC_BASE_URL,
            ).toString()
          : undefined,
        warning: "در هنگام دریافت وضعیت از سرویس خطایی رخ داد.",
      },
      { status: 200 },
    );
  }
}
