"use server";

import { getFaqs } from "@/lib/faqs";
import { getWebPlans } from "@/lib/plans";
import { getModelsForPlanComparison } from "@/lib/models";
import { roundWebPlanTokensAmount } from "@/lib/cost";
import Icon from "./Icon";
import FAQSection from "./FAQSection";
import Enamad from "./Enamad";
import Link from "next/link";

// Icons
import {
  HiOutlineLightBulb,
  HiOutlineChip,
  HiOutlineGlobe,
} from "react-icons/hi";
import {
  MdOutlineInsights,
  MdOutlineAutoAwesome,
  MdOutlineRocketLaunch,
} from "react-icons/md";
import { FiShield, FiCode, FiUsers } from "react-icons/fi";
import { BsArrowRight, BsCheckCircle } from "react-icons/bs";
import { RiRobot2Line } from "react-icons/ri";

export default async function Home() {
  const faqs = await getFaqs();
  const plans = await getWebPlans();
  const modelsForPlanComparison = await getModelsForPlanComparison();

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-black/90 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Icon fill="#fff" className="h-10" />

            <div className="hidden md:flex space-x-8">
              <a
                href="#features"
                className="text-white hover:text-emerald-400 transition-colors"
              >
                ویژگی‌ها
              </a>
              <a
                href="#models"
                className="text-white hover:text-emerald-400 transition-colors"
              >
                مدل‌ها
              </a>
              <a
                href="#pricing"
                className="text-white hover:text-emerald-400 transition-colors"
              >
                قیمت‌گذاری
              </a>
              <a
                href="#faq"
                className="text-white hover:text-emerald-400 transition-colors"
              >
                سوالات متداول
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/auth"
              className="py-2 px-4 text-white hover:text-emerald-400 transition-colors"
            >
              ورود
            </Link>
            <Link
              href="/auth?register=true"
              className="py-2 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-colors"
            >
              ثبت‌نام
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-black to-gray-900 text-white">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-block py-1 px-3 bg-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-4">
                +300 مدل هوش مصنوعی
              </div>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                قدرت <span className="text-emerald-400">هوش مصنوعی</span> در
                دستان شما
              </h1>
              <p className="text-xl text-gray-300 md:pr-12">
                با استفاده از پیشرفته‌ترین مدل‌های هوش مصنوعی، کسب‌وکار، محتوا و
                ایده‌های خود را به سطح بعدی ببرید.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/auth"
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-lg font-medium flex items-center justify-center gap-2 transition-all"
                >
                  شروع کنید
                  <BsArrowRight />
                </Link>
                <a
                  href="#models"
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full text-lg font-medium flex items-center justify-center transition-all"
                >
                  مشاهده مدل‌ها
                </a>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -z-10 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-3xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
              <div className="grid grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="backdrop-blur-sm bg-white/5 border border-white/10 p-6 rounded-2xl"
                  >
                    <RiRobot2Line className="text-4xl text-emerald-400 mb-4" />
                    <h3 className="font-medium text-lg mb-2">
                      {item === 1 && "تولید محتوا"}
                      {item === 2 && "برنامه‌نویسی"}
                      {item === 3 && "داده‌کاوی"}
                      {item === 4 && "پردازش تصویر"}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {item === 1 &&
                        "ایجاد محتوای خلاقانه و جذاب با کمک هوش مصنوعی"}
                      {item === 2 && "نوشتن و دیباگ کد با سرعت بیشتر"}
                      {item === 3 && "تحلیل حجم عظیمی از داده‌ها در زمان کوتاه"}
                      {item === 4 && "تجزیه و تحلیل و بهینه‌سازی تصاویر"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-emerald-500 font-medium">
              ویژگی‌های منحصر به فرد
            </span>
            <h2 className="text-4xl font-bold mt-4 mb-6">
              چه چیزی ما را متمایز می‌کند؟
            </h2>
            <p className="text-gray-600 text-lg">
              پلتفرم ما با ارائه بیش از ۳۰۰ مدل هوش مصنوعی، تجربه‌ای متفاوت و
              کاربردی برای تمام نیازهای شما فراهم می‌کند.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<HiOutlineChip />}
              title="به‌روزترین مدل‌ها"
              description="دسترسی به پیشرفته‌ترین مدل‌های هوش مصنوعی از معتبرترین شرکت‌های دنیا"
            />
            <FeatureCard
              icon={<MdOutlineInsights />}
              title="همه‌کاره"
              description="از تولید محتوا تا برنامه‌نویسی و تحلیل داده، همه در یک پلتفرم"
              featured={true}
            />
            <FeatureCard
              icon={<FiShield />}
              title="امنیت بالا"
              description="محافظت از داده‌های شما با بالاترین استانداردهای امنیتی موجود"
            />
            <FeatureCard
              icon={<HiOutlineLightBulb />}
              title="خلاقیت نامحدود"
              description="ایده‌های خود را با کمک هوش مصنوعی به واقعیت تبدیل کنید"
            />
            <FeatureCard
              icon={<MdOutlineAutoAwesome />}
              title="شخصی‌سازی"
              description="تنظیم پارامترها و مدل‌ها مطابق با نیازهای خاص شما"
            />
            <FeatureCard
              icon={<HiOutlineGlobe />}
              title="پشتیبانی از فارسی"
              description="پشتیبانی قدرتمند از زبان فارسی در تمام مدل‌های هوش مصنوعی"
            />
          </div>
        </div>
      </section>

      {/* Models Showcase */}
      <section id="models" className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-emerald-500 font-medium">
              مدل‌های هوش مصنوعی
            </span>
            <h2 className="text-4xl font-bold mt-4 mb-6">
              بیش از ۳۰۰ مدل برای انواع کاربردها
            </h2>
            <p className="text-gray-600 text-lg">
              از معروف‌ترین مدل‌ها مانند ChatGPT و Claude تا مدل‌های تخصصی برای
              کاربردهای خاص
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ModelCategory title="تولید متن" count="120+" icon={<FiCode />} />
            <ModelCategory
              title="پردازش تصویر"
              count="80+"
              icon={<MdOutlineInsights />}
            />
            <ModelCategory title="برنامه‌نویسی" count="50+" icon={<FiCode />} />
            <ModelCategory
              title="تحلیل داده"
              count="40+"
              icon={<HiOutlineLightBulb />}
            />
            <ModelCategory
              title="ترجمه"
              count="25+"
              icon={<HiOutlineGlobe />}
            />
            <ModelCategory
              title="بازاریابی"
              count="35+"
              icon={<MdOutlineRocketLaunch />}
            />
            <ModelCategory
              title="تولید محتوا"
              count="45+"
              icon={<MdOutlineAutoAwesome />}
            />
            <ModelCategory
              title="سایر کاربردها"
              count="20+"
              icon={<FiUsers />}
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-black text-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-emerald-400 font-medium">
              به سادگی شروع کنید
            </span>
            <h2 className="text-4xl font-bold mt-4 mb-6">چگونه کار می‌کند؟</h2>
            <p className="text-gray-300 text-lg">
              تنها با چند گام ساده به دنیای هوش مصنوعی وارد شوید و از مزایای آن
              بهره‌مند شوید
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="۱"
              title="ثبت‌نام و انتخاب پلن"
              description="در چند ثانیه ثبت‌نام کنید و پلن مناسب خود را انتخاب کنید"
            />
            <StepCard
              number="۲"
              title="انتخاب مدل مناسب"
              description="از میان صدها مدل، مدل مناسب نیاز خود را پیدا کنید"
            />
            <StepCard
              number="۳"
              title="استفاده از قدرت هوش مصنوعی"
              description="به سادگی از هوش مصنوعی برای رسیدن به اهداف خود استفاده کنید"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-emerald-500 font-medium">
              قیمت‌گذاری شفاف
            </span>
            <h2 className="text-4xl font-bold mt-4 mb-6">
              پلن‌های متناسب با نیاز شما
            </h2>
            <p className="text-gray-600 text-lg">
              پلن‌های مقرون به صرفه برای کاربران فردی تا سازمان‌های بزرگ
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-2xl overflow-hidden ${
                  index === 1
                    ? "border-2 border-emerald-500 shadow-xl shadow-emerald-100"
                    : "border border-gray-200"
                }`}
              >
                <div
                  className={`p-8 ${
                    index === 1 ? "bg-emerald-50" : "bg-gray-50"
                  }`}
                >
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-end gap-1 mb-6">
                    <span className="text-3xl font-bold">
                      {plan.displayPrice}
                    </span>
                    <span className="text-gray-500 mb-1">تومان/ماه</span>
                  </div>
                  <Link
                    href={`/auth?selectedPlan=${plan.id}`}
                    className={`block w-full py-3 px-6 rounded-lg text-center font-medium transition-colors ${
                      index === 1
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                        : "bg-black hover:bg-gray-800 text-white"
                    }`}
                  >
                    انتخاب پلن
                  </Link>
                </div>

                <div className="p-8 bg-white">
                  <p className="flex items-center gap-2 mb-4">
                    <BsCheckCircle
                      className={`${
                        index === 1 ? "text-emerald-500" : "text-gray-500"
                      }`}
                    />
                    <span>دسترسی به مدل‌های اصلی</span>
                  </p>
                  <p className="flex items-center gap-2 mb-4">
                    <BsCheckCircle
                      className={`${
                        index === 1 ? "text-emerald-500" : "text-gray-500"
                      }`}
                    />
                    <span>امکانات پیشرفته برای ریاضیات و برنامه نویسی</span>
                  </p>
                  <p className="flex items-center gap-2 mb-4">
                    <BsCheckCircle
                      className={`${
                        index === 1 ? "text-emerald-500" : "text-gray-500"
                      }`}
                    />
                    <span>{plan.credits} اعتبار</span>
                  </p>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mb-3">
                      معادل استفاده در:
                    </p>

                    {modelsForPlanComparison.map((model, idx) => {
                      const inputTokens = roundWebPlanTokensAmount(
                        (plan.credits / model.creditCostPerMilInToken) *
                          1_000_000
                      );
                      const outputTokens = roundWebPlanTokensAmount(
                        (plan.credits / model.creditCostPerMilOutToken) *
                          1_000_000
                      );

                      return (
                        <div key={idx} className="mb-4 last:mb-0">
                          <p className="font-medium mb-1">{model.name}</p>
                          <p className="text-sm text-gray-600">
                            {inputTokens.toLocaleString()} توکن ورودی |{" "}
                            {outputTokens.toLocaleString()} توکن خروجی
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-emerald-500 font-medium">سوالات متداول</span>
            <h2 className="text-4xl font-bold mt-4 mb-6">پاسخ به سوالات شما</h2>
            <p className="text-gray-600 text-lg">
              پاسخ به سوالات رایج کاربران برای آشنایی بیشتر با خدمات ما
            </p>
          </div>

          <FAQSection items={faqs} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              آماده‌اید تا قدرت هوش مصنوعی را تجربه کنید؟
            </h2>
            <p className="text-xl text-gray-300 mb-10">
              همین امروز به جمع هزاران کاربر راضی بپیوندید و کسب‌وکار خود را
              متحول کنید.
            </p>
            <Link
              href="/auth"
              className="inline-block px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-lg font-medium transition-colors"
            >
              رایگان شروع کنید
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-gray-100">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Icon fill="#000" className="h-10 mb-6" />
              <p className="text-gray-600 mb-6 max-w-md">
                پلتفرم پیشرو در ارائه خدمات هوش مصنوعی با دسترسی به بیش از ۳۰۰
                مدل مختلف برای تمام نیازهای شما
              </p>

              <div className="flex items-center">
                <Enamad />
                <div className="mr-4">
                  <p className="text-sm text-gray-500">
                    &copy; ۱۴۰۳ سپهر AI. تمامی حقوق محفوظ است.
                  </p>
                  <a
                    href="mailto:info@sepehr-ai.com"
                    className="text-sm text-emerald-500 hover:underline"
                  >
                    info@sepehr-ai.com
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-bold mb-4">محصولات</h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 hover:text-emerald-500 transition-colors"
                    >
                      مدل‌های متنی
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 hover:text-emerald-500 transition-colors"
                    >
                      مدل‌های تصویری
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 hover:text-emerald-500 transition-colors"
                    >
                      برنامه‌نویسی
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 hover:text-emerald-500 transition-colors"
                    >
                      تحلیل داده
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-4">شرکت</h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 hover:text-emerald-500 transition-colors"
                    >
                      درباره ما
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 hover:text-emerald-500 transition-colors"
                    >
                      تماس با ما
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 hover:text-emerald-500 transition-colors"
                    >
                      همکاری با ما
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 hover:text-emerald-500 transition-colors"
                    >
                      وبلاگ
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-4">پشتیبانی</h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 hover:text-emerald-500 transition-colors"
                    >
                      راهنما
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 hover:text-emerald-500 transition-colors"
                    >
                      حریم خصوصی
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 hover:text-emerald-500 transition-colors"
                    >
                      قوانین استفاده
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-600 hover:text-emerald-500 transition-colors"
                    >
                      امنیت
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper Components

function FeatureCard({ icon, title, description, featured = false }) {
  return (
    <div
      className={`
      p-8 rounded-2xl transition-all hover:shadow-lg
      ${
        featured
          ? "bg-emerald-500 text-white"
          : "bg-white border border-gray-100 hover:border-emerald-200"
      }
    `}
    >
      <div
        className={`
        text-4xl mb-4
        ${featured ? "text-white" : "text-emerald-500"}
      `}
      >
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className={featured ? "text-white/90" : "text-gray-600"}>
        {description}
      </p>
    </div>
  );
}

function ModelCategory({ title, count, icon }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:border-emerald-200 transition-all">
      <div className="text-3xl text-emerald-500 mb-4">{icon}</div>
      <h3 className="font-medium text-lg">{title}</h3>
      <p className="text-emerald-500 font-bold">{count}</p>
    </div>
  );
}

function StepCard({ number, title, description }) {
  return (
    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
      <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-xl font-bold mb-6">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
}
