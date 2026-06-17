import {
  useRef,
  useMemo,
  useState,
  useEffect,
  useContext,
  useCallback,
  createContext,
} from "react";

import * as d3 from "d3";

import Background from "shared/components/Background";
import ZoomControls from "shared/components/Zoom/ZoomControls";
import { Box, FlexProps, useEventListener } from "@chakra-ui/react";
import { useActiveTabState } from "./TabsContext";
import { getTransformBounds } from "shared/helpers/zoom.helpers";

export const ZoomContext = createContext(null);

const MAX_ZOOM = 2;
const MIN_ZOOM = 0.25;

export enum KeyCodes {
  Space = "Space",
}

export const ZoomProvider = ({ children, ...rest }: FlexProps) => {
  const timeout = useRef<null | ReturnType<typeof setTimeout>>();
  const interval = useRef<null | ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomContainerRef = useRef<HTMLDivElement>(null);
  const d3Zoom = useRef<d3.ZoomBehavior<Element, unknown>>(null);
  const d3ZoomContainer =
    useRef<d3.Selection<HTMLDivElement, unknown, null, undefined>>(null);
  const prevZoomRef = useRef({ x: 0, y: 0, k: 1 });
  const pressedKeys = useRef<Record<string, any>>({});

  const [tabState, setTabState] = useActiveTabState({ x: 0, y: 0, scale: 1 });
  const [position, setPosition] = useState(tabState);

  useEffect(() => {
    /*
    Storing the position directly in the ActiveTabState
    and updating it frequently leads to performance problems
    */
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      setTabState((prev) => ({ ...prev, ...position }));
    }, 100);
  }, [position]);

  const handleZoom = useCallback(({ transform }) => {
    prevZoomRef.current = transform;
    const { x, y, k } = transform;
    const scaledBgSize = 25 * k;
    const transformStr = `translate(${x}px, ${y}px) scale(${k})`;
    const groupTransform = `scale(${k}) translate(${x / k} ${y / k})`;
    const svgTransform = `scale(${1 / k}) translate(${-x}px, ${-y}px)`;
    const transformBg = `translate(${Math.ceil(
      x % scaledBgSize
    )}px, ${Math.ceil(y % scaledBgSize)}px)`;

    d3.select(containerRef.current).style("transform", transformStr);
    d3.select(".diagram-background").style("transform", transformBg);
    d3.selectAll("svg.diagram-edges").style("transform", svgTransform);
    d3.selectAll("g.diagram-edges-group").attr("transform", groupTransform);
    d3.select(".diagram-background").select("circle").attr("r", Math.max(1, k));
    d3.select(".diagram-background")
      .select("pattern")
      .attr("width", scaledBgSize)
      .attr("height", scaledBgSize);
  }, []);

  const handleZoomEnd = useCallback(({ transform }) => {
    setPosition((prev) => ({
      x: transform.x,
      y: transform.y,
      scale: transform.k,
    }));
  }, []);

  useEffect(() => {
    if (zoomContainerRef.current) {
      d3Zoom.current = d3
        .zoom()
        .scaleExtent([MIN_ZOOM, MAX_ZOOM])
        .filter((e) => {
          if (e.type === "mousedown") {
            return pressedKeys.current[KeyCodes.Space] || e.button === 1;
          }
          return !(e.defaultPrevented || e.isPropagationStopped || e.button);
        })
        .on("zoom", handleZoom)
        .on("end", handleZoomEnd);

      d3ZoomContainer.current = d3.select(zoomContainerRef.current);
      const initialTransform = d3.zoomIdentity
        .translate(tabState.x, tabState.y)
        .scale(tabState.scale);

      d3ZoomContainer.current
        .call(d3Zoom.current)
        .call(d3Zoom.current.transform, initialTransform);

      return () => {
        d3ZoomContainer.current.on(".zoom", null);
      };
    }
  }, []);

  const setZoom = useCallback((newScale) => {
    d3ZoomContainer.current.call(d3Zoom.current.scaleTo, newScale);
  }, []);

  const zoomIn = useCallback(() => {
    setZoom(prevZoomRef.current.k + 0.1);
  }, [setZoom]);

  const zoomOut = useCallback(() => {
    setZoom(prevZoomRef.current.k - 0.1);
  }, [setZoom]);

  const zoomToFit = useCallback(() => {
    if (!containerRef.current) return;
    const element = d3.select(containerRef.current);
    const container = d3.select(zoomContainerRef.current);
    const { x, y, scale } = getTransformBounds(element, container);
    const transform = d3.zoomIdentity.translate(x, y).scale(scale);
    container.transition().call(d3Zoom.current.transform, transform);
  }, []);

  const resetZoom = useCallback(() => {
    if (!zoomContainerRef.current) return;
    const transform = d3.zoomIdentity.translate(0, 0).scale(1);
    d3ZoomContainer.current
      .transition()
      .call(d3Zoom.current.transform, transform);
  }, []);

  const updateStyles = useCallback(
    (style: Record<string, any> = {}) => {
      if (!style.position)
        return {
          style: {
            ...style,
            transform: getTransform(style.transform, position),
          },
        };
      const { x, y, scale } = position;
      const { top, left } = zoomContainerRef.current.getBoundingClientRect();
      return {
        style: {
          ...style,
          width: style.width / scale,
          height: style.height / scale,
          top: (style.top - (top + y)) / scale,
          left: (style.left - (left + x)) / scale,
          transform: getTransform(style.transform, position),
        },
      };
    },
    [position]
  );

  const onSpaceKeydown = (event: KeyboardEvent) => {
    if (!event.repeat) {
      zoomContainerRef.current.style.cursor = "grab";
    }
  };

  const onSpaceKeyup = (_event: KeyboardEvent) => {
    zoomContainerRef.current.style.cursor = "default";
  };

  const moveContainer = (event: PointerEvent) => {
    clearInterval(interval.current);
    const { top, left, width, height } =
      zoomContainerRef.current.getBoundingClientRect();
    const x = event.clientX - left;
    const y = event.clientY - top;
    const moveFactorX = (1 - x / (width / 2)) * 10;
    const moveFactorY = (1 - y / (height / 2)) * 10;
    const needToMoveX = Math.abs(moveFactorX) > 9;
    const needToMoveY = Math.abs(moveFactorY) > 9;

    if (needToMoveX || needToMoveY) {
      interval.current = setInterval(() => {
        d3ZoomContainer.current.call(
          d3Zoom.current.translateBy,
          needToMoveX ? moveFactorX : 0,
          needToMoveY ? moveFactorY : 0
        );
      }, 25);
    }
  };

  useEventListener("keydown", (event: KeyboardEvent) => {
    pressedKeys.current[event.code] = true;
    switch (event.code) {
      case KeyCodes.Space:
        onSpaceKeydown(event);
        break;
      default:
        break;
    }
  });

  useEventListener("keyup", (event: KeyboardEvent) => {
    pressedKeys.current[event.code] = false;
    switch (event.code) {
      case KeyCodes.Space:
        onSpaceKeyup(event);
        break;
      default:
        break;
    }
  });

  useEventListener("mouseup", (event: PointerEvent) => {
    clearInterval(interval.current);
  });

  useEventListener("touchend", (event) => {
    clearInterval(interval.current);
  });

  useEventListener("pointerup", (event: PointerEvent) => {
    clearInterval(interval.current);
  });

  const value = useMemo(
    () => ({
      position,
      zoomIn,
      zoomOut,
      setZoom,
      zoomToFit,
      resetZoom,
      updateStyles,
      moveContainer,
      containerRef: containerRef,
      zoomContainerRef: zoomContainerRef,
    }),
    [position]
  );

  return (
    <ZoomContext.Provider value={value}>
      <Box
        {...rest}
        overflow="hidden"
        position="relative"
        ref={zoomContainerRef}
        className="zoom-provider"
        style={{
          touchAction: "pan-x pan-y pinch-zoom",
        }}
      >
        <Background
          w="100%"
          h="100%"
          top="0"
          left="0"
          position="absolute"
          transformOrigin="0 0"
          size={25 * position.scale}
          className="diagram-background"
        />
        {children}
        <ZoomControls />
      </Box>
    </ZoomContext.Provider>
  );
};

const getTransform = (transformStr, { scale }) => {
  if (!transformStr) return null;
  const [translateX, translateY] = transformStr
    .match(/[-+]?\d+(?:\.\d+)?/g)
    .map(Number);

  return `translate(${translateX / scale}px, ${translateY / scale}px)`;
};

export const useZoom = () => {
  const context = useContext(ZoomContext);
  if (!context) {
    throw new Error("useZoom must be used within a ZoomProvider");
  }
  return context;
};
