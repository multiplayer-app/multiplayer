import { useCallback, useEffect, useState } from "react";
import { clone } from "shared/utils";
import { UndoManager, Transaction } from "yjs";

const useYArrayState = <T>(
  yArray
): [T[], (value: T, index?: number) => void, (index: number) => void] => {
  const [state, setState] = useState<T[]>(yArray?.toArray());

  useEffect(() => {
    const handleObserver = (_, tr: Transaction) => {
      if (!tr.local || tr.origin instanceof UndoManager) {
        setState(clone(yArray.toArray()));
      }
    };

    yArray.observe(handleObserver);
    return () => {
      yArray.unobserve(handleObserver);
    };
  }, [yArray]);

  const setItem = useCallback(
    (value: T, index?: number): void => {
      if (index === undefined || index >= yArray.length) {
        yArray.push([clone(value)]);
      } else {
        yArray.delete(index, 1);
        yArray.insert(index, [clone(value)]);
      }

      setState(yArray.toArray());
    },
    [yArray]
  );

  const removeItem = useCallback(
    (index: number): void => {
      if (index >= 0 && index < yArray.length) {
        yArray.delete(index, 1);
        setState(yArray.toArray());
      }
    },
    [yArray]
  );

  return [state, setItem, removeItem];
};

export default useYArrayState;
