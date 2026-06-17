import { useCallback } from "react";
import { throttle } from "shared/utils";

const useThrottling = (callback, duration) => {
  return useCallback(
    (event) => {
      throttle(() => {
        callback(event);
      }, duration);
    },
    [callback, duration]
  );
};

export default useThrottling;
