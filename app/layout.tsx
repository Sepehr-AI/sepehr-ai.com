import "./globals.css";

import Head from "next/head";
import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

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
  title: "سپهر AI",
  description: "تجربه نوین مدل های هوش مصنوعی با سپهر AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="fa-IR"
      // dir="rtl"
    >
      <Head>
        <title>سپهر AI - تجربه‌ی نوین هوش مصنوعی</title>
        <meta
          name="description"
          content="تجربه نوین مدل های هوش مصنوعی با سپهر AI."
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <body className={vazir.variable}>
        <ToastContainer toastClassName="font-vazir-force text-center" />
        {children}
      </body>
    </html>
  );
}
