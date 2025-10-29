"use client";

import RatioSelector from "@/components/gen/RatioSelector";
import FilePicker from "@/components/gen/inputs/FilePicker";
import type { ModelInput } from "@/lib/modelInput";
import { useMemo, useState } from "react";

type Props = {
  schema: ModelInput;
  onChange: (key: string, value: unknown) => void;
  values: Record<string, unknown>;
};

function extList(accepted?: string[]) {
  return accepted && accepted.length
    ? accepted.map((x) => `.${x}`).join(",")
    : undefined;
}

function labelWithOptionalMark(def: ModelInput[number]) {
  return !def.optional ? def.label : `${def.label} (اختیاری)`;
}

export default function DynamicInputs({ schema, values, onChange }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [basic, advanced] = useMemo(() => {
    const b = schema.filter((x) => !x.advancedSetting);
    const a = schema.filter((x) => x.advancedSetting);
    return [b, a] as const;
  }, [schema]);

  const Field = (def: ModelInput[number]) => {
    const k = def.inputKey;

    switch (def.type) {
      case "text":
        return (
          <div key={k} className="space-y-2">
            <label className="text-sm text-foreground/90">
              {labelWithOptionalMark(def)}
            </label>
            <textarea
              className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 leading-6"
              placeholder={def.placeholder}
              value={String(values[k] ?? "")}
              onChange={(e) => onChange(k, e.target.value)}
              {...(((values[k] as string) || "").length && { dir: "auto" })}
            />
            {def.description && (
              <p className="text-xs text-foreground/70 leading-relaxed">
                {def.description}
              </p>
            )}
          </div>
        );

      case "boolean":
        return (
          <div key={k} className="space-y-1">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(values[k] ?? def.defaultValue ?? false)}
                onChange={(e) => onChange(k, e.target.checked)}
              />
              <span className="text-sm">{labelWithOptionalMark(def)}</span>
            </label>
            {def.description && (
              <p className="text-xs text-foreground/70 leading-relaxed">
                {def.description}
              </p>
            )}
          </div>
        );

      case "selection":
        return (
          <div key={k} className="space-y-2">
            <label className="text-sm text-foreground/90">
              {labelWithOptionalMark(def)}
            </label>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              value={String(values[k] ?? def.defaultValue ?? "")}
              onChange={(e) => onChange(k, e.target.value)}
            >
              <option value="" disabled>
                انتخاب کنید...
              </option>
              {def.options.map((opt) => (
                <option key={String(opt.value)} value={String(opt.value)}>
                  {opt.label}
                </option>
              ))}
            </select>
            {def.description && (
              <p className="text-xs text-foreground/70 leading-relaxed">
                {def.description}
              </p>
            )}
          </div>
        );

      case "float":
      case "integer": {
        const isInt = def.type === "integer";
        const val =
          values[k] !== undefined
            ? String(values[k])
            : def.defaultValue !== undefined
              ? String(def.defaultValue)
              : "";
        return (
          <div key={k} className="space-y-2">
            <label className="text-sm text-foreground/90">
              {labelWithOptionalMark(def)}
            </label>
            <input
              type="number"
              step={isInt ? 1 : 0.01}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              value={val}
              onChange={(e) =>
                onChange(
                  k,
                  isInt
                    ? parseInt(e.target.value || "0")
                    : parseFloat(e.target.value || "0"),
                )
              }
            />
            {def.description && (
              <p className="text-xs text-foreground/70 leading-relaxed">
                {def.description}
              </p>
            )}
          </div>
        );
      }

      case "ratio":
        return (
          <div key={k} className="space-y-2">
            <RatioSelector
              ratios={def.options}
              ratio={String(values[k] ?? def.options[0])}
              setRatio={(r) => onChange(k, r)}
            />
            {def.description && (
              <p className="text-xs text-foreground/70 leading-relaxed">
                {def.description}
              </p>
            )}
          </div>
        );

      case "image":
        return (
          <FilePicker
            key={k}
            description={def.description}
            label={labelWithOptionalMark(def)}
            accept={extList(def.acceptedFormats)}
            acceptedExts={def.acceptedFormats}
            maxFileSizeMB={def.maxFileSize}
            onChange={(v) => onChange(k, v)}
          />
        );

      case "video":
      case "audio":
        return (
          <FilePicker
            key={k}
            description={def.description}
            label={labelWithOptionalMark(def)}
            accept={extList(def.acceptedFormats)}
            acceptedExts={def.acceptedFormats}
            maxFileSizeMB={def.maxFileSize}
            onChange={(v) => onChange(k, v)}
          />
        );

      case "images":
      case "videos":
        return (
          <FilePicker
            key={k}
            description={def.description}
            label={labelWithOptionalMark(def)}
            accept={extList(def.acceptedFormats)}
            acceptedExts={def.acceptedFormats}
            maxFileSizeMB={def.maxFileSize}
            multiple
            maxCount={def.maxCount}
            onChange={(v) => onChange(k, v)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-10">
      <div className="grid gap-6">{basic.map((def) => Field(def))}</div>

      {advanced.length > 0 && (
        <div className="pt-4 border-t border-border">
          <button
            type="button"
            className="text-sm px-3 py-1.5 rounded-md border border-border hover:bg-muted/60"
            onClick={() => setShowAdvanced((s) => !s)}
          >
            {showAdvanced
              ? "پنهان کردن تنظیمات پیشرفته"
              : "نمایش تنظیمات پیشرفته"}
          </button>

          {showAdvanced && (
            <div className="mt-4 grid gap-6">
              {advanced.map((def) => Field(def))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
