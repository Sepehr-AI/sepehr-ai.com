import React from "react";

/**
 * Usage:
 * Replace your current "Ratio selector" JSX with:
 * <RatioSelector
 *   ratios={ratios}
 *   ratio={ratio}
 *   setRatio={setRatio}
 *   disabled={disabled}
 * />
 *
 * This file is intentionally a focused, drop-in component so you can
 * replace the existing block without touching the rest of GenMessageBox.
 */

type Props = {
  ratios: string[];
  ratio: string;
  setRatio: (r: string) => void;
  disabled?: boolean;
};

function parseRatio(r: string): { w: number; h: number } | null {
  if (!r || r === "X:Y") return null;
  const parts = r.split(":").map((p) => parseFloat(p));
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null;
  return { w: parts[0], h: parts[1] };
}

function OrientationBadge({ w, h }: { w: number; h: number }) {
  if (!w || !h) return null;
  if (w === h) return <span className="text-xs">مربع</span>;
  return <span className="text-xs">{w > h ? "افقی" : "عمودی"}</span>;
}

export default function RatioSelector({
  ratios,
  ratio,
  setRatio,
  disabled,
}: Props) {
  return (
    <div>
      <label className="text-sm text-foreground/80">نسبت تصویر خروجی</label>
      <div className="mt-2 flex flex-wrap gap-2">
        {ratios.map((r) => {
          const active = r === ratio;
          const parsed = parseRatio(r);

          // Container for SVG preview
          const viewW = 48;
          const viewH = 32;

          // Calculate a correct preview width/height that preserves the exact aspect ratio
          let previewW = 32;
          let previewH = 32;
          if (parsed) {
            const scale = Math.min(viewW / parsed.w, viewH / parsed.h);
            previewW = Math.max(6, Math.round(parsed.w * scale));
            previewH = Math.max(6, Math.round(parsed.h * scale));
          }

          const ariaLabel = parsed
            ? `${r} — ${parsed.w > parsed.h ? "افقی" : parsed.w < parsed.h ? "عمودی" : "مربع"}`
            : `${r} — مطابق تصویر ورودی`;

          return (
            <button
              key={r}
              type="button"
              aria-pressed={active}
              aria-label={ariaLabel}
              title={ariaLabel}
              onClick={() => setRatio(r)}
              disabled={disabled}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                active
                  ? "bg-accent/10 text-accent border border-accent/40"
                  : "border border-border hover:bg-black/10 dark:hover:bg-muted/60"
              } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {/* Visual preview */}
              {parsed !== null && (
                <div className="flex items-center justify-center w-12 h-8">
                  <svg
                    width={viewW}
                    height={viewH}
                    viewBox={`0 0 ${viewW} ${viewH}`}
                    className="block"
                    aria-hidden
                  >
                    {/* background frame (subtle) */}
                    <rect
                      x={0}
                      y={0}
                      width={viewW}
                      height={viewH}
                      rx={4}
                      fill="transparent"
                      strokeWidth={0}
                    />
                    <rect
                      x={(viewW - previewW) / 2}
                      y={(viewH - previewH) / 2}
                      width={previewW}
                      height={previewH}
                      rx={2}
                      fill={active ? "currentColor" : "transparent"}
                      stroke="currentColor"
                      strokeWidth={1.4}
                      className="opacity-70"
                    />
                  </svg>
                </div>
              )}

              <div className="flex flex-col items-start leading-tight">
                <div className="text-sm truncate">
                  {parsed !== null ? (
                    <span className="text-sm text-foreground/80">
                      {parsed.w}×{parsed.h}
                    </span>
                  ) : (
                    "مطابق تصویر مرجع"
                  )}
                </div>
                <div className="text-sm text-foreground/80 flex items-center gap-2 w-full">
                  {parsed !== null && (
                    <OrientationBadge w={parsed.w} h={parsed.h} />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
