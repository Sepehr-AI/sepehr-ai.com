"use client";

import Loading from "@/components/Loading";
import humanizeDuration from "humanize-duration";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { FiHome } from "react-icons/fi";

function Auth429() {
  const searchParams = useSearchParams();
  let untilNextReq: number | undefined = Number(
    searchParams.get("untilNextReq") || "abc",
  );
  if (isNaN(untilNextReq)) untilNextReq = undefined;

  return (
    <div className="h-dvh w-dvw flex flex-col justify-center items-center text-center rlt">
      <h1 className="my-6 text-3xl text-red-700">
        تعداد درخواست بیش‌ از حد برای ورود به حساب!
      </h1>
      {untilNextReq && (
        <p className="mt-3 mb-6 text-center">
          <span>مدت زمان باقی‌ مانده تا اجازه برای درخواست بعدی: </span>
          <span>
            {humanizeDuration(untilNextReq, { language: "fa", round: true })}
          </span>
        </p>
      )}
      <Link href="/">
        <button className="mt-4 flex justify-center items-center text-center text-base gap-2 p-2 rounded-lg border-2 border-gray-875">
          <FiHome />
          بازگشت به خانه
        </button>
      </Link>
    </div>
  );
}

export default function Auth429Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Auth429 />
    </Suspense>
  );
}
