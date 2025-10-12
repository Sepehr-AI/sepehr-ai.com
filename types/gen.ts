export type ImageInputKind = "UNAVAILABLE" | "SINGLE" | "MULTI";

export type BaseGenModelDto = {
  code: string;
  name: string;
  description: string;
  companyWebsite?: string;
  ratios: string[];
  durations?: number[];
  creditCostLabel: string;
  creditCostValue: number;
  defaultOptions?: Record<string, unknown> | null;
};

// For video: dynamic upload fields shown in the UI
export type MediaInputSpec = {
  id:
    | "image"
    | "start_image"
    | "end_image"
    | "first_frame_image"
    | "last_frame_image"
    | "reference_images"
    | "audio";
  label: string; // Farsi label for UI
  accept: string; // "image/*" | "audio/*"
  multiple?: boolean; // only true for reference_images
};

export type MediaFilesState = Record<string, File[]>;
