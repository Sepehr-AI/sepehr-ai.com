"use client";

import type { ModelInput } from "@/lib/modelInput";
import { useMemo } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

function tryParseNumber(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim().length) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function findDurationDef(schema: ModelInput) {
  const keys = ["duration", "lengthSec", "length", "video_duration"];
  const byKey = schema.find(
    (d) => "inputKey" in d && keys.includes(d.inputKey),
  );
  if (byKey) return byKey;
  // fallback heuristic: label contains duration keywords (English/Persian)
  const byLabel = schema.find(
    (d) =>
      "label" in d &&
      typeof d.label === "string" &&
      /(duration|length|طول|مدت)/i.test(d.label),
  );
  return byLabel ?? null;
}

function candidateDurations(def: ModelInput[number] | null): number[] {
  if (!def) return [];
  if (def.type === "selection") {
    const nums = def.options
      .map((o) => tryParseNumber(o.value))
      .filter((n): n is number => n !== null);
    return nums;
  }
  const min = (def as any).min ?? (def as any).mix ?? 1;
  const max = (def as any).max ?? 60;
  const steps = [3, 5, 10, 15, 20, 30, 45, 60];
  return steps.filter((s) => s >= min && s <= max);
}

export default function VideoCostTable({
  schema,
  creditCostPerSecond,
}: {
  schema: ModelInput;
  creditCostPerSecond?: number;
}) {
  const durationDef = useMemo(() => findDurationDef(schema), [schema]);

  const table = useMemo(() => {
    const secs = candidateDurations(durationDef);
    if (!secs.length || !creditCostPerSecond) return null;
    return secs.map((s) => ({
      s,
      credits: Math.round(s * creditCostPerSecond * 100) / 100,
    }));
  }, [creditCostPerSecond, durationDef]);

  return (
    <div className="flex justify-center">
      {table && (
        <div className="w-4xs border-2 border-accent/70 rounded-xl overflow-hidden">
          <div className="text-center px-3 py-2 text-sm bg-muted/60 border-b-2 border-accent/70">
            هزینه بر اساس طول ویدئو
          </div>
          <div className="divide-y divide-border">
            {table.map((row) => (
              <div
                key={row.s}
                className="px-3 py-2 text-sm flex items-center justify-between"
              >
                <span>{row.s} ثانیه</span>
                <span>
                  <span className="text-accent/90 font-bold underline">
                    {row.credits}
                  </span>{" "}
                  اعتبار
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
