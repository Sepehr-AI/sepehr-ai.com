"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import * as Tabs from "@radix-ui/react-tabs";
import * as ScrollArea from "@radix-ui/react-scroll-area";

const modelCategories = [
  {
    id: "marketing",
    title: "مارکتینگ",
    models: [
      "Liquid: LFM 7B",
      "OpenAI: o3 Mini",
      "Google: Gemma 3 4B",
      "Google: Gemini 2.0 Flash",
      "Anthropic: Claude 3.7 Sonnet (self-moderated)",
    ],
    description: "مدل های دستیار مارکتینگ و بهینه‌سازی سئو",
  },
  {
    id: "text",
    title: "تولید محتوا",
    models: [
      "Microsoft: Phi 4",
      "Meta: Llama 4 Scout",
      "DeepSeek: DeepSeek V3 ",
      "Google: Gemini 2.0 Flash",
      "Google: Gemini 1.5 Flash",
    ],
    description: "نوشتن متن، ترجمه، خلاصه‌سازی و ویرایش با کیفیت بالا",
  },
  {
    id: "code",
    title: "برنامه‌نویسی",
    models: [
      "Quasar Alpha",
      "DeepSeek: R1",
      "OpenAI: GPT-4o-mini",
      "Google: Gemini 2.5 Pro",
      "Anthropic: Claude 3.7 Sonnet (thinking)",
    ],
    description: "مدل‌های تخصصی برای کمک به نوشتن، اشکال‌زدایی و توضیح کد",
  },
  {
    id: "translation",
    title: "ترجمه",
    models: [
      "Liquid: LFM 3B",
      "Google: Gemini 1.5 Flash",
      "DeepSeek: DeepSeek V3 0324",
      "Google: Gemini 1.5 Flash 8B",
      "Mistral: Mistral Small 3.1 24B",
    ],
    description: "مدل های قدرتمند ترجمه مقاله، کتاب، و سایر متون",
  },
  {
    id: "research",
    title: "پژوهش",
    models: [
      "WizardLM-2 7B",
      "Qwen: QwQ 32B",
      "OpenAI: GPT-4o",
      "Mistral Large 2411",
      "Meta: Llama 4 Maverick",
    ],
    description: "مدل های هوشمند پژوهش های پایان‌نامه، مقاله‌نویسی، و...",
  },
];

export default function ModelShowcase({
  numberOfWebPlans,
}: {
  numberOfWebPlans: number;
}) {
  const [activeTab, setActiveTab] = useState(modelCategories[0].id);

  return (
    <section id="models" className="py-20">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-600">
              + {numberOfWebPlans} مدل هوش مصنوعی
            </span>
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            دسترسی به طیف گسترده‌ای از مدل‌های هوش مصنوعی برای تمامی نیازها، همه
            در یک پلتفرم واحد
          </p>
        </div>

        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <ScrollArea.Root className="w-full" type="scroll">
            <ScrollArea.Viewport className="w-full overflow-x-scroll">
              <Tabs.List className="flex border-b border-border mb-8 rtl">
                {modelCategories.map((category) => (
                  <Tabs.Trigger
                    key={category.id}
                    value={category.id}
                    className="px-5 py-3 flex-1 text-center text-sm font-medium border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-accent transition-colors"
                  >
                    {category.title}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar
              orientation="horizontal"
              className="h-0.5 flex-none"
            />
          </ScrollArea.Root>

          {modelCategories.map((category) => (
            <Tabs.Content
              key={category.id}
              value={category.id}
              className="focus:outline-none"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="bg-card p-8 rounded-xl border border-border text-right rtl">
                  <h3 className="text-2xl font-bold mb-4">{category.title}</h3>
                  <p className="text-foreground/70 mb-6">
                    {category.description}
                  </p>
                  <ul className="space-y-3 ltr">
                    {category.models.map((model, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 ltr text-left"
                      >
                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                        <span>{model}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-sm text-foreground/60 text-right">
                    و ده ها مدل دیگر از این دسته ...
                  </p>
                </div>
              </motion.div>
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </div>
    </section>
  );
}
