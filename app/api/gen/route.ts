/* eslint-disable @typescript-eslint/no-explicit-any */
import { roundToDecimals } from "@/lib/cost";
import { findModelByCode } from "@/lib/genModels";
import { error, info, warn } from "@/lib/log";
import { buildInputFromFormData } from "@/lib/modelInputHelpers";
import prisma from "@/lib/prisma";
import { resolveReplicateEndpoint } from "@/lib/replicateModels";
import { NEXT_PUBLIC_BASE_URL } from "@/lib/url";
import { JobStatus } from "@/prisma/client";
import ffprobe from "ffprobe-static";
import { NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const maxDuration = 200;

const PROJECT_ROOT = process.cwd();
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

type FileFieldKind = "audio" | "video" | "image" | "videos" | "images";

function isFileField(
  def: any,
): def is { type: FileFieldKind; inputKey: string } {
  return (
    def &&
    typeof def === "object" &&
    ["audio", "video", "image", "videos", "images"].includes(def.type) &&
    typeof def.inputKey === "string"
  );
}

// Extract file field descriptors from schema
function getSchemaFileFields(inputSchema: any[]) {
  return (Array.isArray(inputSchema) ? inputSchema : []).filter(
    isFileField,
  ) as Array<{
    type: FileFieldKind;
    inputKey: string;
    shouldBeUploadedOnProvider?: boolean;
  }>;
}

async function uploadFileToReplicate(
  file: File,
  meta?: Record<string, unknown>,
): Promise<{ id: string; getUrl: string }> {
  if (!REPLICATE_API_TOKEN)
    throw new Error("Missing REPLICATE_API_TOKEN env var");

  const fd = new FormData();
  // Always include filename; use file.name if present
  const filename = (file as any).name
    ? String((file as any).name)
    : "upload.bin";
  // Append content; letting undici set boundary and content-type
  fd.append("content", file, filename);
  if (meta) {
    // Replicate expects JSON for metadata
    fd.append(
      "metadata",
      new Blob([JSON.stringify(meta)], { type: "application/json" }),
    );
  }

  const resp = await fetch("https://api.replicate.com/v1/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
    body: fd,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `Replicate Files upload failed (${resp.status}): ${text || resp.statusText}`,
    );
  }

  const json = (await resp.json()) as {
    id: string;
    urls?: { get?: string };
    // other fields omitted
  };

  const id = json?.id;
  const getUrl = json?.urls?.get;
  if (!id || !getUrl) {
    throw new Error(
      "Replicate Files upload: missing id or urls.get in response",
    );
  }
  return { id, getUrl };
}

async function deleteReplicateFiles(fileIds: string[]) {
  if (!fileIds.length) return;
  await Promise.allSettled(
    fileIds.map(async (fid) => {
      try {
        await fetch(
          `https://api.replicate.com/v1/files/${encodeURIComponent(fid)}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
          },
        );
      } catch (e) {
        warn("Gen.Files.DeleteFailed", { fileId: fid, error: String(e) });
      }
    }),
  );
}

// Build an input patch by uploading files for schema fields that request provider upload.
// Returns: inputPatch to merge into replicate input, plus uploaded file IDs we must later delete.
async function uploadFilesFromFormAccordingToSchema(
  form: FormData,
  inputSchema: any[],
  jobIdForMeta?: number,
): Promise<{ inputPatch: Record<string, unknown>; uploadedFileIds: string[] }> {
  const fileDefs = getSchemaFileFields(inputSchema).filter(
    (d) => d.shouldBeUploadedOnProvider === true,
  );
  const inputPatch: Record<string, unknown> = {};
  const uploadedIds: string[] = [];

  for (const def of fileDefs) {
    const key = def.inputKey;
    const isMulti = def.type === "images" || def.type === "videos";

    // Gather files from the incoming FormData under this inputKey
    const values = isMulti ? form.getAll(key) : [form.get(key)];
    const files = values.filter(
      (v): v is File =>
        typeof v === "object" && v != null && "arrayBuffer" in (v as any),
    );

    if (!files.length) continue;

    // Upload sequentially to preserve order for multi inputs
    const urls: string[] = [];
    for (const file of files) {
      const { id, getUrl } = await uploadFileToReplicate(file, {
        jobId: jobIdForMeta ?? null,
        inputKey: key,
      });
      uploadedIds.push(id);
      urls.push(getUrl);
    }

    // Assign back into input: single string for single field, array for multi
    inputPatch[key] = isMulti ? urls : urls[0];
  }

  return { inputPatch, uploadedFileIds: uploadedIds };
}

// Heuristic: find a binary video file based on inputSchema (types: video | videos)
async function probeVideoDurationFromForm(
  form: FormData,
  inputSchema: any[],
): Promise<{ seconds: number; key: string; filename?: string } | null> {
  // Guard: ffprobe path must exist
  let ffprobePath = (ffprobe as any)?.path as string | undefined;
  if (!ffprobePath) return null;

  ffprobePath = ffprobePath.replace(
    "/ROOT/node_modules/",
    `${PROJECT_ROOT}/node_modules/`,
  );

  // Find first video field defined in schema that is present in form
  const videoDefs = getSchemaFileFields(inputSchema).filter(
    (d) => d.type === "video" || d.type === "videos",
  );
  let pickedKey: string | undefined;
  let pickedFile: File | undefined;

  for (const def of videoDefs) {
    const key = def.inputKey;
    const values = def.type === "videos" ? form.getAll(key) : [form.get(key)];
    const files = values.filter(
      (v): v is File =>
        typeof v === "object" && v != null && "arrayBuffer" in (v as any),
    );
    if (files.length) {
      pickedKey = key;
      pickedFile = files[0];
      break;
    }
  }

  if (!pickedKey || !pickedFile) return null;

  const buf = Buffer.from(await pickedFile.arrayBuffer());
  const safeName = (pickedFile as any).name
    ? String((pickedFile as any).name)
    : "video";
  const tmpPath = path.join(
    os.tmpdir(),
    `gen-${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`,
  );

  try {
    await fs.writeFile(tmpPath, buf);

    const { stdout } = await execFileAsync(ffprobePath, [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "json",
      tmpPath,
    ]);

    let seconds = 0;
    try {
      const parsed = JSON.parse(stdout);
      const dur = parsed?.format?.duration
        ? Number(parsed.format.duration)
        : NaN;
      if (Number.isFinite(dur) && dur > 0) {
        seconds = Math.ceil(dur);
      }
    } catch {
      /* ignore */
    }

    if (seconds > 0) {
      info("Gen.POST.VideoDuration.Probed", {
        key: pickedKey,
        filename: safeName,
        seconds,
      });
      return { seconds, key: pickedKey, filename: safeName };
    }
    return null;
  } finally {
    fs.unlink(tmpPath).catch(() => {});
  }
}

function json<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
function jsonError(message: string, status = 500) {
  return json({ error: message }, status);
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
function getUserId(req: NextRequest): number {
  const userId = Number(req.headers.get("userId") || "abc");
  if (isNaN(userId)) {
    warn("Gen.Auth.InvalidUserIdHeader", { header: req.headers.get("userId") });
    const err = new Error("دسترسی غیرمجاز") as Error & { code?: number };
    err.code = 401;
    throw err;
  }
  return userId;
}
function buildStreamUrl(jobId: number) {
  return new URL(
    `/api/gen/stream?jobId=${encodeURIComponent(String(jobId))}`,
    NEXT_PUBLIC_BASE_URL,
  ).toString();
}
// Helper to extract duration seconds from built input or form according to schema conventions
function extractDurationSeconds(
  replicateInput: Record<string, unknown>,
  form: FormData,
  inputSchema: any[],
): number | null {
  const keys = ["duration", "lengthSec", "length", "video_duration"];
  for (const k of keys) {
    const v =
      (replicateInput[k] as unknown) ??
      (typeof form.get(k) === "string" ? Number(form.get(k)) : null);
    const num = typeof v === "string" ? Number(v) : (v as number | null);
    if (typeof num === "number" && Number.isFinite(num)) return num;
  }
  // heuristic: a selection field labeled like duration
  const durDef = inputSchema.find(
    (d) =>
      d.type === "selection" &&
      typeof d.label === "string" &&
      /(duration|length|طول|مدت)/i.test(d.label),
  );
  if (durDef) {
    const raw = form.get(durDef.inputKey);
    const num = typeof raw === "string" ? Number(raw) : null;
    if (typeof num === "number" && Number.isFinite(num)) return num;
  }
  return null;
}
function extractMediaUrl(output: unknown): string | null {
  if (!output) return null;
  if (typeof output === "string") return output;

  // array of strings or objects with image/video keys
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0] as any;
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      if (typeof first.image === "string") return first.image;
      if (Array.isArray(first.image) && first.image.length > 0)
        return String(first.image[0]);
      if (typeof first.video === "string") return first.video;
      if (Array.isArray(first.video) && first.video.length > 0)
        return String(first.video[0]);
    }
  }

  // object with image(s) or video
  if (typeof output === "object") {
    const o = output as any;
    if (typeof o.image === "string") return o.image;
    if (Array.isArray(o.images) && o.images.length > 0)
      return String(o.images[0]);
    if (typeof o.video === "string") return o.video;
  }
  return null;
}

async function createReplicatePrediction(modelId: string, input: any) {
  if (!REPLICATE_API_TOKEN)
    throw new Error("Missing REPLICATE_API_TOKEN env var");
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
    error("Gen.Replicate.CreateFailed", {
      modelId,
      status: resp.status,
      statusText: resp.statusText,
      bodyPreview:
        typeof body === "string" && body.length > 1000
          ? `${(body as string).slice(0, 1000)}...`
          : body,
    });
    throw new Error(errMsg);
  }
  const json = (await resp.json()) as {
    id: string;
    status: string;
    output: unknown;
    urls: { get: string; cancel: string; web: string };
  };
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
    error("Gen.Replicate.GetFailed", { url, status: resp.status, body: text });
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

// POST /api/gen
export async function POST(req: NextRequest) {
  let userId: number | undefined;
  try {
    userId = getUserId(req);

    const form = await req.formData();
    const code = String(form.get("model") || "");
    const kindRaw = String(form.get("kind") || ""); // IMAGE | VIDEO

    const found = await findModelByCode(code);
    if (!found) {
      warn("Gen.POST.Validation.InvalidModel", { userId, code });
      return jsonError("شناسه مدل معتبر نیست.", 400);
    }
    const kind = found.kind;
    if (kindRaw && kindRaw !== kind) {
      return jsonError("نوع مدل با شناسه مدل هم‌خوانی ندارد.", 400);
    }

    // Validate and build replicate input using the model's own inputSchema
    let replicateInput: Record<string, unknown>;
    try {
      replicateInput = (
        await buildInputFromFormData(form, found.model.inputSchema as any)
      ).replicateInput;
    } catch (error: unknown) {
      warn("Gen.POST.Validation.buildInputFromFormData", {
        userId,
        code,
        error,
      });
      return jsonError((error as any).message, 400);
    }

    // Merge defaults (model defaults first; user values override)
    const userOptionsRaw = form.get("options");
    let userOptions: Record<string, unknown> | undefined;
    if (typeof userOptionsRaw === "string" && userOptionsRaw.trim().length) {
      try {
        userOptions = JSON.parse(userOptionsRaw);
      } catch {
        warn("Gen.POST.Options.JSONParseFailed", { userId });
      }
    }
    const input = {
      ...((found.model.defaultOptions || {}) as any),
      ...replicateInput,
      ...(userOptions || {}),
    };

    // Get authoritative cost from DB by kind
    let unitCostUSD: number;
    if (kind === "IMAGE") {
      const row = await prisma.imageModel.findUnique({
        where: { code },
        select: { costPerImage: true, disabled: true },
      });
      if (!row || row.disabled) {
        warn("Gen.POST.Validation.ModelDisabledOrMissing", { userId, code });
        return jsonError("شناسه مدل معتبر نیست.", 400);
      }
      unitCostUSD = row.costPerImage;
    } else {
      const row = await prisma.videoModel.findUnique({
        where: { code },
        select: { costPerSecond: true, disabled: true },
      });
      if (!row || row.disabled) {
        warn("Gen.POST.Validation.ModelDisabledOrMissing", { userId, code });
        return jsonError("شناسه مدل معتبر نیست.", 400);
      }
      unitCostUSD = row.costPerSecond;
    }

    // duration x costPerSecond for videos; per-image for images
    let totalCostUSD = unitCostUSD;
    if (kind === "VIDEO") {
      let durationSec = extractDurationSeconds(
        replicateInput,
        form,
        found.model.inputSchema as any,
      );

      if (!(typeof durationSec === "number" && durationSec > 0)) {
        const probed = await probeVideoDurationFromForm(
          form,
          found.model.inputSchema as any,
        );
        if (probed?.seconds && probed.seconds > 0) {
          durationSec = probed.seconds;
        }
      }

      if (!(typeof durationSec === "number" && durationSec > 0)) {
        return jsonError("لطفاً طول ویدئو را به‌درستی وارد کنید.", 400);
      }

      // Ensure integer seconds (ceil already applied for probed values; apply for provided as well)
      durationSec = Math.ceil(durationSec);

      // Optional: log provided duration too (not required, but helpful)
      info("Gen.POST.VideoDuration.Final", { userId, seconds: durationSec });

      totalCostUSD = unitCostUSD * durationSec;
    }
    totalCostUSD = roundToDecimals(totalCostUSD, 5);

    // Atomic debit
    const debit = await prisma.user.updateMany({
      where: { id: userId, balance: { gte: totalCostUSD } },
      data: { balance: { decrement: totalCostUSD } },
    });
    if (debit.count <= 0) {
      warn("Gen.POST.Validation.InsufficientBalance", { userId, totalCostUSD });
      return jsonError("اعتبار حساب شما کافی نیست!", 402);
    }

    // Upload provider-hosted files if requested by the schema and patch input accordingly
    let uploadedFileIds: string[] = [];
    try {
      const { inputPatch, uploadedFileIds: ids } =
        await uploadFilesFromFormAccordingToSchema(
          form,
          found.model.inputSchema as any,
          /* jobIdForMeta */ undefined, // jobId unknown until we create the DB row; we still tag metadata with null
        );
      if (Object.keys(inputPatch).length) {
        Object.assign(input, inputPatch);
      }
      uploadedFileIds = ids;
    } catch (e) {
      // Refund if upload itself fails
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { balance: { increment: totalCostUSD } },
        });
      } catch (refundErr) {
        error("Gen.POST.DB.RefundFailedAfterUploadError", {
          userId,
          totalCostUSD,
          error: refundErr,
        });
      }
      throw e;
    }

    // Create replicate prediction (if this fails, refund and delete uploaded files)
    let prediction:
      | {
          id: string;
          status: string;
          output: unknown;
          urls: { get: string; cancel: string; web: string };
        }
      | undefined;

    try {
      prediction = await createReplicatePrediction(code, input);
    } catch (e) {
      // refund on create fail
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { balance: { increment: totalCostUSD } },
        });
      } catch (refundErr) {
        error("Gen.POST.DB.RefundFailedAfterCreateError", {
          userId,
          totalCostUSD,
          error: refundErr,
        });
      }
      // attempt to delete any uploaded files to avoid leaks
      if (uploadedFileIds.length) {
        await deleteReplicateFiles(uploadedFileIds);
      }
      throw e;
    }

    // Initial job record (now include uploadedFileIds)
    const initialStatus = mapReplicateStatus(prediction.status);
    const initialUrl = extractMediaUrl(prediction.output);

    const job = await prisma.genJob.create({
      data: {
        userId,
        kind,
        model: code,
        status: initialStatus,
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
        resultUrl: initialUrl ?? undefined,
        cost: totalCostUSD,
        uploadedFileIds, // NEW: track files to clean up later
      },
      select: { id: true },
    });

    info("Gen.POST.JobCreated", { jobId: job.id, userId, model: code });
    return json({ jobId: job.id }, 202);
  } catch (err: any) {
    const status = err?.code === 401 ? 401 : 500;
    const msg =
      err?.code === 401
        ? "دسترسی غیرمجاز."
        : "در ایجاد درخواست ساخت محتوا خطایی رخ داد.";
    error("Gen.POST.Unhandled", { userId: userId ?? null, error: err });
    return jsonError(msg, status);
  }
}

// GET /api/gen?jobId=...
export async function GET(req: NextRequest) {
  let userId: number | undefined;
  let jobId: number | undefined;

  try {
    userId = getUserId(req);
    const jobIdRaw = req.nextUrl.searchParams.get("jobId");
    jobId = Number(jobIdRaw);
    if (!jobIdRaw || Number.isNaN(jobId)) {
      return jsonError("شناسه کار نامعتبر است.", 404);
    }

    const job = await prisma.genJob.findFirst({
      where: { id: jobId, userId },
      select: {
        id: true,
        status: true,
        progress: true,
        createdAt: true,
        resultUrl: true,
        replicateGetUrl: true,
        cost: true,
        uploadedFileIds: true,
      },
    });
    if (!job) return jsonError("کار مورد نظر یافت نشد.", 404);

    const makeStreamUrl = () =>
      job.resultUrl ? buildStreamUrl(job.id) : undefined;

    if (job.status === "SUCCEEDED") {
      return json({
        status: job.status,
        progress: job.progress,
        etaSeconds: 0,
        resultUrl: makeStreamUrl(),
      });
    }

    if (!job.replicateGetUrl) {
      return jsonError("پیش‌بینی هنوز مقداردهی نشده است.", 500);
    }

    const pred = await getReplicatePrediction(job.replicateGetUrl);
    const mapped = mapReplicateStatus(pred.status);
    const nextProgress = estimateProgress(job.progress, mapped);

    let resultUrl = job.resultUrl ?? undefined;
    if (!resultUrl && pred.status === "SUCCEEDED") {
      resultUrl = extractMediaUrl(pred.output) ?? undefined;
    }

    // Refund only on transition to FAILED where Replicate raw is FAILED
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
        info("Gen.GET.Refunded", { userId, jobId, amount: job.cost });
      }
      return tx.genJob.update({
        where: { id: job.id },
        data: {
          status: mapped,
          progress: nextProgress,
          ...(resultUrl ? { resultUrl } : {}),
        },
        select: {
          status: true,
          progress: true,
          createdAt: true,
          resultUrl: true,
          id: true,
        },
      });
    });

    if (
      updated.status === "SUCCEEDED" &&
      job.uploadedFileIds &&
      job.uploadedFileIds.length > 0
    ) {
      try {
        await deleteReplicateFiles(job.uploadedFileIds);
        await prisma.genJob.update({
          where: { id: updated.id },
          data: { uploadedFileIds: [] },
          select: { id: true },
        });
        info("Gen.GET.ProviderFilesDeleted", {
          jobId: updated.id,
          count: job.uploadedFileIds.length,
        });
      } catch (delErr) {
        warn("Gen.GET.ProviderFilesDeleteError", {
          jobId: updated.id,
          error: String(delErr),
        });
      }
    }

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
      resultUrl: updated.resultUrl ? buildStreamUrl(updated.id) : undefined,
      ...(updated.status === "FAILED" ? { error: "عملیات ناموفق بود." } : {}),
    });
  } catch (e: any) {
    error("Gen.GET.Unhandled", {
      userId: userId ?? null,
      jobId: jobId ?? null,
      error: e,
    });

    // soft fallback
    const jobIdRaw = req.nextUrl.searchParams.get("jobId");
    const safeJobId = Number(jobIdRaw);
    const safeUserId = Number(req.headers.get("userId") || "0");
    const safe = Number.isFinite(safeJobId)
      ? await prisma.genJob
          .findFirst({
            where: { id: safeJobId, userId: safeUserId },
            select: { status: true, progress: true, resultUrl: true, id: true },
          })
          .catch(() => null)
      : null;

    return json(
      {
        status: safe?.status ?? "QUEUED",
        progress: safe?.progress ?? 0,
        etaSeconds: 5,
        resultUrl: safe?.resultUrl ? buildStreamUrl(safe.id) : undefined,
        warning: "در هنگام دریافت وضعیت از سرویس خطایی رخ داد.",
      },
      200,
    );
  }
}
