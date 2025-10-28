"use client";

import { useCallback, useMemo, useRef, useState } from "react";

type BaseProps = {
  label: string;
  description?: string;
  accept?: string; // e.g. ".png,.jpg"
  maxFileSizeMB?: number;
  acceptedExts?: string[]; // e.g. ["png","jpg"]
  onChange: (files: File[] | File | null) => void;
  multiple?: boolean;
  maxCount?: number;
};

function extOk(name: string, accepted?: string[]) {
  if (!accepted?.length) return true;
  const ext = (name.split(".").pop() || "").toLowerCase();
  return accepted.includes(ext);
}

export default function FilePicker({
  label,
  description,
  accept,
  maxFileSizeMB = 20,
  acceptedExts,
  multiple = false,
  maxCount,
  onChange,
}: BaseProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onFiles = useCallback(
    (incoming: File[]) => {
      setError(null);
      const maxB = maxFileSizeMB * 1024 * 1024;

      const filtered: File[] = [];
      for (const f of incoming) {
        if (f.size > maxB) {
          setError(`هر فایل باید ≤ ${maxFileSizeMB}MB باشد.`);
          continue;
        }
        if (!extOk(f.name, acceptedExts)) {
          setError(
            `فرمت فایل معتبر نیست. فرمت‌های مجاز: ${acceptedExts?.join(", ")}`,
          );
          continue;
        }
        filtered.push(f);
      }

      const next = multiple ? [...files, ...filtered] : filtered.slice(0, 1);
      const limited =
        typeof maxCount === "number" ? next.slice(0, maxCount) : next;

      setFiles(limited);
      onChange(multiple ? limited : (limited[0] ?? null));
    },
    [acceptedExts, files, maxCount, maxFileSizeMB, multiple, onChange],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const arr = Array.from(e.dataTransfer.files || []);
    onFiles(arr);
  };

  const openPicker = () => inputRef.current?.click();

  const previews = useMemo(
    () =>
      files.map((f) => ({
        file: f,
        url: URL.createObjectURL(f),
      })),
    [files],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm text-foreground/90">{label}</label>
        {maxCount && (
          <span className="text-xs text-foreground/60">
            {files.length}/{maxCount}
          </span>
        )}
      </div>

      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="rounded-lg border border-dashed border-border bg-background/60 hover:bg-muted/50 transition-colors"
      >
        <button
          type="button"
          onClick={openPicker}
          className="w-full px-4 py-6 text-sm text-foreground/80"
        >
          برای انتخاب فایل کلیک کنید یا اینجا رها کنید
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => onFiles(Array.from(e.target.files || []))}
        />
      </div>

      {description && (
        <p className="text-xs text-foreground/70 leading-relaxed">
          {description}
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {!!previews.length && (
        <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-3">
          {previews.map(({ file, url }, idx) => (
            <div key={`${file.name}-${idx}`}>
              <div className="relative rounded-md overflow-hidden border border-border">
                {file.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={file.name}
                    className="w-full h-auto object-cover"
                  />
                ) : file.type.startsWith("video/") ? (
                  <video src={url} className="w-full h-auto object-cover" />
                ) : (
                  <div className="p-3 text-xs break-all">{file.name}</div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const next = files.filter((_, i) => i !== idx);
                    setFiles(next);
                    onChange(multiple ? next : (next[0] ?? null));
                  }}
                  className="absolute top-1 right-1 rounded-full bg-black/60 text-white text-xs px-2 py-0.5"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
