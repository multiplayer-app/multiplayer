import React, { useState, ReactNode } from "react";
import { BoxProps } from "@chakra-ui/react";
import IntersectionBox from "shared/components/IntersectionBox";

export interface LazyRenderProps extends Omit<BoxProps, "children"> {
  children: ReactNode | (() => ReactNode);
  fallback?: ReactNode;
  onIntersect?: (isIntersecting: boolean) => void;
  onVisible?: () => void;
  onHidden?: () => void;
}

const LazyRender: React.FC<LazyRenderProps> = ({
  children,
  fallback,
  onIntersect,
  onVisible,
  onHidden,
  ...boxProps
}) => {
  const [isVisible, setIsVisible] = useState(false);
  // const [hasBeenVisible, setHasBeenVisible] = useState(false);

  const handleIntersect = (isIntersecting: boolean) => {
    setIsVisible(isIntersecting);
    onIntersect?.(isIntersecting);

    if (isIntersecting) {
      // setHasBeenVisible(true);
      onVisible?.();
    } else {
      onHidden?.();
    }
  };

  const shouldRender = isVisible; // || hasBeenVisible;
  const shouldShowFallback = !shouldRender && fallback;

  return (
    <IntersectionBox onIntersect={handleIntersect} {...boxProps}>
      {shouldShowFallback
        ? fallback
        : shouldRender
        ? typeof children === "function"
          ? children()
          : children
        : null}
    </IntersectionBox>
  );
};

export default LazyRender;
