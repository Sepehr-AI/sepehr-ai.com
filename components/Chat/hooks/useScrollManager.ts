import { useDebouncedEffect } from "@/hooks/useDebouncedEffects";
import type { UIMessage } from "ai";
import { useEffect, useState, type RefObject } from "react";

export function useScrollManager({
  messages,
  endOfThePageRef,
  messagesContainerRef,
}: {
  messages: UIMessage[];
  endOfThePageRef: RefObject<HTMLDivElement | null>;
  messagesContainerRef: RefObject<HTMLDivElement | null>;
}) {
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToMessageInput = () => {
    const c = endOfThePageRef.current;
    if (!c) return;

    c.scrollIntoView({
      block: "end",
      behavior: "smooth",
    });
  };
  const handleScroll = () => {
    const c = messagesContainerRef.current;
    if (!c) return;

    const distanceFromBottom = c.scrollHeight - c.scrollTop - c.clientHeight;
    const threshold = c.scrollHeight * 0.075;
    setIsAtBottom(distanceFromBottom < threshold);
  };

  // Scroll on new stream chunk
  useDebouncedEffect(() => scrollToMessageInput(), [messages], 50);

  useEffect(() => {
    const c = messagesContainerRef.current;
    if (!c) return;

    c.addEventListener("scroll", handleScroll);
    return () => {
      c.removeEventListener("scroll", handleScroll);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesContainerRef]);

  return { isAtBottom, handleScroll, scrollToMessageInput };
}
