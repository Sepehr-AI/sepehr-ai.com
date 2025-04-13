"use client";

import { motion } from "framer-motion";
import {
  PersonIcon,
  MixerHorizontalIcon,
  RocketIcon,
} from "@radix-ui/react-icons";

const steps = [
  {
    icon: <PersonIcon className="w-6 h-6" />,
    title: "ایجاد حساب کاربری",
    description: "ثبت‌نام ساده و سریع با ایمیل یا شبکه‌های اجتماعی",
  },
  {
    icon: <MixerHorizontalIcon className="w-6 h-6" />,
    title: "انتخاب پلن مناسب",
    description: "پلن های مختلف با توجه به نیاز شما",
  },
  {
    icon: <RocketIcon className="w-6 h-6" />,
    title: "آغاز استفاده",
    description: "دسترسی فوری به تمامی مدل‌های هوش مصنوعی",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">چگونه شروع کنیم؟</h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            تنها با سه گام ساده، دنیای هوش مصنوعی را در اختیار بگیرید
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-card p-6 rounded-xl border border-border hover:shadow-md transition-shadow text-center h-full">
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>

                <div className="bg-accent/10 p-3 rounded-full w-fit mx-auto mb-4">
                  <div className="text-accent">{step.icon}</div>
                </div>

                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-foreground/70">{step.description}</p>
              </div>

              {/* {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 left-[-20px] right-[-20px] h-[2px] bg-border">
                  <div className="absolute top-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 rotate-45 border-t-2 border-r-2 border-border"></div>
                </div>
              )} */}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
