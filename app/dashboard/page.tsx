"use client";

import { ImageIcon, LightningBoltIcon, VideoIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

type Modality = "language" | "image" | "video";

const MODALITIES: {
  id: Modality;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  accentClass: string;
  hotkey: string;
}[] = [
  {
    id: "language",
    title: "زبان",
    description:
      "گفت‌وگو، تولید محتوا، ترجمه، خلاصه‌سازی و کدنویسی — سریع و دقیق.",
    href: "/dashboard/chat/models",
    icon: <LightningBoltIcon className="w-5 h-5" />,
    accentClass: "group-hover:ring-accent/50",
    hotkey: "1",
  },
  {
    id: "image",
    title: "تصویر",
    description:
      "از متن تا تصویر: لوگو، پوستر، آرت مفهومی، ادیت و اینپینتینگ تمیز.",
    href: "/dashboard/gen/image/models",
    icon: <ImageIcon className="w-5 h-5" />,
    accentClass: "group-hover:ring-accent/50",
    hotkey: "2",
  },
  {
    id: "video",
    title: "ویدیو",
    description:
      "ویدیوهای کوتاه، موشن تبلیغاتی و کانسپت‌شات — تنها با متن یا مرجع.",
    href: "/dashboard/gen/video/models",
    icon: <VideoIcon className="w-5 h-5" />,
    accentClass: "group-hover:ring-accent/50",
    hotkey: "3",
  },
];

export default function DashboardPicker() {
  const router = useRouter();

  // If you want auto-redirect when a saved preference exists, set this to true.
  const AUTO_REDIRECT_ON_PREFERENCE = true;

  const saved = useMemo<Modality | null>(() => {
    if (typeof window === "undefined") return null;
    return (localStorage.getItem("preferred-modality") as Modality) ?? null;
  }, []);

  useEffect(() => {
    if (!AUTO_REDIRECT_ON_PREFERENCE || !saved) return;
    // Allow a brief paint so users see where they’re going
    const t = setTimeout(() => router.replace(hrefFor(saved)), 150);
    return () => clearTimeout(t);
  }, [AUTO_REDIRECT_ON_PREFERENCE, router, saved]);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Background gradient + subtle grid, matching your HeroSection style */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_80%_-10%,oklch(0.92_0.12_280/.8),transparent),radial-gradient(1000px_500px_at_20%_90%,oklch(0.92_0.12_320/.7),transparent)]" />
      <div className="absolute inset-0 -z-10 bg-grid-pattern opacity-[0.06]" />

      <div className="container mx-auto px-4 py-10 md:py-16">
        {/* Optional preference banner */}
        {saved && !AUTO_REDIRECT_ON_PREFERENCE && (
          <div className="mb-4 text-sm rounded-xl border border-border bg-card/70 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-foreground/80">ترجیح قبلی شما:</span>
              <PreferenceChip modality={saved} />
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={hrefFor(saved)}
                className="px-3 py-1.5 rounded-full bg-accent text-white text-xs hover:bg-accent/90"
              >
                رفتن به {labelFor(saved)}
              </Link>
              <button
                onClick={() => localStorage.removeItem("preferred-modality")}
                className="px-3 py-1.5 rounded-full border border-border text-xs hover:bg-accent/10"
              >
                حذف ترجیح
              </button>
            </div>
          </div>
        )}

        <header className="text-center max-w-2xl mx-auto">
          <h1 className="hero-heading text-3xl md:text-4xl leading-tight">
            امروز چه می‌خواهید بسازید؟
          </h1>
          <p className="hero-description mt-3 text-foreground/70">
            زبان، تصویر یا ویدیو — فقط انتخاب کنید. شما را به محیط مناسب هدایت
            می‌کنیم.
          </p>
        </header>

        {/* Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODALITIES.map((m) => (
            <button
              key={m.id}
              className={`group relative rounded-2xl bg-card border border-border p-4 text-right transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${m.accentClass}`}
              aria-label={`انتخاب ${m.title}`}
            >
              <Link
                href={m.href}
                className="absolute inset-0"
                aria-hidden
                tabIndex={-1}
                prefetch
              />
              {/* Icon + title */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-accent/20 text-accent flex items-center justify-center">
                    {m.icon}
                  </div>
                  <div className="text-lg font-semibold">{m.title}</div>
                </div>
              </div>

              <p className="mt-2 text-sm text-foreground/70">{m.description}</p>

              {/* Tags for quick scannability */}
              <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">
                {suggestionsFor(m.id).map((s) => (
                  <li
                    key={s}
                    className="px-2 py-0.5 rounded-full bg-muted/70 text-foreground/80"
                  >
                    {s}
                  </li>
                ))}
              </ul>

              {/* CTA row */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-foreground/60">
                  هدایت مستقیم به {m.title}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-accent text-white text-xs group-hover:bg-accent/90 transition">
                  شروع
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function hrefFor(m: Modality) {
  switch (m) {
    case "language":
      return "/dashboard/chat/models";
    case "image":
      return "/dashboard/gen/image/models";
    case "video":
      return "/dashboard/gen/video/models";
  }
}

function labelFor(m: Modality) {
  return m === "language" ? "زبان" : m === "image" ? "تصویر" : "ویدیو";
}

function suggestionsFor(m: Modality) {
  if (m === "language")
    return ["گفت‌وگو", "تولید محتوا", "خلاصه‌سازی", "ترجمه", "کدنویسی"];
  if (m === "image")
    return ["لوگو", "پوستر", "آرت مفهومی", "اینپینتینگ", "ادیت چهره"];
  return ["کات تبلیغاتی", "Shorts/Reels", "استوری‌بورد", "کانسپت‌شات"];
}

function PreferenceChip({ modality }: { modality: Modality }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
      {labelFor(modality)}
    </span>
  );
}
