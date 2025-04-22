"use client";

import Link from "next/link";
import { FiHome } from "react-icons/fi";

export default function Error({}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="h-dvh w-dvw flex flex-col justify-center items-center text-cener rlt">
      <h1 className="text-3xl text-red-500">مشکل فنی در سرور.</h1>
      <Link href="/">
        <button className="mt-4 flex justify-center items-center text-center text-base gap-2 p-2 rounded-lg border-2 border-gray-875">
          <FiHome />
          بازگشت به خانه
        </button>
      </Link>
    </div>
  );
}
