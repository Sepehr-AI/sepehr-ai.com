"use client";

import { CheckIcon } from "@radix-ui/react-icons";
import { FaDownload } from "react-icons/fa6";

type Props = {
  kind: "IMAGE" | "VIDEO";
  url: string;
  resetLabel: string;
  onReset: () => void;
  downloadLabel: string;
};

export default function ResultCard({
  kind,
  url,
  onReset,
  downloadLabel,
  resetLabel,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-background p-3">
        {kind === "VIDEO" ? (
          <p className="flex gap-0.5 items-center justify-center text-center text-green-800">
            <CheckIcon width="2em" height="2em" />
            ویدئو با موفقیت ساخته شد. جهت نمایش ویدئو آن را دانلود کنید.
          </p>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="generated"
            className="w-full rounded-md border border-border"
          />
        )}
      </div>

      <div className="flex items-center gap-2 w-full justify-center">
        <a
          href={url}
          download
          className="flex gap-2 px-3 py-1.5 rounded-md text-md bg-blue-500 text-white hover:bg-blue-500/70"
        >
          <FaDownload />
          {downloadLabel}
        </a>
        <button
          onClick={onReset}
          className="px-3 py-1.5 rounded-md text-md bg-accent text-white hover:bg-accent/90 flex items-center gap-1"
        >
          {resetLabel}
        </button>
      </div>
    </div>
  );
}
