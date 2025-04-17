"use server";

import Head from "next/head";
import { Suspense } from "react";
import { getFaqs } from "@/lib/faqs";
import { getWebPlans } from "@/lib/plans";
import ThemeProvider from "@/components/ThemeProvider";
import HowItWorks from "@/components/landing/HowItWorks";
import SiteHeader from "@/components/landing/SiteHeader";
import FaqSection from "@/components/landing/FaqSection";
import SiteFooter from "@/components/landing/SiteFooter";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import CallToAction from "@/components/landing/CallToAction";
import ModelShowcase from "@/components/landing/ModelShowcase";
import PricingSection from "@/components/landing/PricingSection";
import { getModelsForPlanComparison, getWebModelsLength } from "@/lib/models";

export default async function Home() {
  const faqs = await getFaqs();
  const plans = await getWebPlans();
  const modelsForPlanComparison = await getModelsForPlanComparison();
  const numberOfWebPlans = Math.ceil((await getWebModelsLength()) / 10) * 10;

  function addJsonLd() {
    return {
      __html: `{
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": "https://sepehr-ai.com/#website",
          "url": "https://sepehr-ai.com/",
          "name": "سپهر AI",
          "description": "دسترسی سریع و امن به بیش از ۲۴۰ مدل هوش مصنوعی پیشرفته برای تولید محتوا، برنامه‌نویسی، بازاریابی و تحلیل داده در پلتفرم یکپارچه سپهر AI."
        },
        {
          "@type": "SoftwareApplication",
          "@id": "https://sepehr-ai.com/#app",
          "name": "سپهر AI",
          "url": "https://sepehr-ai.com/",
          "description": "پلتفرم ابری مبتنی بر هوش مصنوعی برای تولید محتوا، برنامه‌نویسی، بازاریابی و تحلیل داده با بیش از ۲۴۰ مدل آماده.",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "All",
          "offers": [${plans.map(
            (plan) =>
              `
              {
                "@type": "Offer",
                "name": "${plan.name}",
                "url": "https://sepehr-ai.com/#pricing",
                "priceCurrency": "IRR",
                "price": "${plan.price}",
                "availability": "https://schema.org/InStock"
              }`,
          )}
          ],
          "provider": {
            "@type": "Organization",
            "name": "سپهر AI",
            "url": "https://sepehr-ai.com/"
          }
        }
      ]
    }
  `,
    };
  }

  return (
    <>
      <Head>
        <script
          key="product-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={addJsonLd()}
        />
      </Head>
      <ThemeProvider>
        <div className="min-h-screen bg-background text-foreground" dir="rtl">
          <SiteHeader />

          <main>
            <HeroSection numberOfWebPlans={numberOfWebPlans} />
            <FeaturesGrid />
            <ModelShowcase numberOfWebPlans={numberOfWebPlans} />
            <HowItWorks />

            <Suspense
              fallback={
                <div className="py-20 text-center">
                  Loading pricing plans...
                </div>
              }
            >
              <PricingSection
                plans={plans}
                modelsForComparison={modelsForPlanComparison}
              />
            </Suspense>

            <Suspense
              fallback={
                <div className="py-20 text-center">Loading FAQs...</div>
              }
            >
              <FaqSection faqs={faqs} />
            </Suspense>

            <CallToAction />
          </main>
          <SiteFooter />
        </div>
      </ThemeProvider>
    </>
  );
}
