import z from "zod";

// In megabytes
const DEFAULT_IMAGE_MAX_FILE_SIZE: number = 10;
const DEFAULT_AUDIO_MAX_FILE_SIZE: number = 20;
const DEFAULT_VIDEO_MAX_FILE_SIZE: number = 50;

const fileFormatSchema = z.union([
  z.literal("mkv"),
  z.literal("mp4"),
  z.literal("mov"),
  z.literal("mp3"),
  z.literal("m4a"),
  z.literal("aac"),
  z.literal("wav"),
  z.literal("jpg"),
  z.literal("png"),
  z.literal("jpeg"),
  z.literal("webp"),
]);
export type ModelInputFileFormat = z.infer<typeof fileFormatSchema>;

const DEFAULT_ACCEPTED_IMAGE_FORMATS: ModelInputFileFormat[] = [
  "png",
  "jpg",
  "jpeg",
  "webp",
];

const ratioSchema = z.union([
  z.literal("match_input_image"),
  z.literal("1:1"),
  z.literal("16:9"),
  z.literal("9:16"),
  z.literal("4:3"),
  z.literal("3:4"),
  z.literal("2:1"),
  z.literal("1:2"),
  z.literal("21:9"),
  z.literal("9:21"),
  z.literal("3:2"),
  z.literal("2:3"),
  z.literal("5:4"),
  z.literal("4:5"),
]);
export type ModelInputRatio = z.infer<typeof ratioSchema>;

const stringSelectionOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});
export type ModelInputStringSelectionOption = z.infer<
  typeof stringSelectionOptionSchema
>;

const numericSelectionOptionSchema = z.object({
  label: z.string(),
  value: z.number(),
});
export type ModelInputNumericSelectionOption = z.infer<
  typeof numericSelectionOptionSchema
>;

const modelInputCommonSchema = z.object({
  label: z.string(),
  inputKey: z.string(),
  description: z.string().optional(),
  optional: z.boolean().default(false),
  advancedSetting: z.boolean().default(false),
});

export const modelInputSchema = z.array(
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("text"),
      ...modelInputCommonSchema.shape,
      placeholder: z.string().optional(),
    }),
    z.object({
      type: z.literal("ratio"),
      options: z.array(ratioSchema),
      ...modelInputCommonSchema.shape,
    }),
    z.object({
      type: z.literal("audio"),
      ...modelInputCommonSchema.shape,
      acceptedFormats: z.array(fileFormatSchema),
      maxFileSize: z.number().default(DEFAULT_AUDIO_MAX_FILE_SIZE),
    }),
    z.object({
      type: z.literal("float"),
      max: z.number().optional(),
      mix: z.number().optional(),
      defaultValue: z.number().optional(),
      decimalAccuracy: z.number().default(2),
      ...modelInputCommonSchema.shape,
    }),
    z.object({
      type: z.literal("integer"),
      max: z.number().optional(),
      mix: z.number().optional(),
      defaultValue: z.number().optional(),
      ...modelInputCommonSchema.shape,
    }),
    z.object({
      type: z.literal("video"),
      ...modelInputCommonSchema.shape,
      acceptedFormats: z.array(fileFormatSchema),
      shouldBeUploadedOnProvider: z.boolean().default(false),
      maxFileSize: z.number().default(DEFAULT_VIDEO_MAX_FILE_SIZE),
    }),
    z.object({
      type: z.literal("videos"),
      maxCount: z.number(),
      ...modelInputCommonSchema.shape,
      acceptedFormats: z.array(fileFormatSchema),
      shouldBeUploadedOnProvider: z.boolean().default(false),
      maxFileSize: z.number().default(DEFAULT_VIDEO_MAX_FILE_SIZE),
    }),
    z.object({
      type: z.literal("image"),
      ...modelInputCommonSchema.shape,
      maxFileSize: z.number().default(DEFAULT_IMAGE_MAX_FILE_SIZE),
      acceptedFormats: z
        .array(fileFormatSchema)
        .default(DEFAULT_ACCEPTED_IMAGE_FORMATS),
    }),
    z.object({
      type: z.literal("images"),
      maxCount: z.number(),
      ...modelInputCommonSchema.shape,
      maxFileSize: z.number().default(DEFAULT_IMAGE_MAX_FILE_SIZE),
      acceptedFormats: z
        .array(fileFormatSchema)
        .default(DEFAULT_ACCEPTED_IMAGE_FORMATS),
    }),
    z.object({
      type: z.literal("boolean"),
      ...modelInputCommonSchema.shape,
      defaultValue: z.boolean().optional(),
    }),
    z.discriminatedUnion("valuesAreNumeric", [
      z.object({
        type: z.literal("selection"),
        ...modelInputCommonSchema.shape,
        valuesAreNumeric: z.literal(false),
        defaultValue: z.string().optional(),
        options: z.array(stringSelectionOptionSchema),
      }),
      z.object({
        type: z.literal("selection"),
        ...modelInputCommonSchema.shape,
        valuesAreNumeric: z.literal(true),
        defaultValue: z.number().optional(),
        options: z.array(numericSelectionOptionSchema),
      }),
    ]),
  ]),
);
export type ModelInput = z.infer<typeof modelInputSchema>;
