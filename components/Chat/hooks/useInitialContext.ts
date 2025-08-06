import type { UIMessage } from "ai";

export type InitialContext = [UIMessage[], UIMessage | null];

export function useInitialContext(
  initialMessages?: UIMessage[],
): InitialContext {
  if (initialMessages?.length === 1 && initialMessages[0].role === "user") {
    // pull out that sole user message
    return [[], initialMessages[0]];
  }

  // otherwise, treat them all as context
  return [initialMessages || [], null];
}
