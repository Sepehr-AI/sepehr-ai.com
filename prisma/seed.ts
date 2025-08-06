/* eslint-disable @typescript-eslint/no-explicit-any */

import { z } from "zod";
import fs from "fs/promises";
import path from "node:path";
import { existsSync } from "fs";
import prisma from "@/lib/prisma";
import { generateText } from "ai";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { roundAiModelCost } from "@/lib/cost";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { companyToWebsiteMap } from "@/lib/aiCompaniesForBackend";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DISABLED_MODELS = ["openai/o1-pro"];
const IGNORED_MODELS = ["openrouter/auto", "switchpoint/router"];

const AI_COMPANY_PRIORITY = [
  { priority: 1, website: "openai.com" },
  { priority: 2, website: "anthropic.com" },
  { priority: 3, website: "perplexity.ai" },
  { priority: 4, website: "gemini.google.com" },
  { priority: 5, website: "x.ai" },
  { priority: 6, website: "llama.com" },
  { priority: 7, website: "openai.com" },
  { priority: 8, website: "qwen.ai" },
  { priority: 9, website: "mistral.ai" },
  { priority: 10, website: "deepseek.com" },
  { priority: 11, website: "microsoft.com" },
  { priority: 12, website: "nvidia.com" },
  { priority: 13, website: "amazon.com" },
  { priority: 14, website: "z.ai" },
];

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

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
    }),
  ),
});

const farsiDescriptionSchema = z.string().refine(
  (value) => {
    const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
    return wordCount >= 100 && wordCount <= 200;
  },
  { message: "Farsi description must be between 100 and 200 words." },
);

const USE_TO_COMPARE_PLANS: string[] = [
  "x-ai/grok-4",
  "anthropic/claude-opus-4",
  "openai/gpt-4",
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
  descriptions: Record<string, string>,
): Promise<void> {
  await fs.writeFile(DESC_JSON_FILE, JSON.stringify(descriptions, null, 2));
}

async function fetchFarsiDescription(
  modelName: string,
  modelEnglishDescription: string,
): Promise<string> {
  const prompt = `Generate a Farsi description for an AI model named "${modelName}". The description should be approximately 150 words long and must include all details mentioned within the parentheses of the model name. Return only the Farsi description without any greetings, explanations, or additional characters. Do not include any markdown formatting; output everything as raw text, including any links. Use the provided English description as a guide for generating the Farsi description: "${modelEnglishDescription}"`;

  const maxRetries = 10;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const resp = await generateText({
        prompt,
        model: openrouter("openai/o3-mini-high"),
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

async function main() {
  await Promise.all([
    // User
    upsertWithSameData(
      prisma.user,
      { email: "mail@mahdi-sharifi.ir", mobile: "09150872550" },
      {
        name: "مهدی شریفی",
        mobile: "09150872550",
        email: "mail@mahdi-sharifi.ir",
      },
    ),

    // FAQs
    ...[
      {
        id: 1,
        title: "توکن چیست و تقریبا چطور محاسبه می‌شود؟",
        description:
          "توکن واحدی است که برای اندازه‌گیری حجم ورودی و خروجی در مدل‌های زبانی به‌کار می‌رود و معمولاً معادل حدود ۴ کاراکتر یا بخش‌هایی از یک کلمه است. در زبان فارسی هر کلمه ساده معمولاً بین ۱ تا ۲ توکن مصرف می‌کند و کلمات مرکب یا دارای پسوند ممکن است تا ۳ توکن بشوند. به‌طور متوسط می‌توان هر کلمه فارسی را حدود ۱.۵ توکن در نظر گرفت.",
      },
      {
        id: 2,
        title: "برای ثبت نام چی نیاز دارم؟",
        description:
          "برای ثبت‌نام در سپهر AI کافی است به صفحه اصلی مراجعه کرده و روی دکمه «شروع» کلیک کنید. سپس شماره تلفن خود را وارد نمایید. پس از ارسال کد تأیید توسط پیامک، با وارد کردن آن کد، حساب شما فعال شده و می‌توانید به‌سرعت از خدمات و مدل‌های هوش مصنوعی بهره‌مند شوید.",
      },
      {
        id: 3,
        title: "مدل زبانی به اینترنت دسترسی داره؟",
        description:
          "بله. برخی از مدل‌های پیشرفته مانند Gemini و Claude 3 قابلیت مرور وب و جستجوی اینترنتی دارند و می‌توانند پاسخ‌های خود را با داده‌های به‌روز پشتیبانی کنند. اما بسیاری از مدل‌های دیگر مانند Llama 3 فاقد دسترسی مستقیم به اینترنت هستند و به‌ صورت آفلاین و با داده‌های از پیش آموزش‌دیده شده، به شما خدمت می‌کنند.",
      },
      {
        id: 4,
        title: "چه مدل‌هایی در سپهر AI در دسترس است؟",
        description:
          "سپهر AI دسترسی به بیش از ۲۵۰ مدل متنوع هوش مصنوعی را فراهم می‌کند. از جمله مدل‌های برجسته: GPT-4.5 (پیش‌نمایش)، Grok 3، Claude 3، Gemini، Llama 3 و Liquid LFM 7B. این مدل‌ها در حوزه‌های تولید محتوا، برنامه‌نویسی، بازاریابی، ترجمه و تحلیل داده قابل استفاده بوده و به‌صورت یکپارچه در یک پلتفرم واحد دردسترس هستند.",
      },
      {
        id: 5,
        title: "داده‌ها و سوابق چت‌های من چگونه ذخیره و محافظت می‌شوند؟",
        description:
          "سپهر AI متعهد به حریم خصوصی شما است و سوابق چت‌های شما را صرفاً در حافظه مرورگر ذخیره می‌کند. هیچ داده‌ای به‌سرورهای خارجی یا دیتابیس مرکزی منتقل نمی‌شود. این رویکرد امنیتی تضمین می‌کند که گفتگوها و اطلاعات شخصی شما خصوصی باقی می‌مانند و فقط از طریق دستگاه شما قابل دسترسی هستند.",
      },
      {
        id: 6,
        title:
          "چگونه می‌توانم از مدل‌ها برای تولید محتوا و برنامه‌نویسی استفاده کنم؟",
        description:
          "برای تولید محتوا و توسعه نرم‌افزار، ابتدا مدل موردنظر را از فهرست انتخاب کنید و در قسمت ورودی (Prompt) درخواست خود را بنویسید. برای مثال می‌توانید دستور ایجاد مقاله، خلاصه‌سازی متن یا دیباگ کد را تایپ کرده و مدل فوراً پاسخ می‌دهد. رابط کاربری یکپارچه ابزارهای ترجمه، ویرایش و تحلیل داده را نیز در اختیار شما قرار می‌دهد.",
      },
      {
        id: 7,
        title: "چگونه با پشتیبانی ارتباط برقرار کنم؟",
        description:
          "برای ارتباط با تیم پشتیبانی سپهر AI، می‌توانید از طریق کانال تلگرام به شناسه @sepehr_ai_support پیام دهید. هم‌چنین در صورت نیاز به راهنمایی بیشتر، می‌توانید از طریق بخش «تماس با ما» در سایت اقدام کرده یا ایمیل خود را ثبت کنید تا کارشناسان ما در اسرع وقت پاسخگوی شما باشند.",
      },
    ].map((faq) => upsertWithSameData(prisma.faq, { id: faq.id }, faq)),

    // webPlans
    ...[
      { id: 1, name: "برنزی", usdPrice: 3.5, usdCredits: 2 },
      { id: 2, name: "نقره‌ای", usdPrice: 13, usdCredits: 7 },
      { id: 3, name: "طلایی", usdPrice: 35, usdCredits: 20 },
    ].map((plan) => upsertWithSameData(prisma.webPlan, { id: plan.id }, plan)),
  ]);

  const descriptionsMap = await loadDescriptions();
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    method: "GET",
    headers: {},
  });
  const jsonResponse = await response.json();
  const opnerouterRes =
    await openrouterModelListSchema.safeParseAsync(jsonResponse);
  if (!opnerouterRes.success) {
    console.warn(opnerouterRes.error);
    throw new Error("Failed to parse OpenRouter response!");
  }

  const openrouterModels = opnerouterRes.data.data;

  let left = openrouterModels.length;
  const modelsWithDescriptionUpsert: Promise<any>[] = [];
  for (const m of openrouterModels) {
    if (
      m.id.includes(":free") ||
      m.pricing.completion === 0 ||
      m.pricing.prompt === 0 ||
      !m.architecture.input_modalities.includes("text") ||
      IGNORED_MODELS.includes(m.id)
    ) {
      left -= 1;
      continue;
    }

    const companyWebsite = (companyToWebsiteMap as any)[m.id.split("/")[0]];
    if (!companyWebsite) {
      console.error(m);
      throw new Error("Company is not defined in the codebase!");
    }

    const newData = {
      code: m.id,
      name: m.name,
      companyWebsite,
      contextLength: m.context_length,
      description: descriptionsMap[m.id],
      disabled: DISABLED_MODELS.includes(m.id),
      inputModalities: m.architecture.input_modalities,
      outputModalities: m.architecture.output_modalities,
      useToComparePlans: USE_TO_COMPARE_PLANS.includes(m.id),
      costPerMilInToken: roundAiModelCost(m.pricing.prompt * 1_000_000),
      costPerMilOutToken: roundAiModelCost(m.pricing.completion * 1_000_000),
      priority:
        AI_COMPANY_PRIORITY.find((m) => m.website === companyWebsite)
          ?.priority || null,
    };
    const upsertData = {
      where: { code: m.id },
      update: newData,
      create: newData,
    };
    if (!descriptionsMap[m.id] || !descriptionsMap[m.id].trim().length) {
      console.log(
        `Fetching Farsi description for: ${m.name} (${left} remaining)`,
      );

      const desc = await fetchFarsiDescription(m.name, m.description);
      descriptionsMap[m.id] = desc;
      upsertData.create.description = desc;
      upsertData.update.description = desc;

      await saveDescriptions(descriptionsMap);
    }

    modelsWithDescriptionUpsert.push(prisma.llmModel.upsert(upsertData));

    left -= 1;
  }

  await Promise.all(modelsWithDescriptionUpsert);
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
