"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import * as Separator from "@radix-ui/react-separator";

export default function HeroSection({
  numberOfWebPlans,
}: {
  numberOfWebPlans: number;
}) {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden" id="hero">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-600">
              دنیای هوش مصنوعی
            </span>{" "}
            در دستان شما
          </h1>

          <p className="text-lg md:text-xl mb-8 text-foreground/80 mx-auto max-w-2xl">
            دسترسی به بیش از {numberOfWebPlans} مدل هوش مصنوعی پیشرفته برای
            محتوا، برنامه‌نویسی، بازاریابی و صدها کاربرد دیگر، همه در یک پلتفرم
            یکپارچه
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/auth"
              className="bg-accent hover:bg-accent/90 text-white px-8 py-3 rounded-full font-medium transition-colors"
            >
              شروع کنید
            </Link>

            <Link
              href="#how-it-works"
              className="px-8 py-3 rounded-full font-medium border border-border hover:bg-accent/10 transition-colors"
            >
              بیشتر بدانید
            </Link>
          </div>

          <Separator.Root className="bg-border h-px w-16 mx-auto my-12" />

          <div className="flex flex-wrap justify-center gap-6 text-sm text-foreground/60">
            <span>Grok 3</span>
            <span>GPT-4</span>
            <span>Claude 3</span>
            <span>Gemini</span>
            <span>Llama 3</span>
            <span>+ {numberOfWebPlans} مدل دیگر</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
