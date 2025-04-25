"use client";

import { useInView } from "react-intersection-observer";
import {
  RocketIcon,
  LightningBoltIcon,
  LockClosedIcon,
  ChatBubbleIcon,
  CodeIcon,
  PieChartIcon,
} from "@radix-ui/react-icons";

const features = [
  {
    icon: <RocketIcon className="w-6 h-6" />,
    title: "سریع و قدرتمند",
    description: "دسترسی آنی به قدرتمندترین مدل‌های هوش مصنوعی روز دنیا",
  },
  {
    icon: <LightningBoltIcon className="w-6 h-6" />,
    title: "یکپارچه و منعطف",
    description: "همه مدل‌ها در یک پلتفرم واحد با رابط کاربری یکسان",
  },
  {
    icon: <LockClosedIcon className="w-6 h-6" />,
    title: "ایمن و حامی حریم خصوصی",
    description:
      "ما سوابق چت های شما را فقط و فقط در مرورگر خودتان ذخیره میکنیم",
  },
  {
    icon: <ChatBubbleIcon className="w-6 h-6" />,
    title: "تولید محتوا",
    description: "نوشتن متن، ترجمه، خلاصه‌سازی و ویرایش با کیفیت بالا",
  },
  {
    icon: <CodeIcon className="w-6 h-6" />,
    title: "توسعه نرم‌افزار",
    description: "نوشتن، اشکال‌زدایی و بهینه‌سازی کد برای زبان‌های مختلف",
  },
  {
    icon: <PieChartIcon className="w-6 h-6" />,
    title: "تحلیل داده",
    description: "استخراج بینش‌های عمیق از داده‌ها با ابزارهای پیشرفته",
  },
];

export default function FeaturesGrid() {
  const { ref, inView } = useInView({});

  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">ویژگی‌های برتر</h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            سپهر AI تجربه‌ای یکپارچه از پیشرفته‌ترین مدل‌های هوش مصنوعی را برای
            انواع کاربردها فراهم می‌کند
          </p>
        </div>

        <div
          className="grid grid-cols-1 mx-auto md:grid-cols-2 lg:grid-cols-3 gap-8"
          ref={ref}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              data-variant={index * 0.2}
              className={
                "bg-card p-6 rounded-xl border border-border hover:shadow-md transition-shadow opacity-0" +
                (inView ? " features-animation" : "")
              }
            >
              <div className="w-full flex justify-center">
                <div className="bg-accent/10 p-3 rounded-full w-fit mb-4">
                  <div className="text-accent">{feature.icon}</div>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">
                {feature.title}
              </h3>
              <p className="text-foreground/70 text-center">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
