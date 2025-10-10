"use server";

import Head from "next/head";
import ThemeProvider from "@/components/ThemeProvider";

import SiteHeader from "@/components/landing/SiteHeader";
import SiteFooter from "@/components/landing/SiteFooter";
import HeroSection from "@/components/landing/HeroSection";
import ShowcaseSlideshow from "@/components/landing/ShowcaseSlideshow";
import ModelShowcase from "@/components/landing/ModelShowcase";
import PricingSection from "@/components/landing/PricingSection";
import FaqSection from "@/components/landing/FaqSection";
import CallToAction from "@/components/landing/CallToAction";

import { getFaqs } from "@/lib/faqs";
import { getWebPlans } from "@/lib/plans";

import {
  getLanguageModelsForWeb,
  getWebLanguageModelsLength,
} from "@/lib/languageModels";
import {
  getImageModelsForWeb,
  getWebImageModelsLength,
} from "@/lib/imageModels";
import {
  getVideoModelsForWeb,
  getWebVideoModelsLength,
} from "@/lib/videoModels";

export default async function Home() {
  const [faqs, plans] = await Promise.all([getFaqs(), getWebPlans()]);
  const [langModels, imgModels, vidModels, langCount, imgCount, vidCount] =
    await Promise.all([
      getLanguageModelsForWeb(),
      getImageModelsForWeb(),
      getVideoModelsForWeb(),
      getWebLanguageModelsLength(),
      getWebImageModelsLength(),
      getWebVideoModelsLength(),
    ]);

  const totalModels = langCount + imgCount + vidCount;

  function addJsonLd() {
    // Offers remain in IRR; adjust if you ever support multiple currencies
    const offers = plans
      .map(
        (plan) =>
          `{
            "@type": "Offer",
            "name": "${plan.name}",
            "url": "https://sepehr-ai.com/#pricing",
            "priceCurrency": "IRR",
            "price": "${plan.price}",
            "availability": "https://schema.org/InStock"
          }`,
      )
      .join(",");

    return {
      __html: `{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": "https://sepehr-ai.com/#website",
            "url": "https://sepehr-ai.com/",
            "name": "سپهر AI",
            "description": "پلتفرم چندوجهی هوش مصنوعی: زبان، تصویر و ویدیو."
          },
          {
            "@type": "SoftwareApplication",
            "@id": "https://sepehr-ai.com/#app",
            "name": "سپهر AI",
            "url": "https://sepehr-ai.com/",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "All",
            "description": "دسترسی به ${totalModels}+ مدل زبان، تصویر و ویدیو در یک پلتفرم واحد.",
            "offers": [${offers}],
            "provider": {
              "@type": "Organization",
              "name": "سپهر AI",
              "url": "https://sepehr-ai.com/"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "مدل‌ها",
              "itemListElement": [
                { "@type": "OfferCatalog", "name": "مدل‌های زبانی", "numberOfItems": ${langCount} },
                { "@type": "OfferCatalog", "name": "مدل‌های تصویر", "numberOfItems": ${imgCount} },
                { "@type": "OfferCatalog", "name": "مدل‌های ویدیو", "numberOfItems": ${vidCount} }
              ]
            }
          }
        ]
      }`,
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
            <HeroSection
              totalModels={totalModels}
              langCount={langCount}
              imgCount={imgCount}
              vidCount={vidCount}
            />

            <ShowcaseSlideshow
              imageModels={imgModels}
              videoModels={vidModels}
            />

            {/* New multi-modal showcase */}
            <ModelShowcase
              languageModels={langModels}
              imageModels={imgModels}
              videoModels={vidModels}
            />

            <PricingSection
              plans={plans}
              modelsForComparison={langModels.slice(0, 6)}
              imageModelsForComparison={imgModels.slice(0, 6)}
              videoModelsForComparison={vidModels.slice(0, 6)}
            />

            <FaqSection faqs={faqs} />

            <CallToAction />
          </main>

          <SiteFooter />
        </div>
      </ThemeProvider>
    </>
  );
}
