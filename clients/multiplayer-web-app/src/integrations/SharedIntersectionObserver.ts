import { useCallback, useRef } from 'react';

type IntersectionCallback = (entry: IntersectionObserverEntry) => void;

class SharedIntersectionObserver {
  private observer: IntersectionObserver | null = null;
  private callbacks = new Map<Element, IntersectionCallback>();
  private options: IntersectionObserverInit;

  constructor(options: IntersectionObserverInit = {}) {
    this.options = {
      rootMargin: '0px',
      threshold: 0.1,
      ...options,
    };
  }

  private createObserver() {
    if (this.observer) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const callback = this.callbacks.get(entry.target);
        if (callback) {
          callback(entry);
        }
      });
    }, this.options);
  }

  observe(element: Element, callback: IntersectionCallback) {
    this.createObserver();
    this.callbacks.set(element, callback);
    this.observer!.observe(element);
  }

  unobserve(element: Element) {
    this.callbacks.delete(element);
    this.observer?.unobserve(element);
  }

  disconnect() {
    this.callbacks.clear();
    this.observer?.disconnect();
    this.observer = null;
  }
}

// Global shared instance
const sharedObserver = new SharedIntersectionObserver();

export const useSharedIntersectionObserver = () => {
  const elementRef = useRef<Element | null>(null);

  const observe = useCallback((callback: IntersectionCallback) => {
    if (elementRef.current) {
      sharedObserver.observe(elementRef.current, callback);
    }
  }, []);

  const unobserve = useCallback(() => {
    if (elementRef.current) {
      sharedObserver.unobserve(elementRef.current);
    }
  }, []);

  return {
    elementRef,
    observe,
    unobserve,
  };
};

export default sharedObserver;
