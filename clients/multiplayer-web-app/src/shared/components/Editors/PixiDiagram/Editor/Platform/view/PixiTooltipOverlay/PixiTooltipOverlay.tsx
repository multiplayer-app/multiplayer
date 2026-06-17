import { Box } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface TooltipState {
  visible: boolean;
  text: string;
  x: number;
  y: number;
  width: number;
}

const PixiTooltipOverlay = ({
  parentRef,
}: {
  parentRef: React.RefObject<HTMLDivElement>;
}) => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    text: "",
    x: 0,
    y: 0,
    width: 0,
  });

  useEffect(() => {
    const handleShow = (e: CustomEvent) => {
      const { text, x, y, width } = e.detail;
      const { top, left } = parentRef.current.getBoundingClientRect();
      setTooltip({
        visible: true,
        text,
        x: x + left,
        y: y + top,
        width,
      });
    };

    const handleHide = () => {
      setTooltip((prev) => ({ ...prev, visible: false }));
    };

    window.addEventListener("pixi-tooltip-show", handleShow);
    window.addEventListener("pixi-tooltip-hide", handleHide);

    return () => {
      window.removeEventListener("pixi-tooltip-show", handleShow);
      window.removeEventListener("pixi-tooltip-hide", handleHide);
    };
  }, [parentRef]);

  if (!tooltip.visible) return null;

  return createPortal(
    <Box
      px={3}
      py={1}
      mt={-4}
      top={tooltip.y}
      left={tooltip.x}
      zIndex={9999}
      position="fixed"
      bg="bg.subtle"
      color="inverse"
      maxW="200px"
      fontSize="xs"
      boxShadow="md"
      borderRadius="md"
      pointerEvents="none"
      transform="translateY(-100%) translateX(-50%)"
    >
      {tooltip.text}
    </Box>,
    document.body
  );
};

export default PixiTooltipOverlay;
