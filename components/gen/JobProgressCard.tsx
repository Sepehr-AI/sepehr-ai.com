"use client";

import { ReloadIcon } from "@radix-ui/react-icons";
import type { JobStatus } from "@/types/jobs";

type Props = {
  status: JobStatus;
  eta?: number;
  progress?: number;
  onCancel: () => void;

  submittingLabel?: string; // "در حال ارسال درخواست ..."
  workingLabel: string; // "در حال تولید ویدئو ..." | "در حال تولید تصویر ..."
  buttomText?: string;
};

export default function JobProgressCard({
  eta,
  status,
  progress,
  buttomText,
  workingLabel,
  submittingLabel = "در حال ارسال درخواست ...",
}: Props) {
  if (
    !(status === "QUEUED" || status === "PROCESSING" || status === "SUBMITTING")
  ) {
    return null;
  }

  const barWidth = `${typeof progress === "number" ? progress : 20}%`;

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ReloadIcon className="animate-spin" />
          <div className="text-sm">
            {status === "SUBMITTING" ? submittingLabel : workingLabel}
          </div>
        </div>
        {typeof eta === "number" && (
          <div className="text-xs text-foreground/60">
            حدود {Math.max(eta, 1)} ثانیه
          </div>
        )}
      </div>

      <div className="mt-3 h-2 w-full bg-muted/30 rounded">
        <div
          className="h-2 bg-accent rounded transition-all"
          style={{ width: barWidth }}
        />
      </div>

      {buttomText !== undefined && (
        <div className="my-3 w-full flex justify-center">
          <p className="text-sm">{buttomText}</p>
        </div>
      )}
    </div>
  );
}
