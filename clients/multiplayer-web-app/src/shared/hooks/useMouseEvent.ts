export const useMouseEvent = () => {
  const triggerMouseEvent = (element: HTMLElement) => {
    const mouseDownEvent = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
    });

    const mouseUpEvent = new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      view: window,
    });

    element.dispatchEvent(mouseDownEvent);
    setTimeout(() => {
      element.dispatchEvent(mouseUpEvent);
    }, 100);
  };

  const triggerMouseDownEvent = (element: HTMLElement) => {
    const mouseDownEvent = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
    });

    element.dispatchEvent(mouseDownEvent);
  };

  const triggerMouseUpEvent = (element: HTMLElement) => {
    const mouseUpEvent = new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      view: window,
    });

    element.dispatchEvent(mouseUpEvent);
  };

  return { triggerMouseEvent, triggerMouseDownEvent, triggerMouseUpEvent };
};
