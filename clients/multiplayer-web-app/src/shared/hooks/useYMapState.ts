import { useCallback, useEffect, useState } from "react";
import { clone } from "shared/utils";
import { UndoManager } from "yjs";

const useYMapState = <T>(
  yObject
): [T, <K extends keyof T>(key: K, value?: T[K]) => void] => {
  const [state, setState] = useState<T>(yObject.toJSON());

  useEffect(() => {
    const handleObserver = (e) => {
      if (
        !e ||
        !e.transaction.local ||
        e.transaction.origin instanceof UndoManager
      ) {
        setState(clone(yObject.toJSON()));
      }
    };

    yObject.observe(handleObserver);
    return () => {
      yObject.unobserve(handleObserver);
    };
  }, [yObject]);

  const onChange = useCallback(
    <K extends keyof T>(key: K, value?: T[K]): void => {
      if (value === undefined) {
        yObject.delete(key);
      } else {
        if (yObject.get(key) !== value) {
          yObject.set(key, clone(value));
        }
      }
      setState(yObject.toJSON());
    },
    [yObject]
  );

  return [state, onChange];
};

export default useYMapState;
