export type BaseModel = {
  id: string;
  description: string;
  possibleRatios: string[] | null;
  acceptsImage: boolean;
  defaultOptions?: Record<string, string | number | boolean | null>;
};

export type VideoModel = BaseModel & {
  defaultLength?: number;
  possibleLengths: number[] | null;
};
