import type { ImageModelPricingDto } from "./imageModels";

// Shared sizing helpers
export function parseSize(
    ratio: string | null | undefined
): { w: number; h: number } {
    const base = 1024;
    const map: Record<string, [number, number]> = {
        "1:1": [base, base],
        "3:2": [Math.round((3 / 2) * base), base],
        "2:3": [base, Math.round((3 / 2) * base)],
        "4:3": [Math.round((4 / 3) * base), base],
        "3:4": [base, Math.round((4 / 3) * base)],
        "16:9": [Math.round((16 / 9) * base), base],
        "9:16": [base, Math.round((16 / 9) * base)],
    };
    if (ratio && map[ratio]) {
        const [w, h] = map[ratio];
        return { w, h };
    }
    return { w: base, h: base };
}

export function roundToMultiple(n: number, m = 16) {
    return Math.max(m, Math.round(n / m) * m);
}

// Decide which Replicate endpoint to hit and how to format the body
export function resolveReplicateEndpoint(modelId: string, input: Record<string, unknown>) {
    const ownerName = modelId.match(/^([^/]+)\/([^:]+)$/);
    const isVersionHash = /^[a-f0-9]{64}$/i.test(modelId);
    const hasOwnerNameVersion = modelId.includes(":");
    const useModelsEndpoint = !!ownerName && !hasOwnerNameVersion && !isVersionHash;

    if (useModelsEndpoint) {
        const url = `https://api.replicate.com/v1/models/${ownerName![1]}/${ownerName![2]}/predictions`;
        return { url, body: JSON.stringify({ input }) };
    }
    // Otherwise use unified predictions with "version"
    const url = "https://api.replicate.com/v1/predictions";
    return { url, body: JSON.stringify({ version: modelId, input }) };
}

// Build the input for Replicate from a model spec and generic args
export function buildReplicateImageInput(
    spec: ImageModelPricingDto,
    args: {
        prompt: string;
        ratio?: string | null;
        width?: number;
        height?: number;
        imageDataUrl?: string;
        userOptions?: Record<string, unknown>;
    },
) {
    // Merge order: defaults -> fixed fields -> size -> userOptions (cannot override prompt/num_outputs/image)
    const input: Record<string, unknown> = {
        ...((spec.defaultOptions as object) ?? {}),
        prompt: args.prompt,
        num_outputs: 1,
    };

    if (args.imageDataUrl) {
        input.image = args.imageDataUrl;
    }

    // For models that ignore aspect_ratio when image is present, sending it is harmless but we can omit
    if (args.ratio && !args.imageDataUrl) {
        input.aspect_ratio = args.ratio;
    }

    if (args.userOptions && typeof args.userOptions === "object") {
        for (const [k, v] of Object.entries(args.userOptions)) {
            if (k === "prompt" || k === "num_outputs" || k === "image") continue;
            input[k] = v;
        }
    }

    return input;
}

export function buildReplicateVideoInput(
    spec: { defaultOptions?: Record<string, unknown>; startImage?: boolean },
    args: {
        prompt: string;
        ratio?: string | null;
        width?: number;
        height?: number;
        imageDataUrl?: string;
        userOptions?: Record<string, unknown>;
        lengthSec?: number | null;
    }
) {
    const input: Record<string, unknown> = {
        prompt: args.prompt,
        ...(spec.defaultOptions || {}),
    };

    // Aspect ratio or explicit size
    if (args.ratio && args.ratio !== "X:Y") {
        // many Replicate video models accept "aspect_ratio"
        input.aspect_ratio = args.ratio;
    }
    if (args.width && args.height) {
        input.width = args.width;
        input.height = args.height;
    }

    // Duration in seconds (most video models accept one of: duration | seconds | num_frames)
    if (typeof args.lengthSec === "number") {
        input.duration = args.lengthSec;
    }

    // Optional single reference/start image
    if (args.imageDataUrl && spec.startImage) {
        // common key name is "image", sometimes "start_image"
        input.image = args.imageDataUrl;
    }

    if (args.userOptions) Object.assign(input, args.userOptions);
    return input;
}