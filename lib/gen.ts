// types/models.ts

export type BaseModel = {
    id: string;
    description: string;
    possibleRatios: string[] | null;
    acceptsImage: boolean;
    defaultOptions?: Record<string, string | number | boolean | null>; // forwarded as-is
};

export type VideoModel = BaseModel & {
    possibleLengths: number[] | null; // seconds
    defaultLength?: number;
};

// export type ImageModel = BaseModel;

export type LongVideoModel = BaseModel & {
    // per-scenario clip length (seconds)
    clipSeconds: number;
    defaultScenes?: number; // default number of scenarios
};

export type JobStatus =
    | "idle"
    | "submitting"
    | "queued"
    | "processing"
    | "succeeded"
    | "failed"
    | "canceled";

// Script generation types for the long-video wizard
export type ScenarioScript = {
    id: number;
    title: string;
    imagePrompt: string;
    narrative: string;
};

export type ScriptResult = {
    scenarios: ScenarioScript[];
    overallNarration?: string;
};