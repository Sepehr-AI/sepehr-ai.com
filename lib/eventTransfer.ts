export type EventHandler<EventMap> = (e: CustomEventInit<EventMap>) => void;

export function listenOnEvent<EventMap>(
  name: string,
  handler: EventHandler<EventMap>,
): () => void {
  window.addEventListener(name, handler);
  return () => {
    window.removeEventListener(name, handler);
  };
}

export function dispatchEvent<EventMap>(name: string, detail: EventMap): void {
  window.dispatchEvent(
    new CustomEvent<EventMap>(name, {
      detail,
    }),
  );
}
