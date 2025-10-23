"use client";

import DynamicInputs from "@/components/gen/DynamicInputs";
import JobProgressCard from "@/components/gen/JobProgressCard";
import ModelHeader from "@/components/gen/ModelHeader";
import ResultCard from "@/components/gen/ResultCard";
import { useGenJob } from "@/hooks/useGenJob";
import type { ImageModelPricingDto } from "@/lib/imageModels";
import type { VideoModelPricingDto } from "@/lib/videoModels";
import { useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

type UnifiedModel = (ImageModelPricingDto | VideoModelPricingDto) & {
  unitCost: number; // credits: image -> per image, video -> per second
};

function buildInitialValues(model: UnifiedModel): Record<string, unknown> {
  const v: Record<string, unknown> = {};
  for (const def of model.inputSchema) {
    if ("defaultValue" in def && def.defaultValue !== undefined) {
      v[def.inputKey] = def.defaultValue as any;
    }
  }

  // default the first ratio if present and not already set by defaults
  const ratioDef = model.inputSchema.find((d) => d.type === "ratio");
  if (ratioDef && v[ratioDef.inputKey] === undefined) {
    const has1To1 = ratioDef.options.includes("1:1");
    const has16To9 = ratioDef.options.includes("16:9");
    v[ratioDef.inputKey] = has1To1
      ? "1:1"
      : has16To9
        ? "16:9"
        : ratioDef.options[0];
  }
  return v;
}

export default function GenComponent({
  kind,
  model,
  header,
  submitLabel,
}: {
  header: string;
  submitLabel: string;
  model: UnifiedModel;
  kind: "IMAGE" | "VIDEO";
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    buildInitialValues(model),
  );

  const setValue = (k: string, v: unknown) =>
    setValues((old) => ({ ...old, [k]: v }));

  const endRef = useRef<HTMLDivElement | null>(null);

  const { status, progress, eta, resultUrl, submit, cancel, resetAll } =
    useGenJob<"resultUrl">({
      fetchInterval: 30_000,
      endpoint: "/api/gen",
      resultKey: "resultUrl",
      scrollRef: endRef,
      messages: {
        canceledInfo: "عملیات لغو شد",
        submitError: "خطا در ارسال درخواست",
        serverError: "خطا در ارتباط با سرور",
        failErrorFallback: "عملیات ناموفق بود",
      },
    });

  const canSubmit =
    values?.["prompt"] &&
    String(values["prompt"]).trim().length > 0 &&
    (status === "IDLE" || status === "FAILED" || status === "SUCCEEDED");

  const onSubmit = async () => {
    if (!canSubmit) return;
    const fd = new FormData();
    fd.append("model", model.code);
    fd.append("kind", kind); // IMAGE | VIDEO

    for (const def of model.inputSchema) {
      const k = def.inputKey;
      const v = values[k];
      if (v === undefined || v === null) continue;

      if (def.type === "images" || def.type === "videos") {
        (v as File[]).forEach((f) => fd.append(k, f));
      } else if (
        def.type === "image" ||
        def.type === "video" ||
        def.type === "audio"
      ) {
        fd.append(k, v as File);
      } else {
        fd.append(k, String(v));
      }
    }

    await submit(fd);
  };

  const creditUnitValue = model.unitCost;
  const creditUnitLabel = kind === "IMAGE" ? "تصویر" : "ثانیه ویدئو";

  return (
    <div className="px-4 py-8 md:py-10">
      <div className="max-w-5xl mx-auto">
        <div className="bg-card border border-border rounded-2xl shadow-sm">
          <div className="px-6 py-5 border-b border-border flex items-center justify-center">
            <h2 className="text-lg md:text-xl font-semibold">{header}</h2>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            <ModelHeader
              kind={kind}
              name={model.name}
              unitCost={model.unitCost}
              schema={model.inputSchema}
              description={model.description}
              creditUnitLabel={creditUnitLabel}
              creditUnitValue={creditUnitValue}
              companyWebsite={model.companyWebsite}
            />

            <DynamicInputs
              values={values}
              onChange={setValue}
              schema={model.inputSchema}
            />

            <div className="flex items-center justify-end">
              <button
                onClick={onSubmit}
                disabled={!canSubmit}
                className="px-4 py-2 rounded-md bg-accent text-white disabled:opacity-60"
              >
                {submitLabel}
              </button>
            </div>

            <JobProgressCard
              status={status}
              eta={eta}
              progress={progress}
              onCancel={cancel}
              workingLabel={`در حال تولید ${kind === "VIDEO" ? "ویدئو" : "تصویر"} ...`}
              submittingLabel="در حال ارسال درخواست ..."
              buttomText="لطفا تا پایان منتظر بمانید."
            />

            {status === "SUCCEEDED" && resultUrl && (
              <ResultCard
                kind={kind}
                url={resultUrl}
                onReset={resetAll}
                downloadLabel="دانلود"
                resetLabel={`ساخت ${kind === "VIDEO" ? "ویدئوی" : "تصویر"} دیگر`}
              />
            )}
          </div>
        </div>
      </div>
      <div ref={endRef} />
    </div>
  );
}
