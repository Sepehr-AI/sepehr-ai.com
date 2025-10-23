/* eslint-disable @typescript-eslint/no-explicit-any */
import { companyToWebsiteMap } from "@/lib/aiCompaniesForBackend";
import { modelInputSchema } from "@/lib/modelInput";
import prisma from "@/lib/prisma";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { existsSync } from "fs";
import fs from "fs/promises";
import fsp from "fs/promises";
import path from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import type { ImageInput } from "./client";
import _faqSeed from "./seed-data/Faq.json";
import _imageModelSeed from "./seed-data/ImageModel.json";
import _languageModelSeed from "./seed-data/LanguageModel.json";
import _userSeed from "./seed-data/User.json";
import _videoModelSeed from "./seed-data/VideoModel.json";
import _webPlanSeed from "./seed-data/WebPlan.json";

const insertIdFromIndex = <T>(seed: T[]): (T & { id: number })[] =>
  seed.map((e, idx) => ({ ...e, id: idx + 1 }));

const faqSeed = insertIdFromIndex(_faqSeed);
const userSeed = insertIdFromIndex(_userSeed);
const webPlanSeed = insertIdFromIndex(_webPlanSeed);
const imageModelSeed = insertIdFromIndex(_imageModelSeed);
const videoModelSeed = insertIdFromIndex(_videoModelSeed);
const languageModelSeed = insertIdFromIndex(_languageModelSeed);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

const farsiDescriptionSchema = z.string().refine(
  (value) => {
    const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
    return wordCount >= 50 && wordCount <= 100;
  },
  { message: "Farsi description must be between 50 and 100 words." },
);

const DESC_JSON_FILE = path.resolve(
  __dirname,
  "./seed-data/AiModelDescription.json",
);
const SHORT_DESC_JSON_FILE = path.resolve(
  __dirname,
  "./seed-data/AiModelShortDescription.json",
);

async function loadDescriptions(): Promise<Record<string, string>> {
  if (!existsSync(DESC_JSON_FILE)) {
    await fs.writeFile(DESC_JSON_FILE, JSON.stringify({}));
    return {};
  }
  const fileContent = await fs.readFile(DESC_JSON_FILE, "utf8");
  try {
    return JSON.parse(fileContent);
  } catch (e) {
    console.error("Failed to parse descriptions file.", e);
    return {};
  }
}
async function loadShortDescriptions(): Promise<Record<string, string>> {
  if (!existsSync(SHORT_DESC_JSON_FILE)) {
    await fs.writeFile(SHORT_DESC_JSON_FILE, JSON.stringify({}));
    return {};
  }
  try {
    return JSON.parse(await fs.readFile(SHORT_DESC_JSON_FILE, "utf8"));
  } catch (e) {
    console.error("Failed to parse short-descriptions file.", e);
    return {};
  }
}

async function saveDescriptions(
  descriptions: Record<string, string>,
): Promise<void> {
  await fs.writeFile(DESC_JSON_FILE, JSON.stringify(descriptions, null, 2));
}
async function saveShortDescriptions(
  shortDescriptions: Record<string, string>,
): Promise<void> {
  await fs.writeFile(
    SHORT_DESC_JSON_FILE,
    JSON.stringify(shortDescriptions, null, 2),
  );
}

async function fetchFarsiDescription(modelName: string): Promise<string> {
  const prompt = `Generate a Farsi description for an AI model named "${modelName}". The description should be approximately 75 words long with no links nor any kind of online resources included in it. Return only the Farsi description without any greetings, explanations, or additional characters. Do not include any markdown formatting; output everything as raw text. Search the web for finding information about the AI model to generate the description. The description should be in simple terms and understandable for the average person. Don't include words like 'API' or 'web service' or similar technical terms. Do not mention where and how this model can be utilized.`;

  const maxRetries = 10;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const resp = await generateText({
        prompt,
        model: openrouter("openai/gpt-5:online", {
          reasoning: {
            exclude: true,
            effort: "low",
          },
        }),
      });

      const parsRes = await farsiDescriptionSchema.safeParseAsync(resp.text);
      if (!parsRes.success) {
        console.log("Invalid output by AI. Retrying...", { resp });
        await new Promise((res) => setTimeout(res, 500));
        continue;
      }

      return resp.text;
    } catch (error) {
      console.error(`Attempt ${attempt} for model ${modelName} failed:`, error);
      if (attempt === maxRetries) {
        throw error;
      }

      await new Promise((res) => setTimeout(res, 500));
    }
  }

  console.warn({ prompt });
  throw new Error("Failed to fetch Farsi description after retries.");
}

function toModelNameFromCode(code: string): string {
  return [...new Set(code.replace("/", " ").replaceAll("-", " ").split(" "))]
    .map((n) => capitalizeFirstLetter(n))
    .join(" ");
}
function isValidSevenSimpleWords(s: string): boolean {
  // Allow commas and the Persian '،' plus the conjunction 'و' as-is.
  // Keep it simple: exactly 7 whitespace-separated tokens.
  const words = s.trim().split(/\s+/).filter(Boolean);
  return words.length === 7;
}

/**
 * Ask AI once to produce a 7-word Persian short sentence per model code.
 * Enforces:
 * - exactly 7 words
 * - no word repetition within a sentence
 * - each sentence unique across models
 * - simple, non‑technical vocabulary
 */
async function generateShortDescriptionsAllAtOnce(
  descriptionsMap: Record<string, string>,
): Promise<Record<string, string>> {
  const codes = Object.keys(descriptionsMap);

  const system =
    "You write ultra‑concise, friendly Persian (Farsi) taglines for everyday users. Output must be Farsi. Keep vocabulary simple and non‑technical; do not mention APIs, GPUs, infrastructure, tokens, parameters, or model jargon. You may use commas and the Persian conjunction 'و' where they read naturally; otherwise avoid other punctuation.";

  const prompt =
    "You will receive one JSON object whose keys are model codes and values are their full Farsi descriptions. " +
    "For each code, produce exactly one 7‑word Farsi sentence that summarizes the model for non‑technical users. " +
    "Requirements: 1) exactly 7 words; 2) simple everyday language; 3) avoid technical terms; " +
    "4) keep sentences distinct across models; 5) return ONLY a pure JSON object mapping the same keys to their 7‑word sentences, with no extra text.\n\n" +
    "INPUT JSON (model_code -> farsi_description):\n" +
    JSON.stringify(descriptionsMap, null, 2);

  // Retry a few times if validation fails
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { text } = await generateText({
      model: openrouter("openai/gpt-5", {
        reasoning: { exclude: true, effort: "high" },
      }),
      system,
      prompt,
      temperature: 0.2,
    });

    let result: Record<string, string>;
    try {
      result = JSON.parse(text);
    } catch {
      console.warn("Short-description: non-JSON response, retrying...");
      continue;
    }

    const missing = codes.filter((c) => typeof result[c] !== "string");
    if (missing.length) {
      console.warn("Short-description missing keys:", missing);
      continue;
    }

    const sentences = codes.map((c) => result[c].trim());

    // Keep validation simple: just ensure 7 tokens by whitespace.
    const invalid = sentences.filter((s) => !isValidSevenSimpleWords(s));
    if (invalid.length) {
      console.warn("Invalid 7-word sentences found, retrying...", invalid);
      continue;
    }

    // Simple duplicate check (exact-string comparison only).
    const uniqueSentences = new Set(sentences);
    if (uniqueSentences.size !== sentences.length) {
      console.warn("Duplicate sentences detected, retrying...");
      continue;
    }

    return codes.reduce<Record<string, string>>((acc, c) => {
      acc[c] = result[c].trim();
      return acc;
    }, {});
  }

  throw new Error("Failed to generate valid short descriptions after retries.");
}

// Helper to upsert any model with the same data for update & create.
function upsertWithSameData<Model extends { upsert(args: any): Promise<any> }>(
  model: Model,
  where: object,
  data: object,
) {
  return model.upsert({
    where,
    update: data,
    create: data,
  });
}

async function doesShowCaseFileExist(filename: string, subDir: string | null) {
  try {
    return (
      await fsp.stat(
        path.resolve(
          __dirname,
          `../public/model-showcase/${subDir ? subDir + "/" : ""}${filename}`,
        ),
      )
    ).isFile();
  } catch {
    return false;
  }
}

// Shared seeding loop for models that need Farsi descriptions
function buildSeedTasks(
  seed: Array<
    { id: number; code: string; imageInput: ImageInput } & Record<string, any>
  >,
  prismaModel: { upsert(args: any): Promise<any> },
  descriptionsMap: Record<string, string>,
  shortDescriptionsMap: Record<string, string>,
): Array<Promise<any>> {
  const tasks: Promise<any>[] = [];

  for (const m of seed) {
    tasks.push(
      (async () => {
        const splitCode = m.code.split("/");
        const companyWebsite = (companyToWebsiteMap as any)[splitCode[0]];
        if (!companyWebsite) {
          console.error(m);
          throw new Error(
            `Company '${splitCode[0]}' is not defined in the codebase!`,
          );
        }

        if (m.inputSchema) {
          const inputSchemaParseRes = modelInputSchema.safeParse(m.inputSchema);
          if (!inputSchemaParseRes.success) {
            console.dir(
              {
                inputSchema: m.inputSchema,
                error: z.treeifyError(inputSchemaParseRes.error),
              },
              { depth: null },
            );
            throw new Error(`Invalid inputSchema for ${m.code} was received!`);
          }
          console.dir(inputSchemaParseRes.data, { depth: null });
        }

        if (
          !(await doesShowCaseFileExist(`${splitCode[1]}.jpg`, "cards")) &&
          !(await doesShowCaseFileExist(
            `${splitCode[1]}.png`,
            "videos/posters",
          ))
        ) {
          throw new Error(`No card nor poster image for ${m.code} was found!`);
        }
        if (
          m.hasShowCaseImage &&
          !(await doesShowCaseFileExist(`${splitCode[1]}.jpg`, "images"))
        ) {
          throw new Error(`Image showcase for ${m.code} not found!`);
        }
        if (
          m.hasShowCaseVideo &&
          !(await doesShowCaseFileExist(`${splitCode[1]}.mp4`, "videos"))
        ) {
          throw new Error(`Video showcase for ${m.code} not found!`);
        }

        const modelName = [
          ...new Set(m.code.replace("/", " ").replaceAll("-", " ").split(" ")),
        ]
          .map((n) => capitalizeFirstLetter(n))
          .join(" ");

        if (
          !descriptionsMap[m.code] ||
          !descriptionsMap[m.code].trim().length
        ) {
          const desc = await fetchFarsiDescription(modelName);
          descriptionsMap[m.code] = desc;
        }

        const newData = {
          ...(m as typeof m & { imageInput: ImageInput }),
          name: modelName,
          description: descriptionsMap[m.code],
          shortDescription: shortDescriptionsMap[m.code],
        };

        await prismaModel.upsert({
          where: { id: m.id },
          create: newData,
          update: { ...newData, id: undefined },
        });
      })(),
    );
  }

  return tasks;
}

async function main() {
  await Promise.all([
    ...userSeed.map((user) =>
      upsertWithSameData(
        prisma.user,
        { email: user.email, mobile: user.mobile },
        user,
      ),
    ),
    ...faqSeed.map((faq) =>
      upsertWithSameData(prisma.faq, { id: faq.id }, faq),
    ),
    ...webPlanSeed.map((plan) =>
      upsertWithSameData(prisma.webPlan, { id: plan.id }, plan),
    ),
  ]);

  const descriptionsMap = await loadDescriptions();

  // 1) Ensure all long descriptions exist before any DB work
  let descriptionsChanged = false;
  for (const m of [
    ...(languageModelSeed as any[]),
    ...(imageModelSeed as any[]),
    ...(videoModelSeed as any[]),
  ]) {
    const code = m.code;
    if (!descriptionsMap[code] || !descriptionsMap[code].trim().length) {
      const modelName = toModelNameFromCode(code);
      const desc = await fetchFarsiDescription(modelName);
      descriptionsMap[code] = desc;
      descriptionsChanged = true;
    }
  }

  // Persist long descriptions only if we fetched anything new
  if (descriptionsChanged) {
    await saveDescriptions(descriptionsMap);
  }

  // 2) Prepare short descriptions (generate once if AiModelDescription.json changed)
  let shortDescriptionsMap: Record<string, string>;
  const shortFileExists = existsSync(SHORT_DESC_JSON_FILE);

  if (descriptionsChanged || !shortFileExists) {
    shortDescriptionsMap =
      await generateShortDescriptionsAllAtOnce(descriptionsMap);
    await saveShortDescriptions(shortDescriptionsMap);
  } else {
    shortDescriptionsMap = await loadShortDescriptions();
  }

  // 3) Now (re)seed DB with both description and shortDescription
  await Promise.all([
    prisma.languageModel.deleteMany({}),
    prisma.imageModel.deleteMany({}),
    prisma.videoModel.deleteMany({}),
  ]);

  const languageTasks = buildSeedTasks(
    languageModelSeed as any[],
    prisma.languageModel,
    descriptionsMap,
    shortDescriptionsMap,
  );
  const imageTasks = buildSeedTasks(
    imageModelSeed as any[],
    prisma.imageModel,
    descriptionsMap,
    shortDescriptionsMap,
  );
  const videoTasks = buildSeedTasks(
    videoModelSeed as any[],
    prisma.videoModel,
    descriptionsMap,
    shortDescriptionsMap,
  );

  await Promise.all([...languageTasks, ...imageTasks, ...videoTasks]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
