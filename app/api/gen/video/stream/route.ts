/* eslint-disable @typescript-eslint/no-explicit-any */
import { error, info, warn } from "@/lib/log";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ACCEPT = "video/*";

/* ------------------------ helpers ------------------------ */
function json<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

function jsonError(message: string, status = 500) {
  return json({ error: message }, status);
}

function getUserId(req: NextRequest): number {
  const userId = Number(req.headers.get("userId") || "abc");
  if (isNaN(userId)) {
    warn("VideoStream.Auth.InvalidUserIdHeader", {
      header: req.headers.get("userId"),
    });
    const err = new Error("دسترسی غیرمجاز") as Error & { code?: number };
    err.code = 401;
    throw err;
  }
  return userId;
}

function toURLOrError(raw: string, ctx: Record<string, unknown>): URL {
  try {
    return new URL(raw);
  } catch (e) {
    warn("VideoStream.GET.InvalidUpstreamUrl", { ...ctx, raw, error: e });
    throw Object.assign(new Error("نشانی ویدئو نامعتبر است."), { code: 400 });
  }
}

/* ------------------------- route ------------------------- */
export async function GET(req: NextRequest) {
  let userId: number | undefined;
  let jobId: number | undefined;

  try {
    userId = getUserId(req);

    const jobIdRaw = req.nextUrl.searchParams.get("jobId");
    jobId = Number(jobIdRaw);
    if (!jobIdRaw || Number.isNaN(jobId)) {
      warn("VideoStream.GET.Validation.InvalidJobId", { userId, jobIdRaw });
      return jsonError("شناسه کار نامعتبر است.", 404);
    }

    const job = await prisma.videoJob
      .findFirst({
        where: { id: jobId, userId },
        select: { videoUrl: true },
      })
      .catch((e) => {
        error("VideoStream.GET.DB.FindJobFailed", { userId, jobId, error: e });
        throw e;
      });

    if (!job) {
      warn("VideoStream.GET.JobNotFound", { userId, jobId });
      return jsonError("کار مورد نظر یافت نشد.", 404);
    }

    if (!job.videoUrl) {
      warn("VideoStream.GET.VideoNotReady", { userId, jobId });
      return jsonError("ویدئو هنوز آماده نیست.", 404);
    }

    const upstreamUrl = toURLOrError(job.videoUrl, { userId, jobId });

    const upstream = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: { Accept: ACCEPT },
      redirect: "manual",
      cache: "no-store",
    }).catch((e) => {
      error("VideoStream.GET.Upstream.FetchFailed", {
        userId,
        jobId,
        url: upstreamUrl.toString(),
        error: e,
      });
      throw new Error("دریافت ویدئو از منبع ناموفق بود.");
    });

    if (upstream.status >= 300 && upstream.status < 400) {
      warn("VideoStream.GET.Upstream.Redirect", {
        userId,
        jobId,
        status: upstream.status,
        location: upstream.headers.get("location"),
      });
      return jsonError("هدایت غیرمنتظره از سمت منبع.", 502);
    }

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      error("VideoStream.GET.Upstream.NonOk", {
        userId,
        jobId,
        status: upstream.status,
        snippet: text?.slice(0, 200),
      });
      return json(
        {
          error: `دریافت ویدئو از منبع ناموفق بود (${upstream.status}).`,
          detail: text?.slice(0, 200),
        },
        502,
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    const contentLength = upstream.headers.get("content-length");

    info("VideoStream.GET.Streaming", {
      userId,
      jobId,
      contentType,
      contentLength,
    });

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        ...(contentLength ? { "Content-Length": contentLength } : {}),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        // media-src so we can play safely; we don't embed remote iframes
        "Content-Security-Policy":
          "default-src 'none'; media-src 'self'; frame-ancestors 'none'; sandbox",
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: any) {
    const status = err?.code === 401 ? 401 : 500;
    error("VideoStream.GET.Unhandled", {
      userId: userId ?? null,
      jobId: jobId ?? null,
      status,
      error: err,
    });
    return jsonError(err?.message || "خطای داخلی سرور.", status);
  }
}
