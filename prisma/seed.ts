/* eslint-disable @typescript-eslint/no-explicit-any */
import { companyToWebsiteMap } from "@/lib/aiCompaniesForBackend";
import prisma from "@/lib/prisma";
import { ratioLabelToEnumKey } from "@/lib/ratio";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { existsSync } from "fs";
import fs from "fs/promises";
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

async function saveDescriptions(
  descriptions: Record<string, string>,
): Promise<void> {
  await fs.writeFile(DESC_JSON_FILE, JSON.stringify(descriptions, null, 2));
}

async function fetchFarsiDescription(modelName: string): Promise<string> {
  const prompt = `Generate a Farsi description for an AI model named "${modelName}". The description should be approximately 75 words long. Return only the Farsi description without any greetings, explanations, or additional characters. Do not include any markdown formatting; output everything as raw text, including any links. Search the web for finding information about the AI model to generate the description. The description should be in simple terms and understandable for the average person.`;

  const maxRetries = 10;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const resp = await generateText({
        prompt,
        model: openrouter("openai/gpt-5"),
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

// Shared seeding loop for models that need Farsi descriptions
function buildSeedTasks(
  seed: Array<
    { id: number; code: string; name: string; imageInput: ImageInput } & Record<
      string,
      any
    >
  >,
  prismaModel: { upsert(args: any): Promise<any> },
  descriptionsMap: Record<string, string>,
): Array<Promise<any>> {
  const tasks: Promise<any>[] = [];

  for (const m of seed) {
    tasks.push(
      (async () => {
        const companyWebsite = (companyToWebsiteMap as any)[
          m.code.split("/")[0]
        ];
        if (!companyWebsite) {
          console.error(m);
          throw new Error(
            `Company '${m.code.split("/")[0]}' is not defined in the codebase!`,
          );
        }

        if (
          !descriptionsMap[m.code] ||
          !descriptionsMap[m.code].trim().length
        ) {
          const desc = await fetchFarsiDescription(m.name);
          descriptionsMap[m.code] = desc;
        }

        const newData = {
          ...(m as typeof m & { imageInput: ImageInput }),
          description: descriptionsMap[m.code],
        };
        if (typeof (newData as any).ratios !== "undefined") {
          (newData as any).ratios = (newData as any).ratios.map((r: string) =>
            ratioLabelToEnumKey(r),
          );
        }

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

  // Delete existing entries for both models before inserting.
  await Promise.all([
    prisma.languageModel.deleteMany({}),
    prisma.imageModel.deleteMany({}),
    prisma.videoModel.deleteMany({}),
  ]);

  const languageTasks = buildSeedTasks(
    languageModelSeed as any[],
    prisma.languageModel,
    descriptionsMap,
  );
  const imageTasks = buildSeedTasks(
    imageModelSeed as any[],
    prisma.imageModel,
    descriptionsMap,
  );
  const videoTasks = buildSeedTasks(
    videoModelSeed as any[],
    prisma.videoModel,
    descriptionsMap,
  );

  await Promise.all([...languageTasks, ...imageTasks, ...videoTasks]);
  await saveDescriptions(descriptionsMap);
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
