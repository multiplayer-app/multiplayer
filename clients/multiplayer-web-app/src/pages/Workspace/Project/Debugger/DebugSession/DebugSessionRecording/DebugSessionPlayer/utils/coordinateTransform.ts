import { IframeTransform } from '../hooks/useIframeTransform';

/**
 * Calculates the sketch zoom level that matches the iframe scale
 * @param transform Current iframe transform information
 * @returns Zoom value for the sketch
 */
export const calculateSketchZoom = (transform: IframeTransform): number => {
  return transform.scale;
};

/**
 * Calculates the sketch offset to align with iframe positioning
 * @param transform Current iframe transform information
 * @returns Object with x, y offset values for the sketch
 */
export const calculateSketchOffset = (transform: IframeTransform): { x: number; y: number } => {
  const { offsetX, offsetY, scale } = transform;

  return {
    x: offsetX / scale,
    y: offsetY / scale,
  };
};
