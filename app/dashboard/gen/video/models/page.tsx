"use server";

import UniversalModelSelection, {
  type UniversalModelCard,
} from "@/components/UniversalModelSelection";
import { getVideoModelsForWeb } from "@/lib/videoModels";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function VideoModelsPage() {
  const models = await getVideoModelsForWeb();

  const cards: UniversalModelCard[] = models.map((m) => ({
    code: m.code,
    name: m.name,
    companyWebsite: m.companyWebsite,
    shortDescription: m.shortDescription,
    ratios: m.inputSchema.find((s) => s.type === "ratio")?.options,
    creditPills: [{ label: "اعتبار / هر ثانیه ویدئو", value: m.unitCost }],
    href: `/dashboard/gen/video?selectedModel=${encodeURIComponent(m.code)}`,
    durationsSec: (
      m.inputSchema.find(
        (s) =>
          s.type === "selection" &&
          (s.inputKey === "duration" || s.inputKey === "seconds"),
      ) as any
    )?.options.map(({ value }: { value: string }) => value),
  }));

  return (
    <div className="px-3 py-4 md:py-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold">
            مدل‌های ساخت ویدئو
          </h1>
        </div>
        <p className="text-sm text-foreground/70">
          از میان مدل‌های مختلف انتخاب کنید. برای شروع روی هر کارت کلیک نمایید.
        </p>

        <UniversalModelSelection type="video" items={cards} />
      </div>
    </div>
  );
}
