export const toggleFullscreen = (el) => {
  if (!document.fullscreenElement) {
    openFullscreen(el);
    return;
  }
  if (document.fullscreenElement === el) {
    closeFullscreen();
  }
};

/* View in fullscreen */
export const openFullscreen = (elem) => {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    /* IE11 */
    elem.msRequestFullscreen();
  }
};

/* Close fullscreen */
export const closeFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
    // @ts-ignore
  } else if (document.webkitExitFullscreen) {
    /* Safari */
    // @ts-ignore
    document.webkitExitFullscreen();
    // @ts-ignore
  } else if (document.msExitFullscreen) {
    /* IE11 */
    // @ts-ignore
    document.msExitFullscreen();
  }
};

export function isFullscreen(elem?): boolean {
  let fullscreen = false;
  (
    [
      "fullscreen",
      "webkitIsFullScreen",
      "mozFullScreen",
      "msFullscreenElement",
    ] as const
  ).forEach((fullScreenAccessor) => {
    if (fullScreenAccessor in document) {
      fullscreen =
        fullscreen ||
        (Boolean(document[fullScreenAccessor]) &&
          (!elem || document.fullscreenElement === elem));
    }
  });
  return fullscreen;
}

export function onFullscreenChange(handler: () => unknown): () => void {
  document.addEventListener("fullscreenchange", handler);
  document.addEventListener("webkitfullscreenchange", handler);
  document.addEventListener("mozfullscreenchange", handler);
  document.addEventListener("MSFullscreenChange", handler);

  return () => {
    document.removeEventListener("fullscreenchange", handler);
    document.removeEventListener("webkitfullscreenchange", handler);
    document.removeEventListener("mozfullscreenchange", handler);
    document.removeEventListener("MSFullscreenChange", handler);
  };
}
