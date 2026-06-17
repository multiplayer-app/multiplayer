import { useCallback, useState } from "react";

const useLocalStorage = <T = any>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)): void => {
    setStoredValue(prev => {
      const newValue = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
      if (newValue) {
        window.localStorage.setItem(key, JSON.stringify(newValue));
      } else {
        window.localStorage.removeItem(key);
      }
      return newValue;
    });
  }, [key]);

  const clearValue = useCallback(() => {
    window.localStorage.removeItem(key);
    setStoredValue(initialValue);
  }, [key]);

  return [storedValue, setValue, clearValue];
};

export default useLocalStorage;
