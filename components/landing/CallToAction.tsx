"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function CallToAction() {
  return (
    <section className="py-20 bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-card border border-border rounded-2xl p-8 md:p-12 max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            همین امروز شروع کنید
          </h2>
          <p className="text-xl text-foreground/70 mb-8 max-w-xl mx-auto">
            به جمع هزاران کاربر سپهر AI بپیوندید و از قدرت هوش مصنوعی در
            کسب‌وکار و زندگی خود بهره ببرید
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth"
              className="bg-accent hover:bg-accent/90 text-white px-8 py-3 rounded-full font-medium transition-colors"
            >
              ثبت‌نام
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
