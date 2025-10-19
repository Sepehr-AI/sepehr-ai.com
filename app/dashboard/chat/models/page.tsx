"use server";

import UniversalModelSelection, {
  type UniversalModelCard,
} from "@/components/UniversalModelSelection";
import { roundToDecimals } from "@/lib/cost";
import { getLanguageModelsForWeb } from "@/lib/languageModels";

const TOKENS_PER_WORD = 1.5;

export default async function LanguageModelsPage() {
  const models = await getLanguageModelsForWeb();

  const cards: UniversalModelCard[] = models.map((m) => {
    const perThousandWordsIn = roundToDecimals(
      (m.milInCreditCost * TOKENS_PER_WORD) / 1000,
      1,
    );
    const perThousandWordsOut = roundToDecimals(
      (m.milOutCreditCost * TOKENS_PER_WORD) / 1000,
      1,
    );

    return {
      code: m.code,
      name: m.name,
      companyWebsite: m.companyWebsite,
      shortDescription: m.shortDescription,
      creditPills: [
        { label: "اعتبار / هزار کلمه ورودی", value: perThousandWordsIn },
        { label: "اعتبار / هزار کلمه خروجی", value: perThousandWordsOut },
      ],
      href: `/dashboard/chat/new?selectedModel=${encodeURIComponent(m.code)}`,
    };
  });

  return (
    <div className="px-3 py-4 md:py-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold">
            مدل‌های گفتگو (متنی)
          </h1>
        </div>
        <p className="text-sm text-foreground/70">
          از میان مدل‌های مختلف انتخاب کنید. برای شروع روی هر کارت کلیک نمایید.
        </p>

        <UniversalModelSelection type="language" items={cards} />
      </div>
    </div>
  );
}
