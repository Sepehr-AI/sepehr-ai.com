/* eslint-disable @typescript-eslint/no-explicit-any */
import z from "zod";

import { modelInputSchema } from "./modelInput";

// Validations for scalar values coming from form fields
export const numberFromString = z
  .string()
  .transform((v) => Number(v))
  .refine((v) => !Number.isNaN(v), "Invalid number");

export function isAcceptedExt(name: string, accepted: string[]) {
  const ext = (name.split(".").pop() || "").toLowerCase();
  return accepted.includes(ext);
}

export type ParsedField =
  | { key: string; value: string | number | boolean }
  | { key: string; value: string[] }
  | { key: string; file?: File; files?: File[] };

export type BuiltInput = {
  // payload to send to Replicate (includes base64 data URLs for files)
  replicateInput: Record<string, unknown>;
  // raw values for client-side UX if needed
  raw: Record<string, unknown>;
};

// File -> dataURL (works in Node and Browser)
export async function fileToDataUrl(f: File) {
  const arrayBuf = await f.arrayBuffer();
  let base64: string;

  // Use Node's Buffer if available; otherwise fall back to browser btoa
  const B = (globalThis as any).Buffer;
  if (B && typeof B.from === "function") {
    base64 = B.from(arrayBuf).toString("base64");
  } else {
    let binary = "";
    const bytes = new Uint8Array(arrayBuf);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    base64 = btoa(binary);
  }

  const mime = f.type || "application/octet-stream";
  return `data:${mime};base64,${base64}`;
}

export type BuildInputOptions = {
  // When true, run all validations but skip turning files into base64 data URLs.
  // Useful for frontend validation to avoid heavy work.
  skipFileEncoding?: boolean;
};

// Transform FormData into payload using the model's inputSchema
// Now supports { skipFileEncoding } to reuse validation logic on the client.
export async function buildInputFromFormData(
  fd: FormData,
  inputDef: z.infer<typeof modelInputSchema>,
  options?: BuildInputOptions,
) {
  const skipFileEncoding = options?.skipFileEncoding ?? false;

  const input: Record<string, unknown> = {};
  const raw: Record<string, unknown> = {};

  for (const def of inputDef) {
    const key = def.inputKey;

    switch (def.type) {
      case "text": {
        const v = String(fd.get(key) ?? "");
        if (!def.optional && !v.trim()) {
          throw new Error(`"${def.label}" الزامی است.`);
        }
        if (v) {
          input[key] = v;
          raw[key] = v;
        }
        break;
      }

      case "ratio": {
        const v = String(fd.get(key) ?? "");
        if (!def.optional && !v) throw new Error(`"${def.label}" الزامی است.`);
        if (v) {
          if (!def.options.includes(v as any))
            throw new Error(`نسبت تصویر "${v}" معتبر نیست.`);
          input[key] = v;
          raw[key] = v;
        }
        break;
      }

      case "boolean": {
        const vRaw = fd.get(key);
        const v =
          typeof vRaw === "string"
            ? vRaw === "true" || vRaw === "on" || vRaw === "1"
            : false;
        if (!def.optional || vRaw !== null) {
          input[key] = v;
          raw[key] = v;
        }
        break;
      }

      case "selection": {
        const v = String(fd.get(key) ?? "");
        if (!def.optional && !v) throw new Error(`"${def.label}" الزامی است.`);
        if (v) {
          const allowed = def.options.map((o) => String(o.value));
          if (!allowed.includes(v))
            throw new Error(`گزینه "${v}" برای "${def.label}" معتبر نیست.`);

          if (def.valuesAreNumeric) {
            const num = Number(v);
            input[key] = num;
            raw[key] = num;
          } else {
            input[key] = v;
            raw[key] = v;
          }
        }
        break;
      }

      case "float": {
        const vRaw = fd.get(key);
        if (vRaw === null) {
          if (!def.optional) throw new Error(`"${def.label}" الزامی است.`);
          break;
        }
        const num = Number(vRaw);
        if (Number.isNaN(num)) throw new Error(`"${def.label}" عددی نیست.`);
        // support both min/mix (seed may contain mix)
        const min = (def as any).min ?? (def as any).mix;
        if (typeof min === "number" && num < min)
          throw new Error(`"${def.label}" نباید کمتر از ${min} باشد.`);
        if (typeof def.max === "number" && num > def.max)
          throw new Error(`"${def.label}" نباید بیشتر از ${def.max} باشد.`);
        input[key] = num;
        raw[key] = num;
        break;
      }

      case "integer": {
        const vRaw = fd.get(key);
        if (vRaw === null) {
          if (!def.optional) throw new Error(`"${def.label}" الزامی است.`);
          break;
        }
        const num = Number(vRaw);
        if (!Number.isInteger(num))
          throw new Error(`"${def.label}" باید عدد صحیح باشد.`);
        const min = (def as any).min ?? (def as any).mix;
        if (typeof min === "number" && num < min)
          throw new Error(`"${def.label}" نباید کمتر از ${min} باشد.`);
        if (typeof def.max === "number" && num > def.max)
          throw new Error(`"${def.label}" نباید بیشتر از ${def.max} باشد.`);
        input[key] = num;
        raw[key] = num;
        break;
      }

      case "audio":
      case "video":
      case "image": {
        const part = fd.get(key);
        if (!(part instanceof File)) {
          if (!def.optional) throw new Error(`"${def.label}" الزامی است.`);
          break;
        }
        const file = part as File;
        const maxMB = (def as any).maxFileSize ?? 10;
        if (file.size > maxMB * 1024 * 1024)
          throw new Error(`"${def.label}" نباید بیشتر از ${maxMB}MB باشد.`);
        const formats = def.acceptedFormats;
        if (formats?.length && !isAcceptedExt(file.name, formats))
          throw new Error(
            `"${def.label}" باید یکی از فرمت‌های ${formats.join(", ")} باشد.`,
          );

        if (!skipFileEncoding) {
          const dataUrl = await fileToDataUrl(file);
          input[key] = dataUrl;
        }
        raw[key] = { name: file.name, size: file.size };
        break;
      }

      case "videos":
      case "images": {
        const parts = fd
          .getAll(key)
          .filter((x): x is File => x instanceof File);
        if (!parts.length) {
          if (!def.optional) throw new Error(`"${def.label}" الزامی است.`);
          break;
        }
        const maxMB = (def as any).maxFileSize ?? 10;
        const formats = def.acceptedFormats;
        if (typeof def.maxCount === "number" && parts.length > def.maxCount) {
          throw new Error(
            `"${def.label}" حداکثر ${def.maxCount} فایل می‌پذیرد.`,
          );
        }
        for (const f of parts) {
          if (f.size > maxMB * 1024 * 1024)
            throw new Error(
              `هر فایل در "${def.label}" نباید بیشتر از ${maxMB}MB باشد.`,
            );
          if (formats?.length && !isAcceptedExt(f.name, formats))
            throw new Error(
              `"${def.label}" فقط فرمت‌های ${formats.join(", ")} را می‌پذیرد.`,
            );
        }

        if (!skipFileEncoding) {
          const urls = await Promise.all(parts.map(fileToDataUrl));
          input[key] = urls;
        }
        raw[key] = parts.map((f) => ({ name: f.name, size: f.size }));
        break;
      }

      default:
        // Exhaustiveness guard
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _never: never = def;
        throw new Error("Unsupported input type in schema.");
    }
  }

  return { replicateInput: input, raw };
}
