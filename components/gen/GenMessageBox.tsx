"use client";

import CompanyLogo from "@/components/companyLogos/CompanyLogo";
import type {
  BaseGenModelDto,
  MediaFilesState,
  MediaInputSpec,
} from "@/types/gen";
import type { JobStatus } from "@/types/jobs";
import {
  CaretSortIcon,
  CheckIcon,
  Cross2Icon,
  ImageIcon,
  MagnifyingGlassIcon,
  PaperPlaneIcon,
} from "@radix-ui/react-icons";
import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import RatioSelector from "./RatioSelector";

/* eslint-disable @next/next/no-img-element */

interface Props {
  // Prompt + reference image(s)
  prompt: string;
  setPrompt: Dispatch<SetStateAction<string>>;

  // SINGLE
  imageFile: File | null;
  setImageFile: Dispatch<SetStateAction<File | null>>;
  imagePreviewUrl: string | null;

  // MULTI
  imageFiles?: File[];
  setImageFiles?: Dispatch<SetStateAction<File[]>>;

  allowImageRef?: boolean;

  // Models
  modelCode: string;
  setModelId: Dispatch<SetStateAction<string>>;
  models: BaseGenModelDto[];

  // Optional multi-inputs (video)
  mediaInputs?: MediaInputSpec[];
  mediaFiles?: MediaFilesState;
  setMediaFiles?: Dispatch<SetStateAction<MediaFilesState>>;

  // Ratio
  ratio: string;
  ratios: string[];
  setRatio: Dispatch<SetStateAction<string>>;

  // Length (seconds) — optional, pass only for video
  lengthSec?: number | null;
  setLengthSec?: Dispatch<SetStateAction<number | null>>;
  lengths?: number[] | null;

  // Submission
  canSubmit: boolean;
  status: JobStatus;
  onSubmit: () => void;

  // Text labels (to customize for image/video)
  labels: {
    promptPlaceholder: string;
    submitButton: string;
    modelLabel?: string;
    modelSearchPlaceholder?: string;
    noModelFound?: string;

    ratioLabel?: string;
    imageRefLabel?: string;

    // Only shown if lengths provided
    lengthLabel?: string;
  };
}

function fieldKey(id: string, index?: number) {
  return index === undefined ? id : `${id}__${index}`;
}

function DropZone({
  files,
  isImage,
  placeholder,
  onClick,
  disabled,
}: {
  files: File[];
  isImage: boolean;
  placeholder: ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  const imageSrc = useMemo(
    () => (files.length && isImage ? URL.createObjectURL(files[0]) : undefined),
    [files, isImage],
  );

  return (
    <div
      className="mt-2 hover:cursor-pointer border border-dashed border-border rounded-md p-2 bg-muted/20 flex items-center justify-center min-h-[96px] overflow-hidden"
      onClick={() => !disabled && onClick()}
      role="button"
      aria-label="file-picker"
      title="file-picker"
    >
      {files.length > 0 ? (
        isImage ? (
          <img
            src={imageSrc}
            alt={files[0].name}
            className="max-h-32 object-contain rounded"
          />
        ) : (
          <div className="text-xs text-foreground/90">
            {files[0].name}
            {files.length > 1 ? ` +${files.length - 1}` : ""}
          </div>
        )
      ) : (
        <div className="text-foreground/80 text-xs flex items-center gap-2">
          <ImageIcon /> {placeholder}
        </div>
      )}
    </div>
  );
}

export default function GenMessageBox({
  prompt,
  setPrompt,
  imageFile,
  setImageFile,
  imagePreviewUrl,

  models,
  modelCode,
  setModelId,

  ratio,
  setRatio,
  ratios,

  lengthSec,
  setLengthSec,
  lengths,

  canSubmit,
  status,
  onSubmit,

  allowImageRef = true,

  labels,
  mediaInputs,
  mediaFiles,
  setMediaFiles,

  // MULTI-image support
  imageFiles = [],
  setImageFiles,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const referenceImages = useMemo(
    () => mediaInputs?.find((i) => i.id === "reference_images"),
    [mediaInputs],
  );

  // Auto-resize textarea
  useEffect(() => {
    if (!textAreaRef.current) return;
    textAreaRef.current.style.height = "24px";
    textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
  }, [prompt]);

  const disabled =
    status === "SUBMITTING" || status === "QUEUED" || status === "PROCESSING";

  const selectedModel = models.find((m) => m.code === modelCode);

  // Custom dropdown state
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // One ref per input key (including per-slot keys for reference images)
  const mediaInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const onPick = (
    fieldId: string,
    files: FileList | null,
    multiple?: boolean,
  ) => {
    if (!setMediaFiles) return;
    const next: MediaFilesState = { ...(mediaFiles || {}) };
    next[fieldId] = files
      ? multiple
        ? Array.from(files)
        : ([files[0]].filter(Boolean) as File[])
      : [];
    setMediaFiles(next);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsSelectOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // MULTI: helpers
  const onMultiPick = (filesList: FileList | null) => {
    if (!setImageFiles) return;
    if (!filesList || filesList.length === 0) return;
    const picked = Array.from(filesList);
    // Append to existing, avoid duplicates by name+size+lastModified
    const key = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;
    const existingKeys = new Set(imageFiles.map(key));
    const merged = [
      ...imageFiles,
      ...picked.filter((f) => !existingKeys.has(key(f))),
    ];
    setImageFiles(merged);
    // reset input so the same file can be re-picked if removed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeMultiAt = (idx: number) => {
    if (!setImageFiles) return;
    setImageFiles(imageFiles.filter((_, i) => i !== idx));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imageInputMode = (selectedModel as any)?.imageInput ?? "SINGLE";

  const imageFileUrls = useMemo(
    () => (imageFiles ? imageFiles.map((f) => URL.createObjectURL(f)) : []),
    [imageFiles],
  );

  return (
    <div className="space-y-4">
      {/* Prompt */}
      <div className="border border-border bg-background rounded-lg p-3 relative">
        <textarea
          ref={textAreaRef}
          className="w-full bg-transparent border-0 outline-none resize-none max-h-[60dvh] px-1.5 pt-1 pb-8"
          placeholder={labels.promptPlaceholder}
          value={prompt}
          {...(prompt.length && { dir: "auto" })}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={disabled}
        />
        <div className="absolute left-2 bottom-2 flex items-center gap-2">
          <button
            onClick={onSubmit}
            type="button"
            disabled={!canSubmit || disabled}
            className={`px-3 py-1.5 rounded-md text-sm text-white flex items-center gap-1 ${
              canSubmit && !disabled
                ? "bg-accent hover:bg-accent/90"
                : "bg-accent/60 cursor-not-allowed"
            }`}
          >
            <PaperPlaneIcon className="h-4 w-4" />
            {labels.submitButton}
          </button>
        </div>

        {/* Hidden input for SINGLE and MULTI modes */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          multiple={imageInputMode === "MULTI"}
          onChange={(e) => {
            if (imageInputMode === "MULTI") {
              onMultiPick(e.target.files);
            } else {
              const f = e.target.files?.[0] || null;
              setImageFile(f);
            }
          }}
          disabled={disabled}
        />
      </div>
      {/* Model picker */}
      <div
        className="border border-border bg-background rounded-lg p-3"
        ref={dropdownRef}
      >
        <label className="text-sm text-foreground/80">
          {labels.modelLabel ?? "مدل هوش مصنوعی"}
        </label>
        <div className="pt-2 relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                const toggled = !isSelectOpen;
                setIsSelectOpen(toggled);
                if (!toggled) setSearchTerm("");
              }
            }}
            className={`ltr text-center flex items-center justify-between w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors ${
              disabled ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <div className="flex-auto"></div>
            <div className="flex items-center gap-2 overflow-hidden text-sm md:text-base lg:text-lg">
              {selectedModel?.name}
            </div>
            <div className="flex-auto"></div>
            <CaretSortIcon />
          </button>

          {isSelectOpen && (
            <div className="absolute z-50 bg-popover border border-border rounded-md shadow-md overflow-hidden min-w-full mt-1">
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={
                      labels.modelSearchPlaceholder ?? "جستجوی مدل ..."
                    }
                    className="w-full p-2 pr-8 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50"
                    autoFocus
                    style={{ direction: !searchTerm.length ? "rtl" : "ltr" }}
                  />
                  <MagnifyingGlassIcon className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/80" />
                </div>
              </div>

              <div className="max-h-60 p-1 overflow-y-auto">
                {filteredModels.length > 0 ? (
                  filteredModels.map((m) => (
                    <button
                      key={m.code}
                      type="button"
                      className={`ltr text-left flex items-center gap-2 p-2 w-full rounded-md text-sm outline-none hover:bg-accent/10 hover:text-accent ${
                        modelCode === m.code ? "bg-accent/10 text-accent" : ""
                      }`}
                      onClick={() => {
                        setModelId(m.code);
                        setIsSelectOpen(false);
                        setSearchTerm("");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <CompanyLogo
                          companyWebsite={m.companyWebsite ?? ""}
                          className="h-4 w-4 rounded-full"
                        />
                        <span>{m.name}</span>
                      </div>
                      {modelCode === m.code && (
                        <CheckIcon className="ml-auto" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-2 text-sm text-foreground/70 text-center">
                    {labels.noModelFound ?? "مدلی یافت نشد"}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {selectedModel && (
          <div className="flex flex-col items-center justify-center mt-4">
            <div className="w-18 h-18 flex items-center justify-center mb-4">
              <CompanyLogo
                companyWebsite={selectedModel.companyWebsite ?? ""}
                className="w-full h-full"
              />
            </div>
            <div className="border-accent border-1 rounded-3xl py-1 px-2 text-foreground/90">
              <span>مصرف</span>
              <span> {selectedModel.creditCostValue} </span>
              <span>{selectedModel.creditCostLabel}</span>
            </div>
            <div className="mx-3 mt-2 mb-2 text-xs md:text-sm text-foreground/80">
              {selectedModel.description}
            </div>
          </div>
        )}
      </div>

      {selectedModel && selectedModel.userNotes && (
        <div
          role="note"
          className="mt-4 flex items-start gap-3 border border-blue-300 bg-blue-50/60 rounded-lg p-3"
        >
          <span className="flex-shrink-0 mt-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
              <line x1="11.25" y1="12" x2="12.75" y2="12" />
              <path d="M12 14v2" />
            </svg>
          </span>

          <div className="text-sm leading-tight">{selectedModel.userNotes}</div>
        </div>
      )}

      {/* Reference Image(s) (only when dynamic media inputs are NOT used) */}
      {(!mediaInputs || !mediaInputs.length) && allowImageRef && (
        <div>
          <label className="text-sm text-foreground/80">
            {labels.imageRefLabel ??
              (imageInputMode === "MULTI"
                ? "تصاویر مرجع (اختیاری)"
                : "تصویر مرجع (اختیاری)")}
          </label>

          {/* MULTI-mode grid */}
          {imageInputMode === "MULTI" ? (
            <>
              <div
                className="mt-2 hover:cursor-pointer border border-dashed border-border rounded-md p-2 bg-muted/20 flex items-center justify-center min-h-[96px] overflow-hidden"
                onClick={() => !disabled && fileInputRef.current?.click()}
                role="button"
                aria-label="انتخاب تصاویر"
                title="انتخاب تصاویر"
              >
                <div className="text-foreground/80 text-xs flex items-center gap-2">
                  <ImageIcon />
                  افزودن تصاویر مرجع
                </div>
              </div>

              {imageFiles.length > 0 && (
                <>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {imageFiles.map((f, idx) => (
                      <div
                        key={`${f.name}-${f.size}-${f.lastModified}-${idx}`}
                        className="relative group border border-border rounded-md overflow-hidden"
                        title={f.name}
                      >
                        <img
                          alt={f.name}
                          src={imageFileUrls[idx]}
                          className="w-full h-28 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeMultiAt(idx)}
                          disabled={disabled}
                          className="absolute top-1 right-1 bg-background/80 hover:bg-background text-foreground border border-border rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="حذف تصویر"
                          title="حذف تصویر"
                        >
                          <Cross2Icon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-1 text-[10px] text-foreground/60">
                    {imageFiles.length} تصویر انتخاب شده
                  </div>
                </>
              )}
            </>
          ) : (
            // SINGLE-mode picker
            <>
              <div
                className="mt-2 hover:cursor-pointer border border-dashed border-border rounded-md p-2 bg-muted/20 flex items-center justify-center min-h-[96px] overflow-hidden"
                onClick={() => !disabled && fileInputRef.current?.click()}
                role="button"
                aria-label="انتخاب تصویر"
                title="انتخاب تصویر"
              >
                {imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt={imageFile?.name || "preview"}
                    className="max-h-32 object-contain rounded"
                  />
                ) : (
                  <div className="text-foreground/80 text-xs flex items-center gap-2">
                    <ImageIcon />
                    افزودن تصویر مرجع
                  </div>
                )}
              </div>
              {imageFile && (
                <div className="mt-1 text-[10px] text-foreground/60 truncate">
                  {imageFile.name}
                </div>
              )}
            </>
          )}
        </div>
      )}
      {/* Ratio selector (always visible if ratios are provided) */}
      {ratios.length > 0 && (
        <RatioSelector
          ratios={ratios}
          ratio={ratio}
          setRatio={setRatio}
          disabled={disabled}
        />
      )}
      {/* Dynamic media inputs (video) */}
      {mediaInputs && mediaInputs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {mediaInputs.map((f) => {
            if (f.id === "reference_images") return null;

            const files = mediaFiles?.[f.id] || [];
            const isImage = f.accept.startsWith("image/");

            return (
              <div key={f.id} className="md:col-span-1">
                <label className="text-sm text-foreground/80">
                  {f.label} (اختیاری)
                </label>

                <DropZone
                  files={files}
                  isImage={isImage}
                  placeholder={<>افزودن</>}
                  onClick={() => mediaInputRefs.current[f.id]?.click()}
                  disabled={disabled}
                />

                {/* Exactly ONE hidden input per field id */}
                <input
                  ref={(el) => {
                    mediaInputRefs.current[f.id] = el;
                  }}
                  type="file"
                  accept={f.accept}
                  style={{ display: "none" }}
                  multiple={(f.maximumNumberOfEntity || 1) > 1}
                  onChange={(e) =>
                    onPick(
                      f.id,
                      e.target.files,
                      (f.maximumNumberOfEntity || 1) > 1,
                    )
                  }
                  disabled={disabled}
                />

                {files.length > 0 && (
                  <div className="mt-1 text-[10px] text-foreground/60 truncate">
                    {files.map((x) => x.name).join(", ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Reference images (video) */}
      {referenceImages !== undefined && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({
            length: referenceImages.maximumNumberOfEntity || 1,
          }).map((_, i) => {
            const key = fieldKey(referenceImages.id, i);
            const files = mediaFiles?.[key] || [];
            const isImage = referenceImages.accept.startsWith("image/");

            return (
              <div key={key} className="md:col-span-1">
                <label className="text-sm text-foreground/80">
                  تصویر رفرنس {i + 1} (اختیاری)
                </label>

                <DropZone
                  files={files}
                  isImage={isImage}
                  placeholder={<>افزودن</>}
                  onClick={() => mediaInputRefs.current[key]?.click()}
                  disabled={disabled}
                />

                {/* Unique hidden input and unique storage key per slot */}
                <input
                  ref={(el) => {
                    mediaInputRefs.current[key] = el;
                  }}
                  type="file"
                  accept={referenceImages.accept}
                  style={{ display: "none" }}
                  multiple={false}
                  onChange={(e) => onPick(key, e.target.files, false)}
                  disabled={disabled}
                />

                {files.length > 0 && (
                  <div className="mt-1 text-[10px] text-foreground/60 truncate">
                    {files.map((x) => x.name).join(", ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Length (only if provided) */}
      {lengths !== undefined && lengths !== null && setLengthSec && (
        <div className="border border-border bg-background rounded-lg p-3">
          <label className="text-sm text-foreground/80">
            {labels.lengthLabel ?? "طول ویدئو"}
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {lengths.map((s) => {
              const active = s === lengthSec;
              return (
                <button
                  key={s}
                  type="button"
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    active
                      ? "bg-accent/10 text-accent border border-accent/40"
                      : "border border-border hover:bg-black/10 dark:hover:bg-muted/60"
                  }`}
                  onClick={() => setLengthSec(s)}
                  disabled={disabled}
                >
                  {s} ثانیه
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Page-level submit button (placed at the end of the page) */}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || disabled}
          aria-label="ارسال"
          className={`px-3 py-1.5 rounded-md text-sm text-white flex items-center gap-2 ${
            canSubmit && !disabled
              ? "bg-accent hover:bg-accent/90"
              : "bg-accent/60 cursor-not-allowed"
          }`}
        >
          <PaperPlaneIcon className="h-4 w-4" />
          <span>{labels.submitButton}</span>
        </button>
      </div>
    </div>
  );
}
