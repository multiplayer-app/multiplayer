import { useEffect, useRef } from "react";

const useEventListener = (
  eventName: string,
  handler: (e: Event) => void,
  element: EventTarget = document
) => {
  const savedHandler = useRef<(e: Event) => void>();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const isSupported = element && element.addEventListener;

    if (!isSupported) {
      return;
    }

    const eventListener = (event: Event) => savedHandler.current?.(event);
    element.addEventListener(eventName, eventListener, { passive: false });

    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
};

export default useEventListener;
