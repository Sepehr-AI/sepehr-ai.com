"use client";

import { useMemo, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import type { LanguageModelPricingDto } from "@/lib/languageModels";
import type { ImageModelPricingDto } from "@/lib/imageModels";
import type { VideoModelPricingDto } from "@/lib/videoModels";
import { LightningBoltIcon, ImageIcon, VideoIcon } from "@radix-ui/react-icons";

export default function ModelShowcase({
  languageModels,
  imageModels,
  videoModels,
}: {
  languageModels: LanguageModelPricingDto[];
  imageModels: ImageModelPricingDto[];
  videoModels: VideoModelPricingDto[];
}) {
  const categories = useMemo(
    () => [
      {
        id: "language",
        title: "زبان",
        icon: <LightningBoltIcon className="w-4 h-4" />,
        description:
          "تولید محتوا، ترجمه، خلاصه‌سازی، تحلیل متن و کدنویسی با مدل‌های روز دنیا.",
        items: languageModels.map((m) => m.name),
      },
      {
        id: "image",
        title: "تصویر",
        icon: <ImageIcon className="w-4 h-4" />,
        description:
          "ایده تا تصویر: لوگو، پوستر، آرت مفهومی، ادیت و اینپینتینگ — سریع و تمیز.",
        items: imageModels.map((m) => m.name),
      },
      {
        id: "video",
        title: "ویدیو",
        icon: <VideoIcon className="w-4 h-4" />,
        description:
          "ویدیوهای کوتاه، موشن‌های تبلیغاتی و کانسپت شات‌ها — تنها با متن یا تصویر مرجع.",
        items: videoModels.map((m) => m.name),
      },
    ],
    [languageModels, imageModels, videoModels],
  );

  const [active, setActive] = useState(categories[0].id);

  return (
    <section id="models" className="py-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">همه مدل‌ها، یک تجربه</h2>
          <p className="text-foreground/70">
            سریع، یکپارچه و قابل اتکا — بدون سوئیچ بین ابزارهای مختلف
          </p>
        </div>

        <Tabs.Root value={active} onValueChange={setActive}>
          <ScrollArea.Root className="w-full" type="scroll">
            <ScrollArea.Viewport className="w-full overflow-x-auto">
              <Tabs.List className="flex gap-2 border-b border-border mb-6 rtl">
                {categories.map((cat) => (
                  <Tabs.Trigger
                    key={cat.id}
                    value={cat.id}
                    className="px-4 py-2 rounded-t-lg text-sm font-medium border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent transition-colors inline-flex items-center gap-2"
                  >
                    {cat.icon}
                    {cat.title}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </ScrollArea.Viewport>
          </ScrollArea.Root>

          {categories.map((cat) => (
            <Tabs.Content key={cat.id} value={cat.id}>
              <div className="bg-card border border-border rounded-2xl p-6">
                <p className="mb-6 text-foreground/70 rtl">{cat.description}</p>
                <ul className="flex flex-wrap gap-2 ltr">
                  {cat.items.slice(0, 24).map((name, i) => (
                    <li
                      key={i}
                      className="px-3 py-1.5 rounded-full bg-accent/25 text-sm hover:bg-accent/30 transition"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </div>
    </section>
  );
}
