const hexToRgbACache = new Map();

const convertHexToRgba = (hex, alpha) => {
  const regex = /^#?([A-Fa-f\d]{2})([A-Fa-f\d]{2})([A-Fa-f\d]{2})$/;
  const result = regex.exec(hex);

  if (result) {
    const [, red, green, blue] = result;
    return `rgba(${parseInt(red, 16)}, ${parseInt(green, 16)}, ${parseInt(
      blue,
      16
    )}, ${alpha})`;
  }

  return null;
};

export const hexToRgbA = (hex, alpha = 1) => {
  if (alpha < 0 || alpha > 1) {
    throw new Error("Alpha value must be between 0 and 1");
  }

  const cacheKey = hex + alpha;
  const cachedValue = hexToRgbACache.get(cacheKey);

  if (cachedValue) {
    return cachedValue;
  }

  const convertedValue = convertHexToRgba(hex, alpha);
  hexToRgbACache.set(cacheKey, convertedValue);

  return convertedValue;
};
