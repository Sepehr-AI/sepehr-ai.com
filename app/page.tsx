"use server";

import Icon from "./Icon";
import { roundWebPlanTokensAmount } from "@/lib/cost";
import { getModelsForPlanComparison } from "@/lib/models";
import { getWebPlans } from "@/lib/plans";
import Head from "next/head";
import Link from "next/link";
import {
  FaLayerGroup,
  FaCalculator,
  FaCode,
  FaUserPlus,
  FaCogs,
  FaLock,
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaRegUser,
  FaBars,
} from "react-icons/fa";
import { TfiMoney } from "react-icons/tfi";
import { TbInfoHexagon } from "react-icons/tb";
import FAQAccordion from "./FAQAccordion";
import { GiAtom } from "react-icons/gi";
import { IoExtensionPuzzleOutline } from "react-icons/io5";
import { MdOutlineSecurity } from "react-icons/md";
import Enamad from "./Enamad";

const faqItems = [
  {
    question: "برای ثبت نام چی نیاز دارم؟",
    answer:
      "برای ثبت نام کافیست بر روی دکمه «شروع کنید» کلیک کنید و اطلاعات اولیه مانند ایمیل و شماره تلفن خود را وارد نمایید.",
  },
  {
    question: "مدل زبانی به اینترنت دسترسی داره؟",
    answer: "در حال حاضر این پشتیبانی وجود ندارد اما به زودی اضافه خواهد شد.",
  },
  {
    question: "به چه مدل‌های هوش مصنوعی دسترسی داریم؟",
    answer:
      "سپهر AI مجموعه‌ای از مدل‌های پیشرفته هوش مصنوعی، شامل مدل‌های GPT و سایر مدل‌های بهینه‌شده برای ریاضیات، برنامه نویسی و ویرایش متون را ارائه می‌دهد.",
  },
  {
    question: "چرا باید از هوش مصنوعی شما استفاده کنم؟",
    answer:
      "سپهر AI با ارائه مدل‌های به‌روز و بهینه در زمینه‌های ریاضیات، برنامه نویسی و ویرایش متون، تجربه‌ای امن و کارآمد را به شما ارائه می‌دهد.",
  },
  {
    question: "چرا GPT-4 شما مثل اشتراک پلاس OpenAI نیست؟",
    answer:
      "به دلیل بهینه‌سازی‌های اختصاصی و تنظیمات متفاوت، عملکرد GPT-4 ما تجربه‌ای متفاوت از اشتراک پلاس OpenAI ارائه می‌دهد.",
  },
  {
    question: "تفاوت اشتراک سپهر AI با اشتراک رسمی OpenAI چیه؟",
    answer:
      "در حالی که سپهر AI از زیرساخت‌های اختصاصی بهره می‌برد، سپهر AI ترکیبی از امنیت، قیمت‌گذاری انعطاف‌پذیر و دسترسی به مدل‌های به‌روز را ارائه می‌دهد که تفاوت‌های قابل توجهی ایجاد می‌کند.",
  },
  {
    question: "با خرید اشتراک چه امکاناتی دریافت می‌کنیم؟",
    answer:
      "با خرید اشتراک پلاس، به مدل‌های پیشرفته، اعتبار بیشتر و امکانات ویژه در زمینه‌های ریاضیات، برنامه نویسی و ویرایش متون دسترسی خواهید داشت.",
  },
  {
    question:
      "با خرید اشتراک سپهر AI از تمام امکانات اشتراک پلاس شرکت OpenAI بهره‌مند میشوم؟",
    answer:
      "خیر، هر سرویس امکانات و ویژگی‌های منحصر به فرد خود را دارد. برای اطلاعات دقیق به صفحه پلن‌ها مراجعه کنید.",
  },
  {
    question: "آیا میتوانم اشتراک خود را با دوستانم به اشتراک بگذارم؟",
    answer:
      "بله. منتها بسته به اعتبار اکانت شما تعداد کاربر های همزمانی که از سرویس استفاده میکنن محدود میشوند.",
  },
  {
    question: "توکن چیه و چجوری محاسبه میشه؟",
    answer:
      "توکن واحد اندازه‌گیری مصرف مدل‌های زبانی است که بر اساس تعداد کاراکترها و واژگان محاسبه می‌شود.",
  },
  {
    question: "حالت استدلال منطقی با حالت عادی چه فرقی داره؟",
    answer:
      "حالت استدلال منطقی برای تحلیل عمیق‌تر مسائل طراحی شده و نسبت به حالت عادی دقت و کارایی بیشتری دارد.",
  },
  {
    question: "چه افزونه‌هایی در اشتراک ارائه میشود؟",
    answer:
      "اشتراک پلاس شامل افزونه‌های متنوعی برای بهبود تجربه کاربری، برنامه نویسی و ریاضیات است.",
  },
  {
    question: "برای کودکان مناسبه؟",
    answer:
      "سرویس ما برای تمام سنین مناسب است، اما توصیه می‌شود کودکان تحت نظارت والدین از آن استفاده کنند.",
  },
  {
    question: "چطور کار میکنه؟",
    answer:
      "سپهر AI با استفاده از مدل‌های پیشرفته و زیرساخت‌های امن، خدماتی در زمینه‌های ریاضیات، برنامه نویسی و ویرایش متون ارائه می‌دهد.",
  },
  {
    question: "همه چیز بلده؟",
    answer:
      "مدل‌های ما توانایی پردازش و تحلیل اطلاعات در حوزه‌های مختلف را دارند اما ممکن است در برخی موارد محدودیت‌هایی وجود داشته باشد.",
  },
  {
    question: "بعضی اوقات سرعت خیلی افت میکنه",
    answer:
      "ممکن است به دلیل ترافیک بالا یا مشکلات موقتی سرور باشد. لطفاً کمی صبر کنید یا به صفحه وضعیت سرور مراجعه کنید.",
  },
  {
    question: "چطور میتونم از طریق هوش مصنوعی کسب درآمد کنم؟",
    answer:
      "با استفاده از مدل‌های ما می‌توانید برنامه‌ها و خدماتی را توسعه دهید که از هوش مصنوعی بهره می‌برند و به این ترتیب درآمد کسب کنید. برای اطلاعات بیشتر به بخش راهنمای کسب درآمد مراجعه کنید.",
  },
];

export default async function Home() {
  const plans = await getWebPlans();
  const modelsForPlanComparison = await getModelsForPlanComparison();

  return (
    <>
      <Head>
        <meta name="robots" content="nofollow" />
        <meta name="google" content="notranslate" />
      </Head>

      {/* Main Container */}
      <div className="min-h-screen w-full" dir="rtl">
        {/* Header (with collapsible menu) */}
        <header className="bg-black py-4">
          <div className="mx-auto px-6 flex items-center text-white relative">
            {/* Logo / Icon */}
            <Icon fill="#fff" className="flex-none h-[inherit] max-h-[8dvh]" />

            <div className="flex-auto"></div>

            {/* Hidden checkbox to toggle mobile nav */}
            <input
              type="checkbox"
              id="menuToggle"
              className="peer hidden"
              aria-label="Toggle navigation menu"
            />

            {/* Hamburger icon (visible on mobile) */}
            <label
              htmlFor="menuToggle"
              className="flex-none ml-auto md:hidden block text-2xl cursor-pointer"
            >
              <FaBars />
            </label>

            {/* Navigation */}
            <nav
              className={`
                hidden
                peer-checked:flex    /* Show menu when checkbox is checked */
                flex-col
                absolute
                top-full
                left-0
                w-full
                bg-black
                text-white
                md:static
                md:flex
                md:flex-row
                md:w-auto
                z-50
                items-center
                shadow-lg
                shadow-amber-50
                md:shadow-none
              `}
            >
              <ul className="flex flex-col gap-4 md:flex-row md:space-x-6 p-4 md:p-0">
                <li className="flex items-center gap-2 mb-2 md:mb-0">
                  <FaRegUser />
                  <Link
                    href="/auth"
                    className="hover:text-gray-300 transition-colors"
                  >
                    ورود / ثبت‌نام
                  </Link>
                </li>
                <li className="flex items-center gap-2 mb-2 md:mb-0">
                  <TfiMoney />
                  <a
                    href="#pricing"
                    className="hover:text-gray-300 transition-colors"
                  >
                    قیمت گذاری
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <TbInfoHexagon />
                  <a
                    href="#faq"
                    className="hover:text-gray-300 transition-colors"
                  >
                    سوالات متداول
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section id="hero" className="bg-black text-white py-16 text-center">
          <div className="container mx-auto px-6">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
              تجربه‌ی نوین مدل‌های هوش مصنوعی
            </h1>
            <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto">
              مدل های هوش مصنوعی مختلف از جمله دیپ‌سیک، چت‌جی‌پی‌تی، کلاد، و...
            </p>
            <Link
              href="/auth"
              className="inline-block bg-white text-black font-semibold py-4 px-10 rounded-full text-xl transition-transform hover:scale-105 hover:shadow-lg"
            >
              شروع کنید
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-white text-black py-16">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-4">
              ویژگی‌های منحصربه‌فرد
            </h2>
            <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
              سپهر AI بهترین ابزارها و مدل‌های هوش مصنوعی را برای کاربردهای
              متنوع در اختیار شما قرار می‌دهد.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1: Advanced AI Models */}
              <div className="p-6 bg-gray-50 rounded-xl shadow hover:shadow-md transition-shadow text-center">
                <div className="flex justify-center mb-4">
                  <FaLayerGroup className="w-12 h-12 text-black" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">مدل‌های پیشرفته</h3>
                <p className="text-gray-700">
                  دسترسی به آخرین مدل‌های هوش مصنوعی برای پردازش زبان، تحلیل
                  داده و سایر نیازها.
                </p>
              </div>
              {/* Feature 2: Smart Solutions */}
              <div className="p-6 bg-gray-50 rounded-xl shadow hover:shadow-md transition-shadow text-center">
                <div className="flex justify-center mb-4">
                  <FaCalculator className="w-12 h-12 text-black" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">
                  راهکارهای هوشمند
                </h3>
                <p className="text-gray-700">
                  از تحلیل دقیق داده تا پیش‌بینی‌های هوشمند، راهکارهایی که کسب و
                  کار شما را متحول می‌کند.
                </p>
              </div>
              {/* Feature 3: Comprehensive Services */}
              <div className="p-6 bg-gray-50 rounded-xl shadow hover:shadow-md transition-shadow text-center">
                <div className="flex justify-center mb-4">
                  <FaCode className="w-12 h-12 text-black" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">خدمات جامع</h3>
                <p className="text-gray-700">
                  از اتوماسیون فرآیندها تا سفارشی‌سازی مدل‌ها، ابزارهای ما همه
                  نیازهای شما را برآورده می‌کند.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="bg-gray-100 text-black py-16">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-4">
              چگونه کار می‌کند؟
            </h2>
            <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
              استفاده از سپهر AI بسیار ساده و سریع است؛ تنها با چند قدم
              می‌توانید به دنیای هوش مصنوعی وارد شوید.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1: Sign Up */}
              <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition-shadow text-center">
                <div className="flex justify-center mb-4">
                  <FaUserPlus className="w-12 h-12 text-black" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">ثبت نام سریع</h3>
                <p className="text-gray-700">
                  با ثبت نام ساده، حساب کاربری خود را بسازید و به سرعت وارد
                  دنیای هوش مصنوعی شوید.
                </p>
              </div>
              {/* Step 2: Choose Your Plan */}
              <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition-shadow text-center">
                <div className="flex justify-center mb-4">
                  <FaLock className="w-12 h-12 text-black" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">
                  انتخاب پلن مناسب
                </h3>
                <p className="text-gray-700">
                  از میان پلن‌های متنوع ما، آنچه بهترین پاسخ به نیاز شماست را
                  انتخاب کنید.
                </p>
              </div>
              {/* Step 3: Start Using AI */}
              <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition-shadow text-center">
                <div className="flex justify-center mb-4">
                  <FaCogs className="w-12 h-12 text-black" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">شروع استفاده</h3>
                <p className="text-gray-700">
                  بلافاصله پس از انتخاب پلن، از مدل‌های هوش مصنوعی برای پروژه‌ها
                  و کسب و کار خود بهره‌مند شوید.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Sepahr AI Section */}
        <section id="why-sepehr-ai" className="bg-white text-black py-16">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-6">
              چرا سپهر AI؟
            </h2>
            <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
              سپهر AI پلی است که با بهره‌گیری از تکنولوژی‌های پیشرفته هوش
              مصنوعی، تجربه‌ای منحصر به‌فرد و کارآمد را برای کاربران فراهم
              می‌کند.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Benefit 1: Cutting-Edge Technology */}
              <div className="p-6 bg-gray-50 rounded-xl shadow hover:shadow-md transition-shadow text-center">
                <div className="flex justify-center mb-4">
                  <GiAtom className="w-12 h-12 text-black" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">تکنولوژی برتر</h3>
                <p className="text-gray-700">
                  استفاده از جدیدترین و به‌روزترین مدل‌های هوش مصنوعی برای ارائه
                  پاسخ‌های دقیق و کاربردی.
                </p>
              </div>
              {/* Benefit 2: Versatility */}
              <div className="p-6 bg-gray-50 rounded-xl shadow hover:shadow-md transition-shadow text-center">
                <div className="flex justify-center mb-4">
                  <IoExtensionPuzzleOutline className="w-12 h-12 text-black" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">
                  انعطاف‌پذیری بالا
                </h3>
                <p className="text-gray-700">
                  ارائه خدمات در حوزه‌های متنوع از پردازش زبان طبیعی تا تحلیل
                  داده، که متناسب با نیازهای هر کاربر تنظیم شده است.
                </p>
              </div>
              {/* Benefit 3: Security & Support */}
              <div className="p-6 bg-gray-50 rounded-xl shadow hover:shadow-md transition-shadow text-center">
                <div className="flex justify-center mb-4">
                  <MdOutlineSecurity className="w-12 h-12 text-black" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">
                  امنیت و پشتیبانی
                </h3>
                <p className="text-gray-700">
                  تضمین حریم خصوصی و امنیت داده‌های شما همراه با پشتیبانی برای
                  رفع مشکلات و ارائه مشاوره.
                </p>
              </div>
            </div>
            <div className="mt-12 text-center">
              <p className="text-gray-700 max-w-3xl mx-auto">
                سپهر AI با تکیه بر تجربه، نوآوری و تعهد به کیفیت، همراه شماست تا
                دنیای هوش مصنوعی را به شیوه‌ای امن، کاربردی و قابل دسترس به شما
                ارائه دهد.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-gray-100 text-black py-16">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-12">پلن ها</h2>
            <div className="flex flex-col md:flex-row justify-center items-stretch gap-8">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className="flex-1 bg-white px-6 py-10 rounded-xl shadow hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-2xl font-semibold mb-4 text-center">
                    {plan.name}
                  </h3>
                  <p className="text-xl text-gray-700 mb-4 text-center">
                    <span>{plan.displayPrice} تومان/ماه</span>
                  </p>
                  <ul className="text-gray-700 mb-6 space-y-2 text-sm text-center">
                    <li>دسترسی به مدل‌های اصلی</li>
                    <li>امکانات پیشرفته برای ریاضیات و برنامه نویسی</li>
                    <li>
                      <span>{plan.credits} </span>
                      <span>اعتبار</span>
                    </li>
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
                        <li key={idx}>
                          <p>
                            <span>معادل: </span>
                            <span>{model.name}</span>
                          </p>
                          <p>
                            <span>{inputTokens.toLocaleString()} </span>
                            <span>توکن ورودی</span>
                          </p>
                          <span>{outputTokens.toLocaleString()} </span>
                          <span>توکن خروجی</span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="text-center">
                    <Link
                      href={`/auth?selectedPlan=${plan.id}`}
                      className="inline-block bg-black text-white py-3 px-8 rounded-full text-lg font-medium transition-colors hover:bg-gray-800"
                    >
                      خرید اشتراک
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="bg-white text-black py-16">
          <div className="container mx-auto max-w-[90%]">
            <FAQAccordion items={faqItems} />
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="bg-black text-white py-16">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6">تماس با ما</h2>
            <p className="text-xl mb-4">
              برای اطلاعات بیشتر از طریق ایمیل با ما در ارتباط باشید:{" "}
              <a
                href="mailto:info@sepehr-ai.com"
                className="underline hover:text-gray-300"
              >
                info@sepehr-ai.com
              </a>
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-black text-white py-8 flex">
          <div className="flex-1 flex justify-center">
            <Enamad />
          </div>
          <div className="flex-1 flex flex-col container mx-auto px-6 text-center">
            <div className="flex-auto"></div>
            <p className="flex-none text-sm">
              &copy; 2025 سپهر AI. کلیه حقوق محفوظ است.
            </p>
            <div className="flex-none flex justify-center space-x-6 mt-4">
              <a
                href="#"
                className="text-white hover:text-gray-300 transition-colors"
              >
                <FaFacebookF className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-white hover:text-gray-300 transition-colors"
              >
                <FaTwitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-white hover:text-gray-300 transition-colors"
              >
                <FaInstagram className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div className="flex-1"></div>
        </footer>
      </div>
    </>
  );
}
