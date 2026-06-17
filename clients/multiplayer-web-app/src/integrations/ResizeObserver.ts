const WrapResizeObserver = () => {
  // Save a reference to the original ResizeObserver
  const OriginalResizeObserver = window.ResizeObserver;

  // Create a new ResizeObserver constructor
  // @ts-ignore
  window.ResizeObserver = function (callback) {
    const wrappedCallback = (entries, observer) => {
      window.requestAnimationFrame(() => {
        callback(entries, observer);
      });
    };

    // Create an instance of the original ResizeObserver
    // with the wrapped callback
    return new OriginalResizeObserver(wrappedCallback);
  };

  // Copy over static methods, if any
  for (let staticMethod in OriginalResizeObserver) {
    if (OriginalResizeObserver.hasOwnProperty(staticMethod)) {
      window.ResizeObserver[staticMethod] =
        OriginalResizeObserver[staticMethod];
    }
  }
};

// Export the modified ResizeObserver
export default WrapResizeObserver;
