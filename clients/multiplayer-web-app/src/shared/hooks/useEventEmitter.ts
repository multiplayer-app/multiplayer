import { useCallback } from "react";

interface EventEmitter {
  subscribeToEvent: (
    type: string,
    id: string,
    callback: (data: any) => void
  ) => () => void;
  emitEvent: (type: string, id: string, data: any) => void;
}

const subscriptionsRef: Map<string, Set<(data: any) => void>> = new Map();

export const useEventEmitter = (): EventEmitter => {
  const subscribeToEvent = useCallback(
    (type: string, id: string, callback: (data: any) => void) => {
      const key = id ? `${type}:${id}` : type;

      if (!subscriptionsRef.has(key)) {
        subscriptionsRef.set(key, new Set());
      }
      subscriptionsRef.get(key).add(callback);

      // Return unsubscribe function
      return () => {
        const callbacks = subscriptionsRef.get(key);
        if (callbacks) {
          callbacks.delete(callback);
          if (callbacks.size === 0) {
            subscriptionsRef.delete(key);
          }
        }
      };
    },
    []
  );

  const emitEvent = useCallback((type: string, id: string, data: any) => {
    const key = id ? `${type}:${id}` : type;
    const callbacks = [...(subscriptionsRef.get(key) || []), ...(subscriptionsRef.get(type) || [])];
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Error in subscription callback:", error);
        }
      });
    }
  }, []);


  return {
    emitEvent,
    subscribeToEvent,
  };
};