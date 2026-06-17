import { useEffect } from "react";
import { Box, BoxProps } from "@chakra-ui/react";
import { useSharedIntersectionObserver } from "integrations/SharedIntersectionObserver";

interface IntersectionBoxProps extends BoxProps {
  onIntersect: (res: boolean) => void;
}

const IntersectionBox = ({
  children,
  onIntersect,
  ...rest
}: IntersectionBoxProps) => {
  const { elementRef, observe, unobserve } = useSharedIntersectionObserver();

  useEffect(() => {
    const callback = (entry: IntersectionObserverEntry) => {
      onIntersect(entry.isIntersecting);
    };

    observe(callback);

    return () => {
      unobserve();
    };
  }, [onIntersect, observe, unobserve]);

  return (
    <Box {...rest} ref={elementRef}>
      {children}
    </Box>
  );
};

export default IntersectionBox;
