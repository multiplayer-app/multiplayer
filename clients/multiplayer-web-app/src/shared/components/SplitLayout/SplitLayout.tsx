import React, { memo, useEffect, useRef } from "react";
import { Box, Flex } from "@chakra-ui/react";

type SplitLayoutProps = {
  children?: React.ReactNode[];
  onChange?: (arg: number[]) => void;
};

const SplitLayout = ({ children, onChange }: SplitLayoutProps) => {
  const wrapper = useRef<HTMLDivElement>();
  const handler = useRef<HTMLDivElement>();

  useEffect(() => {
    for (let element of wrapper.current.children) {
      const el = element as HTMLElement;
      el.style.minHeight = el.offsetHeight + "px";
    }
    onChange && onChange(getHeights(wrapper.current.children));
  }, [onChange]);

  const handleMouseMove = ({ target, pressure, movementY }) => {
    if (pressure) {
      window.requestAnimationFrame(() => {
        const container = handler.current.parentElement;
        const prevContainer = container.previousSibling as HTMLDivElement;

        const oldContainerHeight = container.offsetHeight;
        const oldPrevContainerHeight = prevContainer.offsetHeight;

        prevContainer.style.minHeight =
          oldPrevContainerHeight + movementY + "px";
        container.style.minHeight = oldContainerHeight - movementY + "px";
        onChange && onChange(getHeights(wrapper.current.children));
      });
    }
  };

  const handleMouseDown = (event) => {
    handler.current = event.target;
    const handleMouseUp = () => {
      handler.current = null;
      document.removeEventListener("pointermove", handleMouseMove);
      document.removeEventListener("pointerup", handleMouseUp);
    };

    document.addEventListener("pointermove", handleMouseMove);
    document.addEventListener("pointerup", handleMouseUp);
  };

  return (
    <Flex direction="column" flex="1" minH="0" ref={wrapper} userSelect="none">
      {children.map((child: React.ReactNode, index: number) => (
        <Box flex="1" minH="0" position="relative" key={index}>
          {index > 0 && (
            <Box
              position="absolute"
              top="-1"
              left="0"
              right="0"
              h="1.5"
              userSelect="none"
              cursor="row-resize"
              onMouseDown={handleMouseDown}
            />
          )}
          {child}
        </Box>
      ))}
    </Flex>
  );
};

function getHeights(el: HTMLCollection): number[] {
  const arr = [];
  for (const element of el) {
    arr.push((element as HTMLElement).offsetHeight);
  }
  return [];
}

export default memo(SplitLayout);
