/* eslint-disable @typescript-eslint/no-explicit-any */
import { error, info, warn } from "@/lib/log";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ACCEPT_BY_KIND: Record<"IMAGE" | "VIDEO", string> = {
  IMAGE: "image/*",
  VIDEO: "video/*",
};

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
    warn("GenStream.Auth.InvalidUserIdHeader", {
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
    warn("GenStream.GET.InvalidUpstreamUrl", { ...ctx, raw, error: e });
    throw Object.assign(new Error("نشانی رسانه نامعتبر است."), { code: 400 });
  }
}

function cspFor(kind: "IMAGE" | "VIDEO") {
  // mirror previous policies; only the allowed media directive differs
  return kind === "IMAGE"
    ? "default-src 'none'; img-src 'self'; frame-ancestors 'none'; sandbox"
    : "default-src 'none'; media-src 'self'; frame-ancestors 'none'; sandbox";
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
      warn("GenStream.GET.Validation.InvalidJobId", { userId, jobIdRaw });
      return jsonError("شناسه کار نامعتبر است.", 404);
    }

    const job = await prisma.genJob
      .findFirst({
        where: { id: jobId, userId },
        select: { resultUrl: true, kind: true },
      })
      .catch((e) => {
        error("GenStream.GET.DB.FindJobFailed", { userId, jobId, error: e });
        throw e;
      });

    if (!job) {
      warn("GenStream.GET.JobNotFound", { userId, jobId });
      return jsonError("کار مورد نظر یافت نشد.", 404);
    }

    if (!job.resultUrl) {
      warn("GenStream.GET.MediaNotReady", { userId, jobId });
      return jsonError("رسانه هنوز آماده نیست.", 404);
    }

    const upstreamUrl = toURLOrError(job.resultUrl, { userId, jobId });

    const upstream = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: { Accept: ACCEPT_BY_KIND[job.kind as "IMAGE" | "VIDEO"] },
      redirect: "manual",
      cache: "no-store",
    }).catch((e) => {
      error("GenStream.GET.Upstream.FetchFailed", {
        userId,
        jobId,
        url: upstreamUrl.toString(),
        error: e,
      });
      throw new Error("دریافت رسانه از منبع ناموفق بود.");
    });

    if (upstream.status >= 300 && upstream.status < 400) {
      warn("GenStream.GET.Upstream.Redirect", {
        userId,
        jobId,
        status: upstream.status,
        location: upstream.headers.get("location"),
      });
      return jsonError("هدایت غیرمنتظره از سمت منبع.", 502);
    }

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      error("GenStream.GET.Upstream.NonOk", {
        userId,
        jobId,
        status: upstream.status,
        snippet: text?.slice(0, 200),
      });
      return json(
        {
          error: `دریافت رسانه از منبع ناموفق بود (${upstream.status}).`,
          detail: text?.slice(0, 200),
        },
        502,
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    const contentLength = upstream.headers.get("content-length");

    info("GenStream.GET.Streaming", {
      userId,
      jobId,
      kind: job.kind,
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
        "Content-Security-Policy": cspFor(job.kind as "IMAGE" | "VIDEO"),
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: any) {
    const status = err?.code === 401 ? 401 : 500;
    error("GenStream.GET.Unhandled", {
      userId: userId ?? null,
      jobId: jobId ?? null,
      status,
      error: err,
    });
    return jsonError(err?.message || "خطای داخلی سرور.", status);
  }
}
