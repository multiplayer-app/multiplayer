class YjsObserverManager {
  observedObjects: Map<any, Set<any>>;
  observedDeepObjects: Map<any, Set<any>>;
  constructor() {
    this.observedObjects = new Map();
    this.observedDeepObjects = new Map();
  }

  observe(yjsObject, callback) {
    if (!yjsObject || typeof yjsObject.observe !== "function") {
      console.error("Invalid Yjs object. Ensure it supports observation.");
      return;
    }

    const observers = this.observedObjects.get(yjsObject) || new Set();

    if (!observers.has(callback)) {
      yjsObject.observe(callback);
      observers.add(callback);
      this.observedObjects.set(yjsObject, observers);
    }
  }

  observeDeep(yjsObject, callback) {
    if (!yjsObject || typeof yjsObject.observe !== "function") {
      console.error("Invalid Yjs object. Ensure it supports observation.");
      return;
    }

    const observers = this.observedDeepObjects.get(yjsObject) || new Set();

    if (!observers.has(callback)) {
      yjsObject.observeDeep(callback);
      observers.add(callback);
      this.observedDeepObjects.set(yjsObject, observers);
    }
  }

  unobserve(yjsObject, callback) {
    if (!yjsObject) return;
    const observers = this.observedObjects.get(yjsObject);
    if (observers && observers.has(callback)) {
      yjsObject.unobserve(callback);
      observers.delete(callback);

      if (observers.size === 0) {
        this.observedObjects.delete(yjsObject);
      }
    }
  }

  unobserveDeep(yjsObject, callback) {
    if (!yjsObject) return;
    const observers = this.observedDeepObjects.get(yjsObject);
    if (observers && observers.has(callback)) {
      yjsObject.unobserveDeep(callback);
      observers.delete(callback);

      if (observers.size === 0) {
        this.observedDeepObjects.delete(yjsObject);
      }
    }
  }

  clearObserversForYjsObject(yjsObject) {
    const observers = this.observedObjects.get(yjsObject);
    const deepObservers = this.observedDeepObjects.get(yjsObject);

    if (observers) {
      for (const callback of observers) {
        yjsObject.unobserve(callback);
      }
      this.observedObjects.delete(yjsObject);
    }
    if (deepObservers) {
      for (const callback of deepObservers) {
        yjsObject.unobserveDeep(callback);
      }
      this.observedDeepObjects.delete(yjsObject);
    }
  }

  clearAllObservers() {
    for (const [yjsObject, observers] of this.observedObjects.entries()) {
      for (const callback of observers) {
        yjsObject.unobserve(callback);
      }
    }
    for (const [yjsObject, observers] of this.observedDeepObjects.entries()) {
      for (const callback of observers) {
        yjsObject.unobserveDeep(callback);
      }
    }
    this.observedObjects.clear();
    this.observedDeepObjects.clear();
  }
}

export default YjsObserverManager;
