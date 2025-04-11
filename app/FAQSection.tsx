"use client";

import { useState } from "react";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

export default function FAQSection({
  items,
}: {
  items: { title: string; description: string }[];
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="max-w-3xl mx-auto divide-y divide-gray-200">
      {items.map((item, index) => (
        <div key={index} className="py-6">
          <button
            onClick={() => toggleFAQ(index)}
            className="flex w-full justify-between items-center text-left"
          >
            <h4 className="text-lg font-medium">{item.title}</h4>
            <span className="ml-4 flex-shrink-0 text-emerald-500">
              {activeIndex === index ? <IoIosArrowUp /> : <IoIosArrowDown />}
            </span>
          </button>

          {activeIndex === index && (
            <div className="mt-4 text-gray-600 pr-6 leading-relaxed">
              {item.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
