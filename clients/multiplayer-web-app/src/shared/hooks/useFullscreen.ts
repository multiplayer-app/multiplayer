import { useCallback, useEffect, useState } from "react";
import {
  toggleFullscreen,
  onFullscreenChange,
  isFullscreen as isFullscreenFn,
} from "shared/helpers/fullscreen.helpers";

export const useFullScreen = (ref) => {
  const [isFullscreen, setIsFullscreen] = useState(
    !!document.fullscreenElement
  );
  const [fullscreenElement, setFullscreenElement] = useState(
    document.fullscreenElement
  );

  const toggle = useCallback((el = document) => {
    toggleFullscreen(el);

    setTimeout(() => {
      setIsFullscreen(isFullscreenFn(el));
    }, 200);
  }, []);

  useEffect(() => {
    const onChangeHandle = () => {
      setIsFullscreen(isFullscreenFn(ref || document));
      setFullscreenElement(document.fullscreenElement);
    };
    const removeListener = onFullscreenChange(onChangeHandle);
    return () => {
      removeListener();
    };
  }, []);

  return {
    toggleFullscreen: toggle,
    isFullscreen,
    fullscreenElement,
  };
};
