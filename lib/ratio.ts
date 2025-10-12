import { Ratio as RatioObj } from "@/prisma/client";

type RatioKey = keyof typeof RatioObj;

/**
 * Convert an enum key -> human label (uses the generated object, no string operations).
 * Example: ratioEnumKeyToLabel("RATIO_16_9") -> "16:9"
 */
export const ratioEnumKeyToLabel = (key: RatioKey): string => {
  return key.replace("RATIO_", "").replace("_", ":") as string;
};

/**
 * Convert a label -> enum key (reverse lookup). Returns undefined if not found.
 * Example: ratioLabelToEnumKey("16:9") -> "RATIO_16_9"
 */
export const ratioLabelToEnumKey = (label: string): RatioKey | undefined => {
  return `RATIO_${label.replace(":", "_")}` as RatioKey;
};
