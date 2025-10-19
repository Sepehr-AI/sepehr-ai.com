"use server";

import UniversalModelSelection, {
  type UniversalModelCard,
} from "@/components/UniversalModelSelection";
import { getImageModelsForWeb } from "@/lib/imageModels";

export default async function ModelsPage() {
  const models = await getImageModelsForWeb();

  const cards: UniversalModelCard[] = models.map((m) => ({
    code: m.code,
    name: m.name,
    companyWebsite: m.companyWebsite,
    shortDescription: m.shortDescription ?? m.description,
    ratios: m.ratios,
    creditPills: [{ label: "اعتبار / تصویر", value: m.creditCostPerImage }],
    href: `/dashboard/gen/image?selectedModel=${encodeURIComponent(m.code)}`,
  }));

  return (
    <div className="px-3 py-4 md:py-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold">
            مدل‌های ساخت تصویر
          </h1>
        </div>
        <p className="text-sm text-foreground/70">
          از میان مدل‌های مختلف انتخاب کنید. برای شروع روی هر کارت کلیک نمایید.
        </p>

        <UniversalModelSelection type="image" items={cards} />
      </div>
    </div>
  );
}
