import prisma from "@/lib/prisma";
import type { Faq } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export type FaqsForLandingPage = (Pick<Faq, "title" | "description"> &
  Partial<Faq>)[];

export const getFaqs: () => Promise<FaqsForLandingPage> = unstable_cache(
  () =>
    prisma.faq.findMany({
      orderBy: { id: "asc" },
      select: {
        title: true,
        description: true,
      },
    }) || [],
  ["faqs"],
  { revalidate: 60 * 60 * 24 },
);
