import { Box, FlexProps } from "@chakra-ui/react";
import { useZoom } from "shared/providers/ZoomContext";

const ZoomContainer = ({ children }: FlexProps) => {
  const { containerRef } = useZoom();
  return (
    <Box
      h="auto"
      w="auto"
      flex="1"
      ref={containerRef}
      minH="full"
      minW="full"
      userSelect="none"
      position="relative"
      className="zoom-container"
      style={{ transformOrigin: "0 0" }}
    >
      {children}
    </Box>
  );
};

export default ZoomContainer;
