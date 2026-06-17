import React, { memo, useEffect, useRef } from "react";
import { Box, Flex, FlexProps } from "@chakra-ui/react";

type SplitLayoutHorizontalProps = FlexProps & {
  initialWidth?: string[];
  children?: React.ReactNode | React.ReactNode[];
  onChange?: (arg: number[]) => void;
};

const SplitLayoutHorizontal = ({
  initialWidth,
  children,
  onChange,
  ...rest
}: SplitLayoutHorizontalProps) => {
  const wrapper = useRef<HTMLDivElement>();
  const handler = useRef<HTMLDivElement>();

  useEffect(() => {
    for (const [index, element] of Array.from(
      wrapper.current.children
    ).entries()) {
      const wrapperWidth = wrapper.current.offsetWidth;
      const el = element as HTMLElement;
      const w = initialWidth
        ? initialWidth[index]
        : Math.floor((el.offsetWidth / wrapperWidth) * 100) + "%";
      el.style.minWidth = w;
    }
    onChange && onChange(getWidths(wrapper.current?.children));
  }, [onChange, initialWidth]);

  const handleMouseMove = ({ target, pressure, movementX }) => {
    if (pressure) {
      window.requestAnimationFrame(() => {
        if (!handler.current) return;
        const container = handler.current.parentElement;
        const parentContainer = container.parentElement;
        const prevContainer = container.previousSibling as HTMLDivElement;

        const oldContainerWidth = container.offsetWidth;
        const parentContainerWidth = parentContainer.offsetWidth;
        const oldPrevContainerWidth = prevContainer.offsetWidth;

        prevContainer.style.minWidth =
          ((oldPrevContainerWidth + movementX) / parentContainerWidth) * 100 +
          "%";
        container.style.minWidth =
          ((oldContainerWidth - movementX) / parentContainerWidth) * 100 + "%";
        onChange && onChange(getWidths(wrapper.current.children));
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
    <Flex flex="1" minH="0" ref={wrapper} userSelect="none" {...rest}>
      {Array.isArray(children)
        ? children
            .filter(Boolean)
            .map((child: React.ReactNode, index: number) => (
              <Flex flex="1" minH="0" position="relative" key={index}>
                {index > 0 && (
                  <Box
                    position="absolute"
                    w="1"
                    top="0"
                    bottom="0"
                    left="-1"
                    zIndex="2"
                    userSelect="none"
                    cursor="col-resize"
                    borderRight="1px"
                    borderRightColor="border.secondary"
                    _hover={{ bg: "blue.300" }}
                    transition=" background .3s linear .2s"
                    onMouseDown={handleMouseDown}
                  />
                )}
                {child}
              </Flex>
            ))
        : children}
    </Flex>
  );
};

function getWidths(el: HTMLCollection): number[] {
  const arr = [];
  for (const element of el) {
    arr.push((element as HTMLElement).offsetWidth);
  }
  return [];
}

export default memo(SplitLayoutHorizontal);
