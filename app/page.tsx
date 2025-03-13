"use server";

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
  FaQuestionCircle,
} from "react-icons/fa";

export default async function Home() {
  const plans = await getWebPlans();
  const modelsForPlanComparison = await getModelsForPlanComparison();

  return (
    <>
      <Head>
        <title>آیار - تجربه‌ی نوین مدل‌های زبانی</title>
        <meta
          name="description"
          content="پرداخت و استفاده از هر مدل زبانی موجود برای ریاضیات و برنامه نویسی. آیار تجربه‌ای نوین در دنیای هوش مصنوعی ارائه می‌دهد."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="bg-white text-gray-900 min-h-dvh w-[inherit]" dir="rtl">
        {/* Header */}
        <header className="bg-white shadow-md">
          <div className="container mx-auto px-6 py-6 flex justify-between items-center">
            <div className="text-3xl font-bold text-gray-600">آیار</div>
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <Link
                    href="/auth"
                    className="hover:text-gray-500 transition-colors"
                  >
                    ورود / ثبت‌نام
                  </Link>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-gray-500 transition-colors"
                  >
                    قیمت گذاری
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="hover:text-gray-500 transition-colors"
                  >
                    سوالات متداول
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section
          id="hero"
          className="bg-gradient-to-br from-gray-300 to-gray-100 py-5 md:py-10 lg:py-12.5 xl:py20 text-center"
        >
          <div className="container mx-auto px-6">
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-700 mb-6 drop-shadow-lg">
              تجربه‌ی نوین مدل‌های زبانی
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-10">
              مدل های زبانی هوش مصنوعی موجود برای ریاضیات، برنامه نویسی،
              ویراستاری، و...
            </p>
            <Link
              href="/auth"
              className="inline-block bg-gray-600 text-white py-4 px-10 rounded-full text-xl font-semibold transition-transform transform hover:scale-105 hover:shadow-2xl animate-pulse"
            >
              شروع کنید
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="mt-15 pb-5 md:mt-10 md:pb-10 lg:py-12.5"
        >
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-12">
              ویژگی‌های برجسته
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 lg:gap-6">
              {/* Feature 1 */}
              <div className="p-2 md:p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow">
                <div className="flex justify-center mb-4">
                  <FaLayerGroup className="w-12 h-12 text-gray-600" />
                </div>
                <h3 className="text-2xl font-semibold mb-2 text-center">
                  مدل‌های متنوع
                </h3>
                <p className="text-gray-600 text-center">
                  دسترسی به بهترین مدل‌های زبانی برای نیازهای مختلف شما.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="p-2 md:p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow">
                <div className="flex justify-center mb-4">
                  <FaCalculator className="w-12 h-12 text-gray-600" />
                </div>
                <h3 className="text-2xl font-semibold mb-2 text-center">
                  محاسبه فیزیک و ریاضیات
                </h3>
                <p className="text-gray-600 text-center">
                  حل و تحلیل مسائل ریاضی و فیزیک با دقت بالا.
                </p>
              </div>
              {/* Feature 3 */}
              <div className="p-2 md:p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow">
                <div className="flex justify-center mb-4">
                  <FaCode className="w-12 h-12 text-gray-600" />
                </div>
                <h3 className="text-2xl font-semibold mb-2 text-center">
                  برنامه نویسی پیشرفته
                </h3>
                <p className="text-gray-600 text-center">
                  دیباگینگ و دولاپ برنامه‌نویسی با زبان های مختلف.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-15 xl:py20 bg-gray-50">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-12">
              نحوه کار آیار
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 lg:gap-6">
              {/* Step 1: Sign Up */}
              <div className="p-2 md:p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow">
                <div className="flex justify-center mb-4">
                  <FaUserPlus className="w-12 h-12 text-gray-600" />
                </div>
                <h3 className="text-2xl font-semibold mb-2 text-center">
                  ثبت نام
                </h3>
                <p className="text-gray-600 text-center">
                  با ثبت نام در آیار، به دنیای هوش مصنوعی وارد شوید.
                </p>
              </div>
              {/* Step ۲: Secure Payment */}
              <div className="p-2 md:p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow">
                <div className="flex justify-center mb-4">
                  <FaLock className="w-12 h-12 text-gray-600" />
                </div>
                <h3 className="text-2xl font-semibold mb-2 text-center">
                  پرداخت امن
                </h3>
                <p className="text-gray-600 text-center">
                  از درگاه‌های امن برای خرید اشتراک خود استفاده کنید.
                </p>
              </div>
              {/* Step ۳: Choose Model */}
              <div className="p-2 md:p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow">
                <div className="flex justify-center mb-4">
                  <FaCogs className="w-12 h-12 text-gray-600" />
                </div>
                <h3 className="text-2xl font-semibold mb-2 text-center">
                  انتخاب مدل و شروع
                </h3>
                <p className="text-gray-600 text-center">
                  مدل مناسب را برای ریاضیات و برنامه نویسی انتخاب کنید.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-5 md:py-10 lg:py-12.5 xl:py20">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-12">چرا آیار؟</h2>
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-gray-700 mb-6">
                آیار با ارائه بهترین مدل‌های زبانی، تجربه‌ای بی‌نظیر از هوش
                مصنوعی را برای شما فراهم می‌کند. تمرکز ویژه ما بر روی کاربردهای
                ریاضی و برنامه نویسی، محیطی امن و کارآمد را برای توسعه
                مهارت‌هایتان تضمین می‌کند.
              </p>
              <p className="text-gray-700">
                از ثبت نام ساده تا پرداخت امن و دسترسی به مدل‌های پیشرفته، همه
                چیز در آیار برای راحتی شما طراحی شده است.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-15 xl:py20 bg-gray-50">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-12">قیمت گذاری شفاف</h2>
            <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-4 lg:gap-6">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className="p-2 md:p-4 rounded-xl transition-transform transform hover:scale-105 flex-1 shadow-xl hover:shadow-2xl shadow-gray-700"
                >
                  <h3 className="text-2xl font-semibold mb-4">{plan.name}</h3>
                  <p className="text-xl text-gray-600 mb-4">
                    <span>{plan.displayPrice + " "}</span>
                    <span>تومان/ماه</span>
                  </p>
                  <ul className="text-gray-600 mb-6 space-y-2 text-sm">
                    <li>دسترسی به مدل‌های اصلی</li>
                    <li>امکانات پیشرفته برای ریاضیات و برنامه نویسی</li>
                    <li>
                      <span>{plan.credits + " "}</span>
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
                            <span>{inputTokens.toLocaleString() + " "}</span>
                            <span>توکن ورودی</span>
                          </p>
                          <span>{outputTokens.toLocaleString() + " "}</span>
                          <span>توکن خروجی</span>
                        </li>
                      );
                    })}
                  </ul>
                  <Link
                    href={`/auth?selectedPlan=${plan.id}`}
                    className="inline-block bg-gray-600 text-white py-3 px-8 rounded-full text-lg font-medium transition-colors hover:bg-gray-700"
                  >
                    خرید اشتراک
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-15 xl:py20 bg-gray-50">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-12">
              سوالات متداول
            </h2>
            <div className="space-y-2 lg:space-y-6 max-w-3xl mx-auto">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center mb-4 gap-2">
                  <FaQuestionCircle className="w-8 h-8 text-gray-600 mr-4" />
                  <h3 className="text-2xl font-semibold">
                    آیا پرداخت های آیار امن هستند؟
                  </h3>
                </div>
                <p className="text-gray-600">
                  بله، تمامی پرداخت‌ها از طریق درگاه‌های امن انجام می‌شود.
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center mb-4 gap-2">
                  <FaQuestionCircle className="w-8 h-8 text-gray-600 mr-4" />
                  <h3 className="text-2xl font-semibold">
                    چگونه می‌توانم ثبت نام کنم؟
                  </h3>
                </div>
                <p className="text-gray-600">
                  شما می‌توانید با کلیک بر روی دکمه `شروع کنید` در بخش خانه، ثبت
                  نام را آغاز کنید.
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center mb-4 gap-2">
                  <FaQuestionCircle className="w-8 h-8 text-gray-600 mr-4" />
                  <h3 className="text-2xl font-semibold">
                    چگونه از مدل‌های مختلف استفاده کنم؟
                  </h3>
                </div>
                <p className="text-gray-600">
                  پس از ثبت نام و انتخاب مدل مناسب، به راحتی می‌توانید از آن‌ها
                  بهره ببرید.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-5 md:py-10 lg:py-12.5 xl:py20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6">تماس با ما</h2>
            <p className="text-xl text-gray-700 mb-4">
              برای اطلاعات بیشتر از طریق ایمیل با ما در ارتباط باشید:
              info@ayar.com
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-100 py-8">
          <div className="container mx-auto px-6 text-center">
            <p className="text-gray-600">
              &copy; 2025 آیار. کلیه حقوق محفوظ است.
            </p>
            <div className="flex justify-center space-x-4 mt-4">
              <a
                href="#"
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <FaFacebookF className="w-6 h-6" />
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <FaTwitter className="w-6 h-6" />
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <FaInstagram className="w-6 h-6" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
