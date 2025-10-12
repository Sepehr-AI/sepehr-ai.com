// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type {
  LanguageModelV2,
  LanguageModelV2CallOptions,
  LanguageModelV2CallWarning,
  LanguageModelV2StreamPart,
  ProviderV2,
} from "@ai-sdk/provider";
import {
  createJsonErrorResponseHandler,
  createJsonResponseHandler,
  loadApiKey,
  postJsonToApi,
  withoutTrailingSlash,
} from "@ai-sdk/provider-utils";
import { createParser } from "eventsource-parser";
import { z } from "zod";

// Keep existing logs parser, but export for reuse
function parseTokenUsageFromLogs(logs?: string): {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
} {
  if (!logs) return {};
  const patterns: Array<
    [RegExp, "inputTokens" | "outputTokens" | "totalTokens"]
  > = [
    [/Input token count:\s*(\d+)/i, "inputTokens"],
    [/Output token count:\s*(\d+)/i, "outputTokens"],
    [/Total token count:\s*(\d+)/i, "totalTokens"],

    // alternates some models emit
    [/Input tokens:\s*(\d+)/i, "inputTokens"],
    [/Output tokens:\s*(\d+)/i, "outputTokens"],
    [/Total tokens:\s*(\d+)/i, "totalTokens"],
    [/Prompt tokens:\s*(\d+)/i, "inputTokens"],
    [/Completion tokens:\s*(\d+)/i, "outputTokens"],
  ];

  const usage: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  } = {};
  for (const [re, key] of patterns) {
    const m = logs.match(re);
    if (m?.[1]) usage[key] = Number(m[1]);
  }
  return usage;
}

function mergeUsage(
  a: { inputTokens?: number; outputTokens?: number; totalTokens?: number },
  b: { inputTokens?: number; outputTokens?: number; totalTokens?: number },
) {
  const inputTokens = a.inputTokens ?? b.inputTokens;
  const outputTokens = a.outputTokens ?? b.outputTokens;
  let totalTokens = a.totalTokens ?? b.totalTokens;

  // If total not provided, compute when both parts known
  if (totalTokens == null && inputTokens != null && outputTokens != null) {
    totalTokens = inputTokens + outputTokens;
  }
  return { inputTokens, outputTokens, totalTokens };
}

// export type ReplicateModelId =
//     | `${string}/${string}`
//     | `${string}/${string}:${string}`;

export type ReplicateModelId = string;

export interface ReplicateModelSettings {
  promptName?: string;
  systemPromptName?: string;
  promptTransformer?: (options: {
    prompt: LanguageModelV2CallOptions["prompt"];
  }) => string;
  systemPromptTransformer?: (options: {
    prompt: LanguageModelV2CallOptions["prompt"];
  }) => string | undefined;
  extraInput?: Record<string, unknown>;
}

export interface ReplicateProviderSettings {
  apiToken?: string;
  baseURL?: string;
  headers?: Record<string, string>;
}

const errorSchema = z.object({
  detail: z.string(),
});

const predictionSchema = z.object({
  id: z.string(),
  model: z.string().optional(),
  version: z.string().optional(),
  input: z.unknown().optional(),
  output: z.union([z.string(), z.array(z.any()), z.null()]).optional(),
  status: z.string().optional(),
  urls: z
    .object({
      get: z.string().optional(),
      cancel: z.string().optional(),
      web: z.string().optional(),
      stream: z.string().optional(),
    })
    .optional(),
});

const predictionDetailsSchema = predictionSchema.extend({
  logs: z.string().optional(),
  metrics: z
    .object({
      input_token_count: z.number().optional(),
      output_token_count: z.number().optional(),
      total_token_count: z.number().optional(),
    })
    .optional(),
});

function parseModelId(ref: ReplicateModelId): {
  owner: string;
  name: string;
  version?: string;
} {
  const match = ref.match(
    /^(?<owner>[^/]+)\/(?<name>[^/:]+)(?::(?<version>.+))?$/,
  );
  if (!match || !match.groups) {
    throw new Error(
      `Invalid Replicate model id: ${ref}. Expected "owner/name" or "owner/name:version".`,
    );
  }
  const { owner, name, version } = match.groups as {
    owner: string;
    name: string;
    version?: string;
  };
  return { owner, name, version };
}

/**
 * Concatenate user+assistant text parts (skip tools and non-text).
 */
export function defaultTransformPrompt({
  prompt,
}: {
  prompt: LanguageModelV2CallOptions["prompt"];
}): string {
  const chunks: string[] = [];
  for (const msg of prompt ?? []) {
    if (msg.role === "tool") continue;
    if (msg.role === "user" || msg.role === "assistant") {
      for (const part of msg.content) {
        if (part.type === "text") chunks.push(part.text);
      }
    }
  }
  return chunks.join("");
}

/**
 * System text: handle both string content and text parts (defensive).
 */
export function defaultTransformSystemPrompt({
  prompt,
}: {
  prompt: LanguageModelV2CallOptions["prompt"];
}): string | undefined {
  const system: string[] = [];
  for (const msg of prompt ?? []) {
    if (msg.role !== "system") continue;

    const c = msg.content as any;
    if (typeof c === "string") {
      system.push(c);
      continue;
    }
    if (Array.isArray(c)) {
      for (const part of c) {
        if (part?.type === "text" && typeof part.text === "string") {
          system.push(part.text);
        }
      }
    }
  }
  return system.length ? system.join("") : undefined;
}

type PromptT = LanguageModelV2CallOptions["prompt"];

function extractTextFromContent(content: any): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((p) => p && p.type === "text" && typeof p.text === "string")
      .map((p) => p.text as string)
      .join("");
  }
  return "";
}

// Add near other helpers
function encodeBase64(bytes: Uint8Array): string {
  // Works in Node and edge runtimes
  if (typeof Buffer !== "undefined")
    return Buffer.from(bytes).toString("base64");
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }

  return btoa(binary);
}

function mimeFromExtension(ext?: string): string | undefined {
  switch (ext?.toLowerCase()) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    case "svg":
      return "image/svg+xml";
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "mp4":
      return "video/mp4";
    case "pdf":
      return "application/pdf";
    case "txt":
      return "text/plain";
    default:
      return undefined;
  }
}

function resolveMediaType(
  declared: string | undefined,
  filename?: string,
  headerContentType?: string | null,
): string {
  // Prefer explicit, non-wildcard declarations
  if (declared && !declared.endsWith("/*")) return declared;

  // Try filename extension
  const ext = filename?.split(".").pop();
  const byExt = mimeFromExtension(ext);
  if (byExt) return byExt;

  // Use server-provided header if available
  if (headerContentType) return headerContentType;

  // Fall back reasonably depending on declared wildcard
  if (declared?.startsWith("image/")) return "image/png";
  if (declared?.startsWith("audio/")) return "audio/mpeg";
  if (declared?.startsWith("video/")) return "video/mp4";

  return "application/octet-stream";
}

function asDataUrl(mediaType: string, base64: string): string {
  return `data:${mediaType};base64,${base64}`;
}

async function fetchAsBytes(
  url: string,
  abortSignal?: AbortSignal,
): Promise<{
  bytes: Uint8Array;
  contentType: string | null;
  contentLength: number | null;
}> {
  // Try HEAD first to bail out early on big files
  try {
    const head = await fetch(url, { method: "HEAD", signal: abortSignal });
    if (head.ok) {
      const len = head.headers.get("content-length");
      const type = head.headers.get("content-type");
      if (len) {
        const n = Number(len);
        if (Number.isFinite(n) && n > 262_144 /* 256 KiB */) {
          return {
            bytes: new Uint8Array(0),
            contentType: type,
            contentLength: n,
          };
        }
      }
    }
  } catch {
    // ignore HEAD errors, we’ll try GET
  }

  const res = await fetch(url, { signal: abortSignal });
  if (!res.ok) throw new Error(`Failed to fetch file: ${url}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  const type = res.headers.get("content-type");
  const lenHeader = res.headers.get("content-length");
  const len = lenHeader ? Number(lenHeader) : buf.byteLength;
  return {
    bytes: buf,
    contentType: type,
    contentLength: Number.isFinite(len) ? len : buf.byteLength,
  };
}

/**
 * Convert LanguageModelV2 file parts into data URLs (base64) when feasible.
 * - If `data` is Uint8Array: base64 encode directly.
 * - If `data` is a string:
 *   - data: URL -> keep as-is
 *   - raw base64 (no data: prefix) -> wrap into data URL
 *   - http(s) URL -> fetch; if >256KiB, return the URL (per Replicate guidance),
 *     otherwise base64-encode and return data URL.
 */
type FilePart = {
  type: "file";
  filename?: string;
  data: unknown;
  mediaType: string;
};

async function filePartToDataOrHttpUrl(
  part: FilePart,
  abortSignal?: AbortSignal,
): Promise<string> {
  // Already a data URL
  if (typeof part.data === "string" && part.data.startsWith("data:")) {
    return part.data;
  }

  // Raw bytes
  if (part.data instanceof Uint8Array) {
    const mt = resolveMediaType(part.mediaType, part.filename);
    return asDataUrl(mt, encodeBase64(part.data));
  }

  // String but not data URL
  if (typeof part.data === "string") {
    const str = part.data.trim();

    // Heuristic: looks like raw base64, not a URL
    const looksBase64 =
      /^[A-Za-z0-9+/=\n\r]+$/.test(str) && !/^https?:\/\//i.test(str);
    if (looksBase64) {
      const mt = resolveMediaType(part.mediaType, part.filename);
      return asDataUrl(mt, str.replace(/\s+/g, ""));
    }

    // Otherwise treat as URL
    if (/^https?:\/\//i.test(str)) {
      const { bytes, contentType, contentLength } = await fetchAsBytes(
        str,
        abortSignal,
      );

      // If large, prefer plain URL per docs
      if (contentLength != null && contentLength > 262_144 /* 256 KiB */) {
        return str;
      }

      const mt = resolveMediaType(part.mediaType, part.filename, contentType);
      return asDataUrl(mt, encodeBase64(bytes));
    }
  }

  // Unknown format: last resort, stringify and wrap
  const mt = resolveMediaType(part.mediaType, part.filename);
  const asStr = String(part.data ?? "");
  const looksData = asStr.startsWith("data:") ? asStr : asDataUrl(mt, asStr);
  return looksData;
}

/**
 * Extract all user `file` parts and return a list of data URLs (or URLs for large files).
 */
async function extractUserMediaDataUrls(
  prompt: PromptT,
  abortSignal?: AbortSignal,
): Promise<string[]> {
  const out: string[] = [];
  for (const msg of prompt ?? []) {
    if (msg.role !== "user") continue;
    const parts = Array.isArray(msg.content) ? msg.content : [];
    for (const p of parts) {
      if (p?.type === "file") {
        const urlOrData = await filePartToDataOrHttpUrl(
          p as FilePart,
          abortSignal,
        );
        out.push(urlOrData);
      }
    }
  }
  return out;
}

type ImageInputMode = "MULTI" | "SINGLE" | "UNAVAILABLE";

function buildTaggedPromptString(prompt: PromptT, systemText?: string): string {
  const chunks: string[] = [];
  if (systemText) chunks.push(`<system_prompt>${systemText}</system_prompt>`);
  for (const msg of prompt ?? []) {
    const text = extractTextFromContent((msg as any).content);
    if (!text) continue;
    if (msg.role === "user") {
      chunks.push(`<user_prompt>${text}</user_prompt>`);
    } else if (msg.role === "assistant") {
      chunks.push(`<assistant_response>${text}</assistant_response>`);
    }
    // tool messages and others are intentionally ignored
  }
  return chunks.join("\n");
}

function toChatMessagesArray(
  prompt: PromptT,
): Array<{ role: string; content: string }> {
  const arr: Array<{ role: string; content: string }> = [];
  for (const msg of prompt ?? []) {
    if (msg.role === "tool") continue;
    const content = extractTextFromContent((msg as any).content);
    if (!content) continue;
    // Roles expected by most chat models on Replicate: "system" | "user" | "assistant"
    arr.push({ role: msg.role, content });
  }
  return arr;
}

// Derive the correct result types from the interface (don’t import missing symbols)
type DoGenerateResult = Awaited<ReturnType<LanguageModelV2["doGenerate"]>>;
type DoStreamResult = Awaited<ReturnType<LanguageModelV2["doStream"]>>;

class ReplicateLanguageModel implements LanguageModelV2 {
  readonly specificationVersion = "v2" as const;
  readonly provider = "replicate";
  readonly modelId: ReplicateModelId;

  private readonly baseURL: string;
  private readonly apiKey: string;
  private readonly headers?: Record<string, string>;
  private readonly settings: ReplicateModelSettings;

  readonly supportedUrls: Record<string, RegExp[]> = {
    "image/*": [/^https:\/\/(?:.+\.)?replicate\.delivery\/.*/],
    "audio/*": [/^https:\/\/(?:.+\.)?replicate\.delivery\/.*/],
    "video/*": [/^https:\/\/(?:.+\.)?replicate\.delivery\/.*/],
    "*/*": [/^https:\/\/api\.replicate\.com\/.*/],
  };

  constructor(
    modelId: ReplicateModelId,
    config: {
      baseURL: string;
      apiKey: string;
      headers?: Record<string, string>;
    },
    settings: ReplicateModelSettings = {},
  ) {
    this.modelId = modelId;
    this.baseURL =
      withoutTrailingSlash(config.baseURL) ?? "https://api.replicate.com";
    this.apiKey = config.apiKey;
    this.headers = config.headers;
    this.settings = settings;
  }

  private makePredictionUrl(): { url: string; usesVersion: boolean } {
    const { owner, name, version } = parseModelId(this.modelId);
    if (version) {
      // Community or pinned version -> POST /v1/predictions with { version }
      return { url: `${this.baseURL}/v1/predictions`, usesVersion: true };
    }
    // Official model -> POST /v1/models/{owner}/{name}/predictions
    return {
      url: `${this.baseURL}/v1/models/${owner}/${name}/predictions`,
      usesVersion: false,
    };
  }

  // Make this async
  private async buildCreateBody(options: LanguageModelV2CallOptions) {
    const {
      promptName = "prompt",
      systemPromptName = "system_prompt",
      promptTransformer = defaultTransformPrompt,
      systemPromptTransformer = defaultTransformSystemPrompt,
      extraInput,
    } = this.settings;

    const providerModel = options.providerOptions?.model ?? {};
    const supportsMessages: boolean = !!providerModel.supportsMessages;
    const imageMode: ImageInputMode = providerModel.imageInput as any;

    const promptText = promptTransformer({ prompt: options.prompt });
    const systemText = systemPromptTransformer({ prompt: options.prompt });

    // New: gather user file parts as base64 data URLs (or URL if large)
    const fileDataUrls = await extractUserMediaDataUrls(
      options.prompt,
      options.abortSignal,
    );

    const { usesVersion } = this.makePredictionUrl();
    const body: Record<string, unknown> = { stream: true };
    const input: Record<string, unknown> = {
      ...(extraInput ?? {}),
    };

    if (supportsMessages) {
      input.messages = toChatMessagesArray(options.prompt);
    } else {
      const tagged = buildTaggedPromptString(options.prompt, systemText);
      if (promptName) input[promptName] = tagged;
    }

    // Image handling using the prepared data URLs
    if (fileDataUrls.length > 0) {
      if (imageMode === "MULTI") {
        (input as any).image_input = fileDataUrls;
      } else if (imageMode === "SINGLE") {
        (input as any).image = fileDataUrls[0];
      }
      // If UNAVAILABLE: ignore files.
    }

    if (!supportsMessages && !input[promptName] && (promptText || systemText)) {
      if (promptName && promptText) input[promptName] = promptText;
      if (systemPromptName && systemText) input[systemPromptName] = systemText;
    }

    body.input = input;

    if (usesVersion) {
      const { version } = parseModelId(this.modelId);
      (body as any).version = version;
    }

    return body;
  }

  private async fetchUsageFromPrediction(
    predictionId: string,
    abortSignal?: AbortSignal,
  ): Promise<{
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  }> {
    const url = `${this.baseURL}/v1/predictions/${predictionId}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...(this.headers ?? {}),
      },
      signal: abortSignal,
    });

    if (!res.ok) return {};

    // Validate/parse
    let details: z.infer<typeof predictionDetailsSchema>;
    try {
      const json = await res.json();
      details = predictionDetailsSchema.parse(json);
    } catch {
      // If parsing fails, don’t break the request—just return empty usage
      return {};
    }

    // 1) From logs
    const fromLogs = parseTokenUsageFromLogs(details.logs);

    // 2) From metrics
    const m = details.metrics ?? {};
    const fromMetrics = {
      inputTokens: m.input_token_count,
      outputTokens: m.output_token_count,
      totalTokens: m.total_token_count,
    };

    // Merge with metrics taking precedence where present
    return mergeUsage(fromMetrics, fromLogs);
  }

  private async createPrediction(options: LanguageModelV2CallOptions) {
    const { url } = this.makePredictionUrl();

    const { value: prediction } = await postJsonToApi<
      z.infer<typeof predictionSchema>
    >({
      url,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...(this.headers ?? {}),
      },
      body: await this.buildCreateBody(options), // <-- await
      successfulResponseHandler: createJsonResponseHandler(predictionSchema),
      failedResponseHandler: createJsonErrorResponseHandler<
        z.infer<typeof errorSchema>
      >({
        errorSchema,
        errorToMessage: (err) => err.detail,
      }),
    });

    if (!prediction.urls?.stream) {
      throw new Error(
        "Replicate response did not include urls.stream. Ensure the model supports streaming.",
      );
    }

    return prediction;
  }

  async doStream(options: LanguageModelV2CallOptions): Promise<DoStreamResult> {
    const prediction = await this.createPrediction(options);

    const res = await fetch(prediction.urls!.stream!, {
      headers: { Accept: "text/event-stream" },
      signal: options.abortSignal,
    });
    if (!res.body) throw new Error("Missing SSE response body from Replicate");

    const transformer = new TransformStream<
      Uint8Array,
      LanguageModelV2StreamPart
    >({
      start(controller) {
        controller.enqueue({
          type: "stream-start",
          warnings: [] as LanguageModelV2CallWarning[],
        });
        controller.enqueue({
          type: "response-metadata",
          id: prediction.id,
          modelId: (options as any).modelId ?? "",
          timestamp: new Date(),
        });
      },

      transform: (() => {
        let textStarted = false;
        const textBlockId = "t0";
        let controllerRef: TransformStreamDefaultController<LanguageModelV2StreamPart> | null =
          null;

        const parser = createParser({
          onEvent: (evt) => {
            if (!controllerRef) return;

            const { event, data } = evt;

            if (event === "output") {
              if (!textStarted) {
                textStarted = true;
                controllerRef.enqueue({ type: "text-start", id: textBlockId });
              }
              controllerRef.enqueue({
                type: "text-delta",
                id: textBlockId,
                delta: data ?? "",
              });
              return;
            }

            if (event === "error") {
              try {
                const parsed = data
                  ? JSON.parse(data)
                  : { detail: "Unknown error" };
                controllerRef.enqueue({ type: "error", error: parsed });
              } catch {
                controllerRef.enqueue({
                  type: "error",
                  error: data ?? "Unknown error",
                });
              }
              return;
            }

            if (event === "done") {
              if (textStarted)
                controllerRef.enqueue({ type: "text-end", id: textBlockId });

              let finishReason: DoGenerateResult["finishReason"] = "stop";
              try {
                const payload = data ? JSON.parse(data) : {};
                if (payload?.reason === "canceled") finishReason = "other";
                if (payload?.reason === "error") finishReason = "error";
              } catch {
                /* ignore */
              }

              // Fetch final usage (metrics or logs), then finish
              this.fetchUsageFromPrediction(prediction.id, options.abortSignal)
                .then((usage) => {
                  controllerRef!.enqueue({
                    type: "finish",
                    finishReason,
                    usage: {
                      inputTokens: usage.inputTokens,
                      outputTokens: usage.outputTokens,
                      totalTokens: usage.totalTokens,
                    },
                  });
                })
                .catch(() => {
                  controllerRef!.enqueue({
                    type: "finish",
                    finishReason,
                    usage: {
                      inputTokens: undefined,
                      outputTokens: undefined,
                      totalTokens: undefined,
                    },
                  });
                })
                .finally(() => {
                  controllerRef!.terminate?.();
                });
            }
          },
        });

        return (
          chunk: Uint8Array,
          controller: TransformStreamDefaultController<LanguageModelV2StreamPart>,
        ) => {
          controllerRef = controller;
          const str = new TextDecoder().decode(chunk);
          parser.feed(str);
        };
      })(),
    });

    const stream = res.body.pipeThrough(transformer);

    return {
      stream,
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: this.settings as Record<string, unknown>,
      },
    } as DoStreamResult;
  }

  async doGenerate(
    options: LanguageModelV2CallOptions,
  ): Promise<DoGenerateResult> {
    const { stream } = await this.doStream(options);

    let text = "";
    let finishReason: DoGenerateResult["finishReason"] = "unknown";
    let usage: DoGenerateResult["usage"] = {
      inputTokens: undefined,
      outputTokens: undefined,
      totalTokens: undefined,
    };

    for await (const part of stream as unknown as AsyncIterable<LanguageModelV2StreamPart>) {
      switch (part.type) {
        case "text-delta":
          text += part.delta;
          break;
        case "finish":
          finishReason = part.finishReason;
          if (part.usage) {
            usage = {
              inputTokens: part.usage.inputTokens,
              outputTokens: part.usage.outputTokens,
              totalTokens: part.usage.totalTokens,
            };
          }
          break;
        case "error": {
          const message =
            typeof part.error === "string"
              ? part.error
              : (((part.error as { detail?: string })?.detail as string) ??
                "Unknown error");
          throw new Error(message);
        }
      }
    }

    return {
      warnings: [],
      content: text ? [{ type: "text", text }] : [],
      finishReason: finishReason ?? "stop",
      usage,
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: this.settings as Record<string, unknown>,
      },
    } as DoGenerateResult;
  }
}

export type ReplicateProvider = ProviderV2 & {
  (
    modelId: ReplicateModelId,
    settings?: ReplicateModelSettings,
  ): LanguageModelV2;
  languageModel: (
    modelId: ReplicateModelId,
    settings?: ReplicateModelSettings,
  ) => LanguageModelV2;
};

export function createReplicate(
  providerSettings: ReplicateProviderSettings = {},
): ReplicateProvider {
  const apiKey = loadApiKey({
    apiKey: providerSettings.apiToken,
    // provider-utils expects environmentVariableName
    environmentVariableName: "REPLICATE_API_TOKEN",
    description: "Replicate API token",
  });

  const baseURL = withoutTrailingSlash(
    providerSettings.baseURL ?? "https://api.replicate.com",
  )!;

  const factory = (
    modelId: ReplicateModelId,
    settings?: ReplicateModelSettings,
  ): LanguageModelV2 =>
    new ReplicateLanguageModel(
      modelId,
      { apiKey, baseURL, headers: providerSettings.headers },
      settings,
    );

  const provider: ReplicateProvider = Object.assign(
    factory as ReplicateProvider,
    {
      languageModel: factory,
      textEmbeddingModel: () => {
        throw new Error(
          "Replicate provider: textEmbeddingModel is not implemented.",
        );
      },
      imageModel: () => {
        throw new Error("Replicate provider: imageModel is not implemented.");
      },
    },
  );

  return provider;
}

// Convenient default instance using process.env.REPLICATE_API_TOKEN
export const replicate = createReplicate();
