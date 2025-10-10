/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import {
    parseSize as sharedParseSize,
    resolveReplicateEndpoint,
} from "@/lib/replicateModels";
import prisma from "@/lib/prisma";
import { JobStatus } from "@/prisma/client";
import { getVideoModelsForWeb } from "@/lib/videoModels";
import { ratioLabelToEnumKey } from "@/lib/ratio";

export const runtime = "nodejs";

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// --- auth util ---
function getUserId(req: NextRequest): number {
    const userId = Number(req.headers.get("userId") || "abc");
    if (isNaN(userId)) {
        throw Object.assign(new Error("دسترسی غیرمجاز"), { code: 401 });
    }
    return userId;
}

// --- replicate helpers (reuse the same helpers you have in image route) ---
async function createReplicatePrediction(modelId: string, input: Record<string, unknown>) {
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
        throw new Error(`Replicate create FAILED (${resp.status}): ${text || resp.statusText}`);
    }
    return (await resp.json()) as {
        id: string;
        status: string;
        output: unknown;
        urls: { get: string; cancel: string; web: string };
    };
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
        throw new Error(`Replicate get FAILED (${resp.status}): ${text || resp.statusText}`);
    }
    const json = await resp.json();
    if (json.status && typeof json.status === "string") json.status = (json.status as string).toUpperCase();
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

async function fileToDataUrl(f: File) {
    const buf = Buffer.from(await f.arrayBuffer());
    const mime = f.type || "application/octet-stream";
    return `data:${mime};base64,${buf.toString("base64")}`;
}

const singleFileKeys = [
    "image",
    "start_image",
    "end_image",
    "first_frame_image",
    "last_frame_image",
    "audio",
] as const;

// POST /api/gen/video
export async function POST(req: NextRequest) {
    try {
        const userId = getUserId(req);
        const videoModels = await getVideoModelsForWeb();
        const form = await req.formData();

        const prompt = String(form.get("prompt") || "");
        if (!prompt.trim()) {
            return NextResponse.json({ error: "وارد کردن پرامپت الزامی است." }, { status: 400 });
        }

        const model = String(form.get("model") || "");
        const spec = videoModels.find((m) => m.code === model);
        if (!spec) {
            return NextResponse.json({ error: "شناسه مدل معتبر نیست." }, { status: 400 });
        }

        const dbModel = await prisma.videoModel.findUnique({
            where: { code: spec.code },
            select: { cost: true, disabled: true },
        });
        if (!dbModel || dbModel.disabled) {
            return NextResponse.json({ error: "شناسه مدل معتبر نیست." }, { status: 400 });
        }
        const cost = dbModel.cost;

        const ratioValue = form.get("ratio");
        const ratio = typeof ratioValue === "string" && ratioValue.trim().length ? ratioValue : null;

        const lengthRaw = form.get("lengthSec");
        const lengthSec =
            typeof lengthRaw === "string" && lengthRaw.trim().length
                ? Math.max(1, Math.min(60, Number(lengthRaw))) // simple clamp, adjust as needed
                : null;

        let userOptions: Record<string, unknown> | undefined;
        const optionsRaw = form.get("options");
        if (typeof optionsRaw === "string" && optionsRaw.trim().length) {
            try {
                userOptions = JSON.parse(optionsRaw);
            } catch { /* ignore */ }
        }

        const media: Record<string, string | string[]> = {};

        // singles (only if model advertises support)
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
            if (part instanceof File) media[k] = await fileToDataUrl(part);
        }

        // multiples: reference_images
        if (spec.referenceImages) {
            const refs = form.getAll("reference_images").filter((x): x is File => x instanceof File);
            if (refs.length > 0) {
                media["reference_images"] = await Promise.all(refs.map(fileToDataUrl));
            }
        }

        // parse size for ratio
        const { w, h } = sharedParseSize(ratio);

        // Replicate input: merge prompt/size/duration/options + media map
        const input: Record<string, unknown> = {
            prompt,
            ...((spec.defaultOptions as any) || {}),
            ...(userOptions || {}),
            ...(ratio && ratio !== "X:Y" ? { aspect_ratio: ratio } : {}),
            ...(w && h ? { width: w, height: h } : {}),
            ...(typeof lengthSec === "number" ? { duration: lengthSec } : {}),
            ...media,
        };

        // 1) Atomic debit
        const debit = await prisma.user.updateMany({
            where: { id: userId, balance: { gte: cost } },
            data: { balance: { decrement: cost } },
        });
        if (debit.count <= 0) {
            return NextResponse.json({ error: "اعتبار کیف پول کافی نیست." }, { status: 402 });
        }

        // 2) Create prediction; refund on failure
        let prediction: { id: string; status: string; output: unknown; urls: { get: string; cancel: string; web: string } };
        try {
            prediction = await createReplicatePrediction(spec.code, input);
        } catch (e) {
            await prisma.user.update({ where: { id: userId }, data: { balance: { increment: cost } } });
            throw e;
        }

        const initialStatus = mapReplicateStatus(prediction.status);

        // first video url if synchronous success
        let initialVideoUrl: string | null = null;
        if (Array.isArray(prediction.output) && prediction.output.length > 0) {
            initialVideoUrl = String(prediction.output[0]);
        } else if (typeof prediction.output === "string") {
            initialVideoUrl = prediction.output;
        } else if (prediction.output && typeof prediction.output === "object" && "video" in (prediction.output as any)) {
            const v = (prediction.output as any).video;
            if (typeof v === "string") initialVideoUrl = v;
            else if (Array.isArray(v) && v.length > 0) initialVideoUrl = String(v[0]);
        }

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
                    replicateGetUrl: prediction.urls?.get ?? `https://api.replicate.com/v1/predictions/${prediction.id}`,
                    replicateCancelUrl:
                        prediction.urls?.cancel ?? `https://api.replicate.com/v1/predictions/${prediction.id}/cancel`,
                    replicateWebUrl: prediction.urls?.web ?? `https://replicate.com/p/${prediction.id}`,
                    videoUrl: initialVideoUrl ?? undefined,
                    cost,
                },
                select: { id: true },
            });

            return NextResponse.json({ jobId: job.id }, { status: 202 });
        } catch (e) {
            await prisma.user.update({ where: { id: userId }, data: { balance: { increment: cost } } });
            throw e;
        }
    } catch (err: any) {
        const status = err?.code === 401 ? 401 : 500;
        const msg = err?.code === 401 ? "دسترسی غیرمجاز." : "در ایجاد درخواست ساخت ویدئو خطایی رخ داد.";
        return NextResponse.json({ error: msg }, { status });
    }
}

// GET /api/gen/video?jobId=...
export async function GET(req: NextRequest) {
    try {
        const userId = getUserId(req);
        const jobIdRaw = req.nextUrl.searchParams.get("jobId");
        const jobId = Number(jobIdRaw);
        if (!jobIdRaw || Number.isNaN(jobId)) {
            return NextResponse.json({ error: "شناسه کار نامعتبر است." }, { status: 404 });
        }

        const job = await prisma.videoJob.findFirst({
            where: { id: jobId, userId },
            select: {
                id: true, status: true, progress: true, createdAt: true, videoUrl: true,
                replicateGetUrl: true, cost: true,
            },
        });
        if (!job) {
            return NextResponse.json({ error: "کار مورد نظر یافت نشد." }, { status: 404 });
        }

        const makeStreamUrl = () =>
            job.videoUrl
                ? new URL(`/api/gen/video/stream?jobId=${encodeURIComponent(String(job.id))}`, req.nextUrl.origin).toString()
                : undefined;

        if (job.status === "SUCCEEDED") {
            return NextResponse.json({
                status: job.status,
                progress: job.progress,
                videoUrl: makeStreamUrl(),
            });
        }

        if (!job.replicateGetUrl) {
            return NextResponse.json({ error: "پیش‌بینی هنوز مقداردهی نشده است." }, { status: 500 });
        }

        const pred = await getReplicatePrediction(job.replicateGetUrl);
        const mapped = mapReplicateStatus(pred.status);
        const nextProgress = estimateProgress(job.progress, mapped);

        let videoUrl = job.videoUrl ?? undefined;
        if (!videoUrl && pred.status === "SUCCEEDED") {
            if (Array.isArray(pred.output) && pred.output.length > 0) {
                videoUrl = String(pred.output[0]);
            } else if (typeof pred.output === "string") {
                videoUrl = pred.output;
            } else if (pred.output && typeof pred.output === "object" && "video" in (pred.output as any)) {
                const v = (pred.output as any).video;
                if (typeof v === "string") videoUrl = v;
                else if (Array.isArray(v) && v.length > 0) videoUrl = String(v[0]);
            }
        }

        // Refund only on transition to FAILED where Replicate raw status is FAILED (not CANCELED)
        const shouldRefund = job.status !== "FAILED" && mapped === "FAILED" && pred.status === "FAILED";

        const updated = await prisma.$transaction(async (tx) => {
            if (shouldRefund && job.cost && job.cost > 0) {
                await tx.user.update({
                    where: { id: userId },
                    data: { balance: { increment: job.cost } },
                });
            }
            return tx.videoJob.update({
                where: { id: job.id },
                data: {
                    status: mapped,
                    progress: nextProgress,
                    ...(videoUrl ? { videoUrl } : {}),
                },
                select: { status: true, progress: true, createdAt: true, videoUrl: true, id: true },
            });
        });

        return NextResponse.json({
            status: updated.status,
            progress: updated.progress,
            videoUrl: updated.videoUrl
                ? new URL(`/api/gen/video/stream?jobId=${encodeURIComponent(String(updated.id))}`, req.nextUrl.origin).toString()
                : undefined,
            ...(updated.status === "FAILED" ? { error: "ساخت ویدئو ناموفق بود." } : {}),
        });
    } catch {
        // soft fallback (same approach as image route)
        const jobIdRaw = req.nextUrl.searchParams.get("jobId");
        const jobId = Number(jobIdRaw);
        const userId = Number(req.headers.get("userId") || "0");

        const safe = Number.isFinite(jobId)
            ? await prisma.videoJob.findFirst({
                where: { id: jobId, userId },
                select: { status: true, progress: true, videoUrl: true, id: true },
            })
            : null;

        return NextResponse.json(
            {
                status: safe?.status ?? "QUEUED",
                progress: safe?.progress ?? 0,
                videoUrl: safe?.videoUrl
                    ? new URL(`/api/gen/video/stream?jobId=${encodeURIComponent(String(safe.id))}`, req.nextUrl.origin).toString()
                    : undefined,
                warning: "در هنگام دریافت وضعیت از سرویس خطایی رخ داد.",
            },
            { status: 200 },
        );
    }
}