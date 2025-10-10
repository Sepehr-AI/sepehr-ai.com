"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { ImageIcon } from "@radix-ui/react-icons";
import GenMessageBox from "@/components/gen/GenMessageBox";
import JobProgressCard from "@/components/gen/JobProgressCard";
import ResultCard from "@/components/gen/ResultCard";
import { useGenJob } from "@/hooks/useGenJob";
import type { BaseGenModelDto } from "@/types/gen";
import { usePreviewObjectUrl } from "@/hooks/usePreviewObjectUrl";
import type { ImageModelPricingDto } from "@/lib/imageModels";

export default function ImageGenComponent({
  imageModels,
}: {
  imageModels: ImageModelPricingDto[];
}) {
  const [prompt, setPrompt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imagePreviewUrl = usePreviewObjectUrl(imageFile);

  const [modelCode, setModelCode] = useState<string>(imageModels[0].code);
  const selectedModel = useMemo(
    () => imageModels.find((m) => m.code === modelCode)!,
    [imageModels, modelCode],
  );

  const [ratio, setRatio] = useState<string>("1:1");

  const uiModels: BaseGenModelDto[] = useMemo(
    () =>
      imageModels.map((m) => ({
        code: m.code,
        name: m.name,
        description: m.description,
        companyWebsite: m.companyWebsite,
        ratios: m.ratios ?? ["1:1"],
        imageInput: m.imageInput, // already enum-compatible
        creditCostLabel: "اعتبار به ازای هر تصویر",
        creditCostValue: m.creditCostPerImage,
        defaultOptions:
          (m.defaultOptions as Record<string, unknown> | null) ?? null,
      })),
    [imageModels],
  );

  const endOfThePageRef = useRef<HTMLDivElement | null>(null);
  const { status, progress, eta, resultUrl, submit, cancel, resetAll } =
    useGenJob<"imageUrl">({
      fetchInterval: 5000,
      endpoint: "/api/gen/image",
      resultKey: "imageUrl",
      scrollRef: endOfThePageRef,
      messages: {
        canceledInfo: "عملیات لغو شد",
        submitError: "خطا در ارسال درخواست",
        serverError: "خطا در ارتباط با سرور",
        failErrorFallback: "ساخت تصویر ناموفق بود",
      },
    });

  useEffect(() => {
    if (selectedModel.imageInput === "UNAVAILABLE" && imageFile) {
      setImageFile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel]);

  const canSubmit = useMemo(() => {
    return (
      prompt.trim().length > 0 &&
      (status === "IDLE" || status === "FAILED" || status === "SUCCEEDED")
    );
  }, [prompt, status]);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const form = new FormData();
    form.append("prompt", prompt);
    form.append("model", modelCode);

    if (selectedModel.ratios && ratio) form.append("ratio", ratio);

    if (selectedModel.defaultOptions) {
      form.append("options", JSON.stringify(selectedModel.defaultOptions));
    }
    if (selectedModel.imageInput !== "UNAVAILABLE" && imageFile) {
      form.append("image", imageFile);
    }

    await submit(form);
  };

  return (
    <div className="px-3 py-4 md:py-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="px-4 py-3 border-b border-border flex items-center justify-center">
            <div className="flex items-center gap-2">
              <ImageIcon />
              <h2 className="font-semibold">ساخت تصویر با هوش مصنوعی</h2>
            </div>
          </div>
          <div className="p-4 md:p-6 space-y-6">
            <GenMessageBox
              {...{
                ratio,
                prompt,
                setPrompt,
                imageFile,
                modelCode,
                setImageFile,
                imagePreviewUrl,
                models: uiModels,
                setModelId: setModelCode,
                ratios: selectedModel.ratios,
                setRatio: setRatio as Dispatch<SetStateAction<string>>,
                allowImageRef: selectedModel.imageInput !== "UNAVAILABLE",
                canSubmit,
                status,
                onSubmit: handleSubmit,
                labels: {
                  promptPlaceholder: "پرامپ تصویر را بنویسید ...",
                  submitButton: "ساخت تصویر",
                  modelLabel: "مدل هوش مصنوعی",
                  modelSearchPlaceholder: "جستجوی مدل ...",
                  noModelFound: "مدلی یافت نشد",
                  ratioLabel: "نسبت تصویر خروجی",
                  imageRefLabel: "تصویر مرجع (اختیاری)",
                },
              }}
            />
            <JobProgressCard
              status={status}
              eta={eta}
              progress={progress}
              onCancel={cancel}
              workingLabel="در حال تولید تصویر ..."
              submittingLabel="در حال ارسال درخواست ..."
              buttomText="لطفا تا پایان ساخت تصویر منتظر بمانید."
            />
            {status === "SUCCEEDED" && resultUrl && (
              <ResultCard
                kind="image"
                url={resultUrl}
                onReset={resetAll}
                downloadLabel="دانلود تصویر"
                resetLabel="ساخت تصویر دیگر"
              />
            )}
          </div>
        </div>
      </div>
      <div ref={endOfThePageRef}></div>
    </div>
  );
}
