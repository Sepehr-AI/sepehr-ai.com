"use client";

import { useTheme } from "@/components/ThemeProvider";
import CompanyLogo from "@/components/companyLogos/CompanyLogo";
import { modelCodeToShowCaseUrl } from "@/lib/url";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

/* eslint-disable @next/next/no-img-element */

export type UniversalModelCard = {
  code: string;
  name: string;
  companyWebsite?: string;
  // Card text
  shortDescription?: string | null;
  // Optional badges
  ratios?: string[]; // e.g. ["16:9", "1:1", "X:Y"]
  durationsSec?: number[]; // e.g. [5, 10, 15]
  // Price pills (show up to 2, rest collapsed)
  creditPills?: { label: string; value: string | number }[];
  // Destination
  href: string;
};

export default function UniversalModelsGrid({
  type,
  items,
}: {
  items: UniversalModelCard[];
  type: "language" | "image" | "video";
}) {
  const { theme } = useTheme();
  const [q, setQ] = useState("");

  const showCaseSubDir = type === "video" ? "videos/posters" : "cards";
  const toUrl = useCallback(
    (code?: string) =>
      code ? modelCodeToShowCaseUrl(code, showCaseSubDir) : "",
    [showCaseSubDir],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.code.toLowerCase().includes(term) ||
        (m.shortDescription || "").toLowerCase().includes(term),
    );
  }, [q, items]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجوی مدل ..."
          className="w-full p-3 pr-9 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/40"
          style={{ direction: !q.length ? "rtl" : "ltr" }}
        />
        <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50" />
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((m) => {
          return (
            <Link
              key={m.code}
              href={m.href}
              className={
                `group rounded-xl overflow-hidden border border-border bg-card hover:shadow-md transition-shadow flex flex-col ` +
                (theme === "dark"
                  ? "shadow-lg/10 shadow-accent "
                  : "shadow-lg/50 shadow-foreground ")
              }
            >
              <div className="relative aspect-[16/10] bg-muted/30">
                <img
                  src={toUrl(m.code)}
                  alt={m.name}
                  className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>

              <div className="p-3 flex-1 flex flex-col gap-2">
                <div className="ltr arial-sans-serif flex justify-center items-center gap-2">
                  <CompanyLogo
                    companyWebsite={m.companyWebsite ?? ""}
                    className="h-5 w-5 rounded-full"
                  />
                  <div className="font-medium">{m.name}</div>
                </div>

                <div className="flex-auto flex flex-col justify-center gap-1">
                  {m.shortDescription && (
                    <p className="text-xs text-foreground/70 line-clamp-2">
                      {m.shortDescription}
                    </p>
                  )}

                  {/* Ratios */}
                  {m.ratios?.length ? (
                    <div className="ltr flex flex-wrap gap-1 my-1.5">
                      {m.ratios.slice(0, 5).map((r) => (
                        <span
                          key={r}
                          className="text-xs px-1.5 py-0.5 bg-muted/70 rounded-md text-foreground/80"
                        >
                          {r !== "X:Y" ? r : "مطابق مرجع"}
                        </span>
                      ))}
                      {m.ratios.length > 5 && (
                        <span className="text-xs px-1.5 py-0.5 bg-muted/70 rounded-md text-foreground/80">
                          +{m.ratios.length - 5}
                        </span>
                      )}
                    </div>
                  ) : null}

                  {/* Durations */}
                  {m.durationsSec?.length ? (
                    <div className="ltr flex flex-wrap gap-1">
                      {m.durationsSec.slice(0, 6).map((d) => (
                        <span
                          key={d}
                          className="text-xs px-1.5 py-0.5 bg-muted/70 rounded-md text-foreground/80"
                        >
                          {d}s
                        </span>
                      ))}
                      {m.durationsSec.length > 6 && (
                        <span className="text-xs px-1.5 py-0.5 bg-muted/70 rounded-md text-foreground/80">
                          +{m.durationsSec.length - 6}
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Credit pills */}
                {(m.creditPills?.length ?? 0) > 0 && (
                  <div className="mt-auto flex items-center justify-center gap-1 pt-1 flex-wrap">
                    {m.creditPills!.slice(0, 2).map((pill, i) => (
                      <div
                        key={pill.label + i}
                        className="text-[11px] border border-accent/80 text-accent rounded-2xl px-2 py-0.5"
                      >
                        {pill.value} {pill.label}
                      </div>
                    ))}
                    {m.creditPills!.length > 2 && (
                      <div className="text-[11px] border border-accent/40 text-accent/80 rounded-2xl px-2 py-0.5">
                        +{m.creditPills!.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-sm text-foreground/60 py-8">
          مدلی مطابق جستجوی شما یافت نشد.
        </div>
      )}
    </div>
  );
}
