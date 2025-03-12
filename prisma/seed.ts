import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const mahdi = await prisma.user.upsert({
    where: { email: "mail@mahdi-sharifi.ir" },
    update: {},
    create: {
      webBalance: 100,
      apiBalance: 100,
      name: "مهدی شریفی",
      phoneNumber: "09150872550",
      email: "mail@mahdi-sharifi.ir",
      password: "$2b$10$ZBtyt81wR0oGhQn7TIXOoOU/XtbAG.9xGyoI6TpODYPvqg6bPTnV2",
    },
  });

  const llmModels = await Promise.all([
    prisma.llmModel.upsert({
      where: { code: "openai/o1" },
      update: {},
      create: {
        id: 5,
        name: "OpenAI O1",
        code: "openai/o1",
        costPerMilInToken: 15,
        costPerMilOutToken: 60,
        estimatedEncodingBase: "CL100K",
        description:
          "مدل o1 شرکت OpenAI، نخستین نسخه از سری مدل‌های استدلال‌گر این شرکت است که با استفاده از الگوریتم‌های بهینه‌سازی جدید، داده‌های آموزشی اختصاصی و روش‌های یادگیری تقویتی، توانایی «تفکر» قبل از ارائه پاسخ را دارد. به عبارت دیگر، این مدل با تولید زنجیره‌های طولانی از تفکرات در پس‌زمینه، مانند یک انسان گام به گام به حل مسائل پیچیده ریاضی، علمی و برنامه‌نویسی می‌پردازد. عملکرد این مدل در آزمون‌های تخصصی، مانند آزمون‌های ریاضی و مسابقات برنامه‌نویسی، به سطح دانشجویان دکترا نزدیک شده و دقت آن نسبت به مدل‌های پیشین مانند GPT-4o به طور چشمگیری افزایش یافته است، اگرچه به هزینه‌ی محاسباتی و زمان پاسخ‌دهی بیشتری نیاز دارد.",
      },
    }),
    prisma.llmModel.upsert({
      where: { code: "openai/o3-mini" },
      update: {},
      create: {
        id: 4,
        name: "OpenAI O3 mini",
        code: "openai/o3-mini",
        costPerMilInToken: 1.1,
        costPerMilOutToken: 4.4,
        estimatedEncodingBase: "CL100K",
        description:
          "مدل o3 mini شرکت OpenAI، نسخه‌ای مقرون‌به‌صرفه از مدل‌های استدلالی پیشرفته است که با بهره‌گیری از تکنیک‌های بهینه‌سازی و کاهش مصرف محاسباتی، امکان حل مسائل پیچیده در زمینه‌های ریاضی، علوم و برنامه‌نویسی را با هزینه‌ای کمتر فراهم می‌کند. این مدل با صرف زمان کمتر در تولید زنجیره‌های تفکری نسبت به نسخه‌های سنگین‌تر، پاسخ‌های دقیق و کارآمد ارائه می‌دهد و در عین حال از قابلیت‌های استدلالی قوی برخوردار است، که آن را برای کاربردهای عملی و پروژه‌های صنعتی جذاب می‌سازد.",
      },
    }),
    prisma.llmModel.upsert({
      where: { code: "openai/gpt-4.5-preview" },
      update: {},
      create: {
        id: 3,
        name: "OpenAI GPT-4.5 preview",
        code: "openai/gpt-4.5-preview",
        costPerMilInToken: 75,
        costPerMilOutToken: 150,
        estimatedEncodingBase: "O200K",
        description:
          "مدل GPT-4.5 preview شرکت OpenAI، به عنوان بزرگ‌ترین مدل هوش مصنوعی فعلی این شرکت، نمونه‌ای از جهش‌های فنی و مقیاس‌پذیری پیشرفته در تولید زبان طبیعی محسوب می‌شود. این مدل که هنوز در قالب پیش‌نمایش عرضه شده است، نشانگر بهبود قابل توجهی نسبت به نسخه‌های قبلی مانند GPT-4 است و با استفاده از معماری‌های نوین و داده‌های گسترده، قادر به ارائه پاسخ‌های دقیق‌تر و حل مسائل پیچیده در حوزه‌های مختلف از جمله استدلال و تولید متن می‌باشد. اگرچه در حال حاضر فقط به عنوان پیش‌نمایش در دسترس است، اما انتظار می‌رود پس از ارزیابی‌های بیشتر و بهینه‌سازی‌های لازم، نقشی کلیدی در توسعه کاربردهای نوین هوش مصنوعی داشته باشد.",
      },
    }),
    prisma.llmModel.upsert({
      where: { code: "openai/gpt-4o" },
      update: {},
      create: {
        id: 2,
        name: "OpenAI GPT-4o",
        code: "openai/gpt-4o",
        costPerMilInToken: 2.5,
        costPerMilOutToken: 10,
        estimatedEncodingBase: "O200K",
        description:
          "مدل GPT-4o شرکت OpenAI، جدیدترین و پیشرفته‌ترین مدل این شرکت است که با سرعت پردازش بالا، توانایی استدلال قوی و قابلیت تعامل چندحالته (متن، تصویر، صوت) طراحی شده است. این مدل در مقایسه با نسخه‌های قبلی، پاسخ‌های طبیعی‌تر، سریع‌تر و دقیق‌تر ارائه می‌دهد و می‌تواند مسائل پیچیده را با درک عمیق‌تر و استدلال منطقی‌تر حل کند. همچنین، مصرف بهینه‌تر منابع محاسباتی باعث شده تا عملکرد آن مقرون‌به‌صرفه‌تر باشد، در حالی که همچنان یکی از هوشمندترین مدل‌های زبانی موجود محسوب می‌شود.",
      },
    }),
    prisma.llmModel.upsert({
      where: { code: "openai/gpt-4o-mini" },
      update: {},
      create: {
        id: 1,
        name: "OpenAI GPT-4o mini",
        costPerMilInToken: 0.15,
        costPerMilOutToken: 0.6,
        code: "openai/gpt-4o-mini",
        estimatedEncodingBase: "O200K",
        description:
          "مدل GPT-4o-mini شرکت OpenAI، نسخه‌ای بهینه‌شده و مقرون‌به‌صرفه از خانواده مدل‌های GPT-4o است که با حفظ توانایی‌های هوش بالا، نیاز به منابع محاسباتی کمتری دارد. این مدل به گونه‌ای طراحی شده که بتواند با صرف زمان و هزینه کمتر، همچنان عملکرد دقیقی در حل مسائل پیچیده، استدلال و تولید پاسخ‌های طبیعی ارائه دهد. به عبارت دیگر، GPT-4o-mini ترکیبی از قدرت پردازشی و دقت مدل‌های بزرگ و صرفه‌جویی اقتصادی را در یک بسته نرم‌افزاری ارائه می‌دهد که آن را برای کاربردهای گسترده، از جمله پروژه‌های صنعتی و استفاده‌های روزمره، بسیار مناسب می‌سازد.",
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

  console.log({ users: { mahdi }, llmModels });
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
