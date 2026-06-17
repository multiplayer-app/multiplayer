import { useEffect, useState, useCallback } from 'react';
import { Replayer } from 'rrweb';

export interface IframeTransform {
  scale: number;
  iframeWidth: number;
  iframeHeight: number;
  containerWidth: number;
  containerHeight: number;
  offsetX: number;
  offsetY: number;
}

export const useIframeTransform = (replayer: Replayer | null, containerRef: React.RefObject<HTMLDivElement>) => {
  const [transform, setTransform] = useState<IframeTransform>({
    scale: 1,
    iframeWidth: 0,
    iframeHeight: 0,
    containerWidth: 0,
    containerHeight: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const calculateTransform = useCallback(() => {
    if (!replayer?.wrapper || !containerRef.current) return;

    const wrapper = replayer.wrapper;
    const container = containerRef.current;

    // Get the computed transform style
    const computedStyle = window.getComputedStyle(wrapper);
    const transformMatrix = computedStyle.transform;

    let scale = 1;

    if (transformMatrix && transformMatrix !== 'none') {
      const matrix = new DOMMatrix(transformMatrix);
      scale = matrix.a; // scaleX
    }

    // Get iframe dimensions
    const iframe = replayer.iframe;
    const iframeWidth = iframe?.contentDocument?.body?.scrollWidth || iframe?.offsetWidth || 0;
    const iframeHeight = iframe?.contentDocument?.body?.scrollHeight || iframe?.offsetHeight || 0;

    // Get container dimensions
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Calculate iframe offset (centered positioning)
    const scaledIframeWidth = iframeWidth * scale;
    const scaledIframeHeight = iframeHeight * scale;

    const offsetX = Math.round(((containerWidth - scaledIframeWidth) / 2) * 100) / 100;
    const offsetY = Math.round(((containerHeight - scaledIframeHeight) / 2) * 100) / 100;

    setTransform({
      scale,
      iframeWidth,
      iframeHeight,
      containerWidth,
      containerHeight,
      offsetX,
      offsetY,
    });
  }, [replayer, containerRef]);

  useEffect(() => {
    if (!replayer) return;

    // Calculate initial transform
    calculateTransform();

    // Set up mutation observer to watch for transform changes
    const observer = new MutationObserver(() => {
      calculateTransform();
    });

    // Observe the wrapper element for attribute changes
    if (replayer.wrapper) {
      observer.observe(replayer.wrapper, {
        attributes: true,
        attributeFilter: ['style'],
      });
    }

    // Set up resize observer for container
    const resizeObserver = new ResizeObserver(() => {
      calculateTransform();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Listen for rrweb resize events
    const handleResize = () => {
      setTimeout(calculateTransform, 0); // Small delay to ensure DOM updates
    };

    replayer.on('resize', handleResize);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      replayer.off('resize', handleResize);
    };
  }, [replayer, calculateTransform]);

  return transform;
};
