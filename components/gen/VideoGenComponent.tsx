"use client";

import GenMessageBox from "@/components/gen/GenMessageBox";
import JobProgressCard from "@/components/gen/JobProgressCard";
import ResultCard from "@/components/gen/ResultCard";
import { useGenJob } from "@/hooks/useGenJob";
import { usePreviewObjectUrl } from "@/hooks/usePreviewObjectUrl";
import type { VideoModelPricingDto } from "@/lib/videoModels";
import type {
  BaseGenModelDto,
  MediaFilesState,
  MediaInputSpec,
} from "@/types/gen";
import { useSearchParams } from "next/navigation";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

export default function VideoGenComponent({
  videoModels,
}: {
  videoModels: VideoModelPricingDto[];
}) {
  // Single source of truth for the selected model
  const [selectedModel, setSelectedModel] = useState<VideoModelPricingDto>(
    videoModels[0],
  );

  // Build UI models on each render (no memoization)
  const uiModels: BaseGenModelDto[] = videoModels.map((m) => ({
    code: m.code,
    name: m.name,
    description: m.description,
    companyWebsite: m.companyWebsite,
    ratios: m.ratios,
    durations: m.durations,
    creditCostLabel: "اعتبار به ازای هر ویدئو",
    creditCostValue: m.creditCostPerVideo,
    defaultOptions:
      (m.defaultOptions as Record<string, unknown> | null) ?? null,
  }));

  const [prompt, setPrompt] = useState("");
  const [legacyImageFile, setLegacyImageFile] = useState<File | null>(null); // kept for backward compatibility
  const imagePreviewUrl = usePreviewObjectUrl(legacyImageFile);

  // ratio/duration are derived from selected model and reset when it changes
  const defaultRatio = () => {
    const modelHas1To1 = selectedModel.ratios.indexOf("1:1") !== -1;
    const modelHas16To9 = selectedModel.ratios.indexOf("16:9") !== -1;
    return modelHas16To9
      ? "16:9"
      : modelHas1To1
        ? "1:1"
        : selectedModel.ratios[0];
  };

  const [ratio, setRatio] = useState<string>(defaultRatio());
  const [lengthSec, setLengthSec] = useState<number | null>(
    selectedModel.durations[selectedModel.durations.length - 1],
  );

  useEffect(() => {
    // Reset fields that depend on the model
    setLegacyImageFile(null);
    setRatio(defaultRatio());
    setLengthSec(
      selectedModel.durations[selectedModel.durations.length - 1] ?? null,
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel]);

  // inside component
  const searchParams = useSearchParams();
  useEffect(() => {
    const code = searchParams.get("selectedModel");
    if (!code) return;
    const m = videoModels.find((x) => x.code === code);
    if (m) setSelectedModel(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build dynamic media inputs for this model (no memoization)
  const mediaInputs: MediaInputSpec[] = (() => {
    const list: MediaInputSpec[] = [];
    if (selectedModel.image)
      list.push({ id: "image", label: "عکس مرجع", accept: "image/*" });
    if (selectedModel.startImage)
      list.push({ id: "start_image", label: "عکس شروع", accept: "image/*" });
    if (selectedModel.endImage)
      list.push({ id: "end_image", label: "عکس پایان", accept: "image/*" });
    if (selectedModel.firstFrameImage)
      list.push({
        id: "first_frame_image",
        label: "عکس فریم اول",
        accept: "image/*",
      });
    if (selectedModel.lastFrameImage)
      list.push({
        id: "last_frame_image",
        label: "عکس فریم  آخر",
        accept: "image/*",
      });
    if (selectedModel.referenceImages)
      list.push({
        id: "reference_images",
        label: "عکس های مرجع",
        accept: "image/*",
        multiple: true,
      });
    if (selectedModel.audio)
      list.push({ id: "audio", label: "صدای تصویر", accept: "audio/*" });
    return list;
  })();

  const [mediaFiles, setMediaFiles] = useState<MediaFilesState>({});

  const endRef = useRef<HTMLDivElement | null>(null);
  const { status, progress, eta, resultUrl, submit, cancel, resetAll } =
    useGenJob<"videoUrl">({
      fetchInterval: 20_000,
      endpoint: "/api/gen/video",
      resultKey: "videoUrl",
      scrollRef: endRef,
      messages: {
        canceledInfo: "عملیات لغو شد",
        submitError: "خطا در ارسال درخواست",
        serverError: "خطا در ارتباط با سرور",
        failErrorFallback: "ساخت ویدئو ناموفق بود",
      },
    });

  const canSubmit =
    prompt.trim().length > 0 &&
    (status === "IDLE" || status === "FAILED" || status === "SUCCEEDED");

  // Adapter so <GenMessageBox> can still set by model id, but we only store the model object
  const setModelId: Dispatch<SetStateAction<string>> = (update) => {
    const nextCode =
      typeof update === "function" ? update(selectedModel.code) : update;
    const next = videoModels.find((m) => m.code === nextCode);
    if (next) setSelectedModel(next);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const form = new FormData();
    form.append("prompt", prompt);
    form.append("model", selectedModel.code);
    if (selectedModel.ratios && ratio) form.append("ratio", ratio);
    if (typeof lengthSec === "number")
      form.append("lengthSec", String(lengthSec));
    if (selectedModel.defaultOptions)
      form.append("options", JSON.stringify(selectedModel.defaultOptions));

    // append dynamic media files with correct keys
    for (const spec of mediaInputs) {
      const files = mediaFiles[spec.id] || [];
      if (!files.length) continue;
      if (spec.multiple) {
        for (const f of files) form.append(spec.id, f);
      } else {
        form.append(spec.id, files[0]);
      }
    }

    await submit(form);
  };

  return (
    <div className="px-3 py-4 md:py-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="px-4 py-3 border-b border-border flex items-center justify-center">
            <h2 className="font-semibold">ساخت ویدئو با هوش مصنوعی</h2>
          </div>
          <div className="p-4 md:p-6 space-y-6">
            <GenMessageBox
              {...{
                ratio,
                prompt,
                setPrompt,
                imageFile: legacyImageFile,
                setImageFile: setLegacyImageFile,
                imagePreviewUrl,
                models: uiModels,
                modelCode: selectedModel.code,
                setModelId,
                ratios: selectedModel.ratios,
                setRatio,
                // dynamic media
                mediaInputs,
                mediaFiles,
                setMediaFiles,
                // lengths
                lengthSec,
                setLengthSec,
                lengths: selectedModel.durations,
                // submission
                canSubmit,
                status,
                onSubmit: handleSubmit,
                // labels
                labels: {
                  promptPlaceholder: "پرامپت ویدئو را بنویسید ...",
                  submitButton: "ساخت ویدئو",
                  modelLabel: "مدل هوش مصنوعی",
                  modelSearchPlaceholder: "جستجوی مدل ...",
                  noModelFound: "مدلی یافت نشد",
                  ratioLabel: "نسبت تصویر خروجی",
                  imageRefLabel: "ورودی‌های رسانه‌ای",
                  lengthLabel: "طول ویدئو",
                },
              }}
            />
            <JobProgressCard
              status={status}
              eta={eta}
              progress={progress}
              onCancel={cancel}
              workingLabel="در حال تولید ویدئو ..."
              submittingLabel="در حال ارسال درخواست ..."
              buttomText="تولید ویدئو چندین دقیقه زمان می‌برد. لطفا تا پایان منتظر بمانید."
            />
            {status === "SUCCEEDED" && resultUrl && (
              <ResultCard
                kind="video"
                url={resultUrl}
                onReset={resetAll}
                downloadLabel="دانلود ویدئو"
                resetLabel="ساخت ویدئوی دیگر"
              />
            )}
          </div>
        </div>
      </div>
      <div ref={endRef} />
    </div>
  );
}
