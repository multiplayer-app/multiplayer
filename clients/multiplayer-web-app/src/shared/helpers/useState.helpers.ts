export const getStateSet =
  <T>(newVal: T) =>
  (prev: Set<T>): Set<T> => {
    const set = new Set(prev);
    set.add(newVal);
    return set;
  };

export const toggleStateSet =
  <T>(newVal: T) =>
  (prev: Set<T>): Set<T> => {
    const set = new Set(prev);
    if (prev.has(newVal)) {
      set.delete(newVal);
    } else {
      set.add(newVal);
    }
    return set;
  };

export const getUniqueArray =
  <T>(newVal: T) =>
  (prev: Array<T>): Array<T> => {
    const set = new Set(prev);
    set.add(newVal);
    return Array.from(set);
  };
