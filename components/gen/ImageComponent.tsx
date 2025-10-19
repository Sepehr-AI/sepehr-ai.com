"use client";

import GenMessageBox from "@/components/gen/GenMessageBox";
import JobProgressCard from "@/components/gen/JobProgressCard";
import ResultCard from "@/components/gen/ResultCard";
import { useGenJob } from "@/hooks/useGenJob";
import { usePreviewObjectUrl } from "@/hooks/usePreviewObjectUrl";
import type { ImageModelPricingDto } from "@/lib/imageModels";
import type { BaseGenModelDto } from "@/types/gen";
import { ImageIcon } from "@radix-ui/react-icons";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export default function ImageGenComponent({
  imageModels,
  initialModelCode,
}: {
  imageModels: ImageModelPricingDto[];
  initialModelCode: string;
}) {
  const [prompt, setPrompt] = useState("");
  // SINGLE-image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imagePreviewUrl = usePreviewObjectUrl(imageFile);
  // MULTI-image state
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [modelCode, setModelCode] = useState<string>(
    initialModelCode && imageModels.some((m) => m.code === initialModelCode)
      ? initialModelCode
      : imageModels[0].code,
  );
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

  // Keep image pickers in a valid state whenever the selected model changes.
  useEffect(() => {
    if (selectedModel.imageInput === "UNAVAILABLE") {
      // Clear all images
      if (imageFile) setImageFile(null);
      if (imageFiles.length) setImageFiles([]);
      return;
    }
    if (selectedModel.imageInput === "SINGLE") {
      // If previously MULTI, keep the first file as SINGLE
      if (!imageFile && imageFiles.length > 0) {
        setImageFile(imageFiles[0]);
      }
      if (imageFiles.length > 0) setImageFiles([]);
      return;
    }
    if (selectedModel.imageInput === "MULTI") {
      // If previously SINGLE, migrate to MULTI list
      if (imageFile) {
        setImageFiles([imageFile]);
        setImageFile(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel.imageInput]);

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

    // Attach reference image(s) based on the model's imageInput capability
    if (selectedModel.imageInput === "SINGLE" && imageFile) {
      form.append("image", imageFile);
    } else if (selectedModel.imageInput === "MULTI" && imageFiles.length > 0) {
      // Append multiple images under the "images" key
      for (const f of imageFiles) {
        form.append("images", f);
      }
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
                // SINGLE
                imageFile,
                setImageFile,
                imagePreviewUrl,
                // MULTI
                imageFiles,
                setImageFiles,
                // Models
                modelCode,
                setModelId: setModelCode,
                models: uiModels,
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
                  imageRefLabel:
                    selectedModel.imageInput === "MULTI"
                      ? "تصاویر مرجع (اختیاری)"
                      : "تصویر مرجع (اختیاری)",
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
