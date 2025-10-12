/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getUserId(req: NextRequest): number {
  const userId = Number(req.headers.get("userId") || "abc");
  if (isNaN(userId))
    throw Object.assign(new Error("دسترسی غیرمجاز"), { code: 401 });
  return userId;
}

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
      select: { imageUrl: true },
    });
    if (!job) {
      return NextResponse.json(
        { error: "کار مورد نظر یافت نشد." },
        { status: 404 },
      );
    }

    if (!job.imageUrl) {
      return NextResponse.json(
        { error: "تصویر هنوز آماده نیست." },
        { status: 404 },
      );
    }

    let upstreamUrl: URL;
    try {
      upstreamUrl = new URL(job.imageUrl);
    } catch {
      return NextResponse.json(
        { error: "نشانی تصویر نامعتبر است." },
        { status: 400 },
      );
    }

    // Do not forward cookies/credentials; avoid open-redirects with manual redirect handling.
    const upstream = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: { Accept: "image/*" },
      redirect: "manual",
      cache: "no-store",
    });

    if (upstream.status >= 300 && upstream.status < 400) {
      return NextResponse.json(
        { error: "هدایت غیرمنتظره از سمت منبع." },
        { status: 502 },
      );
    }
    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      return NextResponse.json(
        {
          error: `دریافت تصویر از منبع ناموفق بود (${upstream.status}).`,
          detail: text?.slice(0, 200),
        },
        { status: 502 },
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    const contentLength = upstream.headers.get("content-length");

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        ...(contentLength ? { "Content-Length": contentLength } : {}),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy":
          "default-src 'none'; img-src 'self'; frame-ancestors 'none'; sandbox",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    });
  } catch (err: any) {
    const status = err?.code === 401 ? 401 : 500;
    return NextResponse.json(
      { error: err?.message || "خطای داخلی سرور." },
      { status },
    );
  }
}
