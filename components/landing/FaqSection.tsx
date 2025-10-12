"use client";

import type { FaqsForLandingPage } from "@/lib/faqs";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { useInView } from "react-intersection-observer";

export default function FaqSection({ faqs }: { faqs: FaqsForLandingPage }) {
  const { ref, inView } = useInView({});

  return (
    <section id="faq" className="py-20 bg-muted/30" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">سوالات متداول</h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            پاسخ سوالات رایج شما درباره سپهر AI و خدمات آن
          </p>
        </div>

        <div className={`max-w-3xl mx-auto` + (inView ? " faq-animation" : "")}>
          <Accordion.Root type="multiple" className="space-y-4">
            {faqs.map((faq, index) => (
              <Accordion.Item
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-xl overflow-hidden border border-border"
              >
                <Accordion.Trigger className="group flex w-full items-center justify-between px-6 py-4 text-right text-lg font-medium transition-all hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
                  {faq.title}
                  <ChevronDownIcon className="h-5 w-5 text-accent transition-transform duration-300" />
                </Accordion.Trigger>
                <Accordion.Content className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
                  <div className="px-6 py-4 text-foreground/80">
                    {faq.description}
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </div>
    </section>
  );
}
