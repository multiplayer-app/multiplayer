export function calculateDistance(touch1, touch2) {
  return Math.hypot(
    touch1.clientX - touch2.clientX,
    touch1.clientY - touch2.clientY
  );
}

export function getTransformScale(zoomElement) {
  const transform = window.getComputedStyle(zoomElement).transform;
  const matrix = new DOMMatrix(transform);
  return matrix.a;
}

export function calculateZoomToFitScale(
  parentWidth,
  parentHeight,
  childWidth,
  childHeight
) {
  const scaleWidth = parentWidth / childWidth;
  const scaleHeight = parentHeight / childHeight;

  const scaleToFit = Math.min(scaleWidth, scaleHeight);

  return scaleToFit;
}

export const getTransformBounds = (element, container) => {
  const bounds = element.node().getBoundingClientRect();
  const containerBounds = container.node().getBoundingClientRect();

  const scale = calculateZoomToFitScale(
    containerBounds.width,
    containerBounds.height,
    bounds.width,
    bounds.height
  );

  const x = (containerBounds.width - bounds.width * scale) / 2;
  const y = (containerBounds.height - bounds.height * scale) / 2;
  return { x, y, scale };
};
