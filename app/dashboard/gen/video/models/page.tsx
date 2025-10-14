"use server";

import UniversalModelSelection, {
  type UniversalModelCard,
} from "@/components/UniversalModelSelection";
import { getVideoModelsForWeb } from "@/lib/videoModels";

export default async function VideoModelsPage() {
  const models = await getVideoModelsForWeb();

  const cards: UniversalModelCard[] = models.map((m) => ({
    code: m.code,
    name: m.name,
    companyWebsite: m.companyWebsite,
    shortDescription: m.shortDescription,
    posterImage: m.showCaseVideoPoster ?? null,
    ratios: m.ratios,
    durationsSec: m.durations,
    creditPills: [{ label: "اعتبار / ویدئو", value: m.creditCostPerVideo }],
    href: `/dashboard/gen/video?selectedModel=${encodeURIComponent(m.code)}`,
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

        <UniversalModelSelection
          items={cards}
          modelShowCaseSubUri="videos/posters"
        />
      </div>
    </div>
  );
}
