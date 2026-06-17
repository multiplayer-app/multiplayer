import { cubicBezier } from "./cubic-bezier";

export const linearEase = (t) => t;

export const animateScale = (
  object,
  toValue,
  duration = 200,
  cb = () => {}
) => {
  if (!object) return;
  const startTime = performance.now();
  const initialValue = object.scale?.x;
  function animate(now) {
    const elapsedTime = now - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    const easedProgress = linearEase(progress);
    object?.scale?.set(initialValue + (toValue - initialValue) * easedProgress);
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      cb();
    }
  }

  requestAnimationFrame(animate);
};
export const animateAlpha = (
  object,
  toValue,
  duration = 200,
  cb = () => {}
) => {
  if (!object) return;
  const startTime = performance.now();
  const initialValue = object.alpha;
  function animate(now) {
    const elapsedTime = now - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    const easedProgress = linearEase(progress);
    object.alpha = initialValue + (toValue - initialValue) * easedProgress;
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      cb();
    }
  }

  requestAnimationFrame(animate);
};

export const animatePosition = (
  position,
  toValue,
  duration = 200,
  linear = true,
  cb = () => {},
  animationDone = () => {}
): Promise<boolean> => {
  return new Promise((resolve) => {
    const initialX = position.x;
    const initialY = position.y;

    if (initialX === toValue.x && initialY === toValue.y) {
      return resolve(false);
    }

    const startTime = performance.now();

    const easing = linear ? linearEase : cubicBezier(0.17, 0.93, 0.38, 1);

    function animate(now) {
      const elapsedTime = now - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const easedProgress = easing(progress);
      position.set(
        initialX + (toValue.x - initialX) * easedProgress,
        initialY + (toValue.y - initialY) * easedProgress
      );

      cb();
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        animationDone();
        resolve(true);
      }
    }
    requestAnimationFrame(animate);
  });
};
