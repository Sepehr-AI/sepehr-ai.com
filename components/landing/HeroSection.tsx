"use client";

import * as Separator from "@radix-ui/react-separator";
import Link from "next/link";

export default function HeroSection({
  totalModels,
  langCount,
  imgCount,
  vidCount,
}: {
  totalModels: number;
  langCount: number;
  imgCount: number;
  vidCount: number;
}) {
  return (
    <section className="relative py-24 md:py-36 overflow-hidden">
      {/* Background gradient + subtle grid */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_80%_-10%,oklch(0.92_0.12_280/.8),transparent),radial-gradient(1000px_500px_at_20%_90%,oklch(0.92_0.12_320/.7),transparent)]" />
      <div className="absolute inset-0 -z-10 bg-grid-pattern opacity-[0.06]" />

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="hero-heading leading-tight">
            با سپهر AI
            <br />
            <span className="hero-gradient">هر سه جهان هوش مصنوعی</span> در یک
            پلتفرم
          </h1>

          <p className="hero-description">
            تولید متن، ساخت تصویر و خلق ویدیو — همه با بیش از {totalModels}+ مدل
            پیشرفته، بر روی پلتفرم سپهر AI.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth"
              className="bg-accent hover:bg-accent/90 text-white px-8 py-3 rounded-full font-medium transition-colors"
            >
              شروع
            </Link>
            <Link
              href="#pricing"
              className="px-8 py-3 rounded-full font-medium border border-border hover:bg-accent/10 transition-colors"
            >
              مشاهده قیمت‌ها
            </Link>
          </div>

          <Separator.Root className="bg-border h-px w-16 mx-auto my-10" />

          <div className="mx-auto grid grid-cols-3 gap-4 max-w-lg text-sm">
            <Stat number={langCount} label="مدل زبانی" />
            <Stat number={imgCount} label="مدل تصویر" />
            <Stat number={vidCount} label="مدل ویدیو" />
          </div>

          <p className="mt-6 text-foreground/70 text-sm">
            بدون قفل پلتفرم • حریم خصوصی‌محور • پایداری بالا
          </p>
        </div>
      </div>
    </section>
  );
}

function Stat({ number, label }: { number: number; label: string }) {
  return (
    <div className="rounded-xl bg-card border border-border px-4 py-3">
      <div className="text-xl font-bold">{number.toLocaleString()}+</div>
      <div className="text-foreground/70">{label}</div>
    </div>
  );
}
