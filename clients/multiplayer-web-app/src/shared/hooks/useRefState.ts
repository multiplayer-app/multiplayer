import { useState, useRef, useCallback } from "react";

export const useRefState = <T>(initialValue: T): [T, (value: T) => void, { current: T }] => {
  const [state, setState] = useState<T>(initialValue);
  const ref = useRef<T>(initialValue);

  const setStateAndRef = useCallback((val: T | ((prevVal: T) => T)) => {
    setState(prev => {
      const newValue = typeof val === 'function'
        ? (val as (prevValue: T) => T)(prev)
        : val;
      ref.current = newValue;
      return newValue;
    });
  }, []);

  return [state, setStateAndRef, ref];
};