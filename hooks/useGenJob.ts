/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import type { JobStatus } from "@/types/jobs";
import { useRef, useState } from "react";
import { toast } from "react-toastify";

/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-explicit-any */

type UseGenJobOptions<ResultKey extends string> = {
  endpoint: string;
  resultKey: ResultKey;
  fetchInterval?: number;
  scrollRef?: React.RefObject<HTMLElement | null>;
  messages?: {
    canceledInfo?: string; // "عملیات لغو شد"
    submitError?: string; // "خطا در ارسال درخواست"
    serverError?: string; // "خطا در ارتباط با سرور"
    failErrorFallback?: string; // "ساخت تصویر ناموفق بود"
  };
};

type PollResponseBase = {
  status: Exclude<JobStatus, "IDLE" | "SUBMITTING" | "CANCELED">;
  progress?: number;
  etaSeconds?: number;
  error?: string;
  // dynamic fields (e.g., imageUrl)
  [k: string]: unknown;
};

export function useGenJob<ResultKey extends string>({
  endpoint,
  resultKey,
  scrollRef,
  messages,
  fetchInterval = 5000,
}: UseGenJobOptions<ResultKey>) {
  const {
    canceledInfo = "عملیات لغو شد",
    submitError = "خطا در ارسال درخواست",
    serverError = "خطا در ارتباط با سرور",
    failErrorFallback = "ساخت خروجی ناموفق بود",
  } = messages || {};

  const [status, setStatus] = useState<JobStatus>("IDLE");
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [eta, setEta] = useState<number | undefined>(undefined);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearPolling = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = null;
  };

  const resetAll = () => {
    clearPolling();
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("IDLE");
    setProgress(undefined);
    setEta(undefined);
    setResultUrl(null);
  };

  const cancel = () => {
    setStatus("CANCELED");
    clearPolling();
    abortRef.current?.abort();
    toast.info(canceledInfo, { position: "top-center" });
  };

  const submit = async (form: FormData) => {
    setStatus("SUBMITTING");
    setProgress(undefined);
    setEta(undefined);
    setResultUrl(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: form,
        signal: controller.signal,
      });

      if (!res.ok) {
        // Try to read server-side Farsi error
        let msg = submitError;
        try {
          const err = (await res.json()) as { error?: string };
          if (err?.error) msg = err.error;
        } catch {}
        throw new Error(msg);
      }

      const json = (await res.json()) as { jobId: number };
      setStatus("QUEUED");
      clearPolling();

      // Keep UX identical: scroll to end upon queueing
      scrollRef?.current?.scrollIntoView({ block: "end", behavior: "smooth" });

      pollTimerRef.current = setInterval(async () => {
        try {
          const r = await fetch(`${endpoint}?jobId=${json.jobId}`, {
            signal: controller.signal,
          });

          if (!r.ok) {
            let msg = serverError;
            try {
              const err = (await r.json()) as { error?: string };
              if (err?.error) msg = err.error;
            } catch {}
            throw new Error(msg);
          }

          const data = (await r.json()) as PollResponseBase;

          setStatus(data.status);
          setProgress(
            typeof data.progress === "number" ? data.progress : undefined,
          );
          setEta(
            typeof data.etaSeconds === "number" ? data.etaSeconds : undefined,
          );

          if (data.status === "SUCCEEDED") {
            const url = (data[resultKey] as string | undefined) ?? null;
            setResultUrl(url);
            clearPolling();
          } else if (data.status === "FAILED") {
            clearPolling();
            const errMsg =
              (typeof data.error === "string" && data.error) ||
              failErrorFallback;
            toast.error(errMsg, { position: "top-center" });
          }
        } catch (e: any) {
          if (controller.signal.aborted) return;
          clearPolling();
          setStatus("FAILED");
          toast.error(e?.message || serverError, { position: "top-center" });
        }
      }, fetchInterval);
    } catch (e: any) {
      if (!controller.signal.aborted) {
        setStatus("FAILED");
        toast.error(e?.message || submitError, { position: "top-center" });
      }
    }
  };

  return {
    status,
    progress,
    eta,
    resultUrl,
    submit,
    cancel,
    resetAll,
  };
}
