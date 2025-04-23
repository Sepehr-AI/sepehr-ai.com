import Head from "next/head";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { ToastContainer } from "react-toastify";
import ThemeProvider from "@/components/ThemeProvider";

import "@radix-ui/themes/styles.css";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";

const vazir = localFont({
  src: [
    {
      path: "./fonts/Vazir-Thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/Vazir-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/Vazir.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Vazir-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Vazir-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  preload: true,
  variable: "--font-vazir",
});

// const vazirFarsiDigits = localFont({
//   src: [
//     {
//       path: "./fonts/Farsi-Digits-Without-Latin/Vazir-Thin-FD-WOL.woff2",
//       weight: "100",
//       style: "normal",
//     },
//     {
//       path: "./fonts/Farsi-Digits-Without-Latin/Vazir-Light-FD-WOL.woff2",
//       weight: "300",
//       style: "normal",
//     },
//     {
//       path: "./fonts/Farsi-Digits-Without-Latin/Vazir-FD-WOL.woff2",
//       weight: "400",
//       style: "normal",
//     },
//     {
//       path: "./fonts/Farsi-Digits-Without-Latin/Vazir-Medium-FD-WOL.woff2",
//       weight: "500",
//       style: "normal",
//     },
//     {
//       path: "./fonts/Farsi-Digits-Without-Latin/Vazir-Bold-FD-WOL.woff2",
//       weight: "700",
//       style: "normal",
//     },
//   ],
//   variable: "--font-vazir-fd",
// });

export const metadata: Metadata = {
  title: "سپهر AI | تجربه نوین هوش مصنوعی",
  description:
    "دسترسی سریع و امن به بیش از ۲۴۰ مدل هوش مصنوعی پیشرفته برای تولید محتوا، برنامه‌نویسی، بازاریابی و تحلیل داده در پلتفرم یکپارچه سپهر AI.",
  keywords: [
    // Farsi
    "سپهر هوش مصنوعی",
    "هوش مصنوعی سپهر",
    "هوش مصنوعی",
    "پلتفرم هوش مصنوعی",
    "مدل‌های هوش مصنوعی",
    "مدل‌های GPT",
    "تولید محتوا هوش مصنوعی",
    "برنامه‌نویسی با AI",
    "بازاریابی هوش مصنوعی",
    "تحلیل داده با AI",
    "دستیار هوش مصنوعی",
    "AI ابری",
    "بهترین پلتفرم هوش مصنوعی فارسی",
    "دسترسی به مدل‌های GPT رایگان",
    "آموزش تولید محتوا با هوش مصنوعی",
    "ابزار ترجمه هوش مصنوعی فارسی",
    "تولید عکس با هوش مصنوعی",
    "قیمت‌گذاری مدل‌های AI",
    "مقایسه پلن‌های هوش مصنوعی",
    "راه‌اندازی کسب‌وکار با AI",
    "API هوش مصنوعی برای توسعه‌دهندگان",
    "امنیت داده‌ها در AI",

    // English
    "Artificial Intelligence",
    "Machine Learning",
    "Deep Learning",
    "Natural Language Processing",
    "AI Platform",
    "AI Models",
    "Generative AI",
    "AI Content Generation",
    "AI Marketing Tools",
    "AI Data Analytics",
    "Best AI content generator tools",
    "AI SEO optimization techniques",
    "Conversational AI chatbots",
    "Cloud AI services comparison",
    "AI-powered translation API",
    "AI code debugging assistant",
    "Privacy-aware AI platform",
    "Scalable AI inference models",
    "Real-time AI analytics dashboard",
    "Enterprise AI solutions",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fa-IR" dir="rtl">
      <Head>
        <meta name="robots" content="nofollow" />
        <meta name="google" content="notranslate" key="notranslate" />
        <meta name="google" content="nositelinkssearchbox" key="sitelinks" />
      </Head>
      <body className={vazir.variable}>
        <ToastContainer toastClassName="font-vazir-force text-center" />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
