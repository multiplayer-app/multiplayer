import {
  useRef,
  Reducer,
  useReducer,
  useEffect,
  useCallback,
  ReducerState,
} from "react";

const useCustomReducer = <R extends Reducer<any, any>>(
  reducer: R,
  initialState: ReducerState<R>
) => {
  const prevStateRef = useRef<unknown>();
  const [state, dispatch] = useReducer<R>(reducer, initialState);

  useEffect(() => {
    prevStateRef.current = state;
  }, [state]);

  const customDispatch = useCallback((action: R | ((arg: unknown) => R)) => {
    if (typeof action === "function") {
      dispatch(action(prevStateRef.current, {}));
    } else {
      dispatch(action);
    }
  }, []);

  return [state, customDispatch];
};

export default useCustomReducer;
