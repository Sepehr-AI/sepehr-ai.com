"use client";

import { useState } from "react";
import { FaQuestionCircle } from "react-icons/fa";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export default function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndices, setOpenIndices] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-gray-50 rounded-xl shadow hover:shadow-md p-6 transition-shadow"
        >
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => toggleItem(index)}
          >
            <FaQuestionCircle className="w-6 h-6 text-black" />
            <h3 className="text-base md:text-xl">{item.question}</h3>
          </div>
          {openIndices.includes(index) && (
            <p className="text-gray-700 mt-4">{item.answer}</p>
          )}
        </div>
      ))}
    </div>
  );
}
