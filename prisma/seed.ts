/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { TiktokenEncoding } from "js-tiktoken";
import { roundAiModelCost } from "../lib/cost";
import { companyToWebsiteMap } from "../lib/aiCompaniesForBackend";
import fs from "fs/promises";
import { existsSync } from "fs";
import { generateText } from "ai";
import path from "node:path";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const prisma = new PrismaClient();

export const openrouterModelListSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      context_length: z.number(),
      architecture: z.object({
        input_modalities: z.array(z.string()),
        output_modalities: z.array(z.string()),
      }),
      pricing: z.object({
        prompt: z.coerce.number(),
        completion: z.coerce.number(),
      }),
    })
  ),
});

const farsiDescriptionSchema = z.string().refine(
  (value) => {
    const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
    return wordCount >= 100 && wordCount <= 200;
  },
  { message: "Farsi description must be between 100 and 200 words." }
);

function estimateTiktokenEncoding(contextLength: number): TiktokenEncoding {
  if (contextLength < 10000) {
    return "gpt2";
  }
  if (contextLength < 100000) {
    return "p50k_base";
  }
  if (contextLength < 200000) {
    return "cl100k_base";
  }
  return "o200k_base";
}

const USE_TO_COMPARE_PLANS: string[] = [
  "openai/gpt-4o-mini",
  "openai/o3-mini",
  "openai/o3-mini",
];

const DESC_JSON_FILE = path.resolve(__dirname, "./modelDescriptionSeed.json");

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
  descriptions: Record<string, string>
): Promise<void> {
  await fs.writeFile(DESC_JSON_FILE, JSON.stringify(descriptions, null, 2));
}

async function fetchFarsiDescription(
  modelName: string,
  modelEnglishDescription: string
): Promise<string> {
  const prompt = `Generate a Farsi description for an AI model named "${modelName}". The description should be approximately 150 words long and must include all details mentioned within the parentheses of the model name. Return only the Farsi description without any greetings, explanations, or additional characters. Do not include any markdown formatting; output everything as raw text, including any links. Additionally, ensure that the Farsi text does not contain any Farsi half-spaces (نیم فاصله). Use the provided English description as a guide for generating the Farsi description: "${modelEnglishDescription}"`;

  const maxRetries = 10;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const resp = await generateText({
        prompt,
        model: openrouter("deepseek/deepseek-r1:free"),
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

async function main() {
  await Promise.all([
    prisma.user.upsert({
      where: { email: "mail@mahdi-sharifi.ir" },
      update: {},
      create: {
        webBalance: 100,
        apiBalance: 100,
        name: "مهدی شریفی",
        mobile: "09150872550",
        email: "mail@mahdi-sharifi.ir",
      },
    }),
    prisma.webPlans.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        balance: 6,
        name: "ابتدایی",
        credits: 6000,
        price: 400_000,
        displayPrice: "۴۰۰ هزار",
      },
    }),
    prisma.webPlans.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        balance: 8,
        credits: 8000,
        name: "متوسط",
        price: 600_000,
        displayPrice: "۶۰۰ هزار",
      },
    }),
    prisma.webPlans.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        balance: 10,
        name: "حرفه‌ای",
        credits: 10000,
        price: 1_000_000,
        displayPrice: "یک میلیون",
      },
    }),
  ]);

  const descriptionsMap = await loadDescriptions();
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    method: "GET",
    headers: {},
  });
  const jsonResponse = await response.json();
  const opnerouterRes = await openrouterModelListSchema.safeParseAsync(
    jsonResponse
  );
  if (!opnerouterRes.success) {
    console.warn(opnerouterRes.error);
    throw new Error("Failed to parse OpenRouter response!");
  }

  const openrouterModels = opnerouterRes.data.data;
  const total = openrouterModels.length;

  let processed = 0;
  for (const m of openrouterModels) {
    if (
      m.id.includes(":free") ||
      m.pricing.completion === 0 ||
      m.pricing.prompt === 0 ||
      !m.architecture.input_modalities.includes("text") ||
      m.id === "openrouter/auto"
    ) {
      continue;
    }

    const companyWebsite = (companyToWebsiteMap as any)[m.id.split("/")[0]];
    if (!companyWebsite) {
      console.error(m);
      throw new Error("Company is not defined in the codebase!");
    }

    if (!descriptionsMap[m.id]) {
      console.log(
        `Fetching Farsi description for: ${m.name} (${processed + 1}/${total})`
      );
      const desc = await fetchFarsiDescription(m.name, m.description);
      descriptionsMap[m.id] = desc;
      await saveDescriptions(descriptionsMap);
    }

    await prisma.llmModel.upsert({
      where: { code: m.id },
      update: { description: descriptionsMap[m.id] },
      create: {
        code: m.id,
        name: m.name,
        companyWebsite,
        description: descriptionsMap[m.id],
        useToComparePlans: USE_TO_COMPARE_PLANS.includes(m.id),
        estimatedEncodingBase: estimateTiktokenEncoding(m.context_length),
        costPerMilInToken: roundAiModelCost(m.pricing.prompt * 1_000_000),
        costPerMilOutToken: roundAiModelCost(m.pricing.completion * 1_000_000),
      },
    });

    processed++;
  }
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
