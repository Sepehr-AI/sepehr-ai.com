import { MotionDiv } from "../dynamicMotion";

const TELEGRAM_SUPPORT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT_USERNAME || "example";

export default function CallToAction() {
  return (
    <section className="py-20 bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
      <div className="container mx-auto px-4">
        <MotionDiv
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-card border border-border rounded-2xl p-8 md:p-12 max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ارتباط با پشتیبانی
          </h2>
          <p className="text-xl text-foreground/70 mb-8 max-w-xl mx-auto">
            برای کسب اطلاعات بیشتر به پشتیبانی تلگرام ما مراجعه کنید.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="ltr text-left bg-accent hover:bg-accent/90 text-white py-2 px-4 rounded-lg transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
              <a
                target="_blank"
                href={`https://t.me/${TELEGRAM_SUPPORT_USERNAME}`}
              >
                @{TELEGRAM_SUPPORT_USERNAME}
              </a>
            </button>
          </div>
        </MotionDiv>
      </div>
    </section>
  );
}
