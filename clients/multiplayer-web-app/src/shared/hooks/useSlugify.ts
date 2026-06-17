import { useEffect } from "react";
import { getSlugifiedName } from "shared/utils";

const useSlugify = (value: string, cb) => {
  useEffect(() => {
    let timeout = setTimeout(() => {
      cb(getSlugifiedName(value));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [value]);
};

export default useSlugify;
