/* eslint-disable @typescript-eslint/no-explicit-any */
import { error, info, warn } from "@/lib/log";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { v7 as uuidv7 } from "uuid";

export const runtime = "nodejs";

const ACCEPT_BY_KIND: Record<"IMAGE" | "VIDEO", string> = {
  IMAGE: "image/*",
  VIDEO: "video/*",
};

/* ------------------------ helpers ------------------------ */

// MIME → extension map (prefer common file extensions)
const EXT_BY_MIME = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/svg+xml", "svg"],
  ["image/heic", "heic"],
  ["image/heif", "heif"],
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  ["video/quicktime", "mov"],
  ["video/x-matroska", "mkv"],
  ["video/3gpp", "3gp"],
  ["video/3gpp2", "3g2"],
]);

const DEFAULT_EXT_BY_KIND: Record<"IMAGE" | "VIDEO", string> = {
  IMAGE: "png",
  VIDEO: "mp4",
};

function inferExtension(
  kind: "IMAGE" | "VIDEO",
  contentType: string | null,
  urlPath: string,
): string {
  const ct = (contentType || "").split(";")[0].trim().toLowerCase();
  if (ct && EXT_BY_MIME.has(ct)) return EXT_BY_MIME.get(ct)!;

  // Fallback: try from URL path
  const lastDot = urlPath.lastIndexOf(".");
  if (lastDot > -1 && lastDot < urlPath.length - 1) {
    const ext = urlPath.slice(lastDot + 1).toLowerCase();
    if (/^[a-z0-9]{2,5}$/.test(ext)) return ext;
  }

  return DEFAULT_EXT_BY_KIND[kind];
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
    const err = new Error("نشانی رسانه نامعتبر است.") as Error & {
      code?: number;
    };
    err.code = 400;
    throw err;
  }
}

function cspFor(kind: "IMAGE" | "VIDEO") {
  // mirror previous policies; only the allowed media directive differs
  return kind === "IMAGE"
    ? "default-src 'none'; img-src 'self'; frame-ancestors 'none'; sandbox"
    : "default-src 'none'; media-src 'self'; frame-ancestors 'none'; sandbox";
}

/**
 * Returns a non-JSON error response that won't break <img>/<video> tags.
 * - IMAGE: tiny SVG with error text
 * - VIDEO: empty body with a video content-type and status code
 */
function mediaError(
  kind: "IMAGE" | "VIDEO" | null,
  status: number,
  message?: string,
) {
  if (kind === "VIDEO") {
    return new NextResponse(null, {
      status,
      headers: {
        "Content-Type": "video/mp4",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // Default to IMAGE (or unknown) with a tiny SVG placeholder
  const safeMsg = (message || "").slice(0, 120);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" role="img" aria-label="error">` +
    `<rect width="100%" height="100%" fill="#f6f6f6"/>` +
    `<text x="12" y="12" dominant-baseline="middle" text-anchor="middle" font-size="6" fill="#999">${escapeForSVG(
      safeMsg || "error",
    )}</text></svg>`;

  return new NextResponse(svg, {
    status,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "same-origin",
      "X-Accel-Buffering": "no",
    },
  });
}

function escapeForSVG(s: string) {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return c;
    }
  });
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
      // We don't know kind here; return image-safe error
      return mediaError(null, 404, "شناسه کار نامعتبر است.");
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
      return mediaError(null, 404, "کار مورد نظر یافت نشد.");
    }

    if (!job.resultUrl) {
      warn("GenStream.GET.MediaNotReady", { userId, jobId });
      return mediaError(
        job.kind as "IMAGE" | "VIDEO",
        404,
        "رسانه هنوز آماده نیست.",
      );
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
      return mediaError(
        job.kind as "IMAGE" | "VIDEO",
        502,
        "هدایت غیرمنتظره از سمت منبع.",
      );
    }

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      error("GenStream.GET.Upstream.NonOk", {
        userId,
        jobId,
        status: upstream.status,
        snippet: text?.slice(0, 200),
      });
      return mediaError(
        job.kind as "IMAGE" | "VIDEO",
        502,
        `دریافت رسانه از منبع ناموفق بود (${upstream.status}).`,
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    const contentLength = upstream.headers.get("content-length");

    const ext = inferExtension(
      job.kind as "IMAGE" | "VIDEO",
      contentType,
      upstreamUrl.pathname,
    );
    const filename = `${uuidv7()}.${ext}`;

    info("GenStream.GET.Streaming", {
      userId,
      jobId,
      kind: job.kind,
      contentType,
      contentLength,
      filename,
    });

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        ...(contentLength ? { "Content-Length": contentLength } : {}),
        "Content-Disposition": `inline; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(
          filename,
        )}`,
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
    // Unknown kind here; return image-safe error
    return mediaError(null, status, err?.message || "خطای داخلی سرور.");
  }
}
