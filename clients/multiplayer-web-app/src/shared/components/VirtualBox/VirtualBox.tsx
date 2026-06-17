import { Box, BoxProps } from "@chakra-ui/react";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { getScrollParent } from "shared/utils";
import { VirtualBoxHandle } from "shared/models/interfaces";

interface VirtualBoxProps extends BoxProps {
  scrollParent?: HTMLDivElement;
  children: React.ReactNode[];
}

const VirtualBox = forwardRef<VirtualBoxHandle, VirtualBoxProps>(
  ({ children, ...rest }, ref) => {
    if (!Array.isArray(children) || children.length === 0) {
      return <Box {...rest}>{children}</Box>;
    }

    return (
      <VirtualBoxContent ref={ref} {...rest}>
        {children}
      </VirtualBoxContent>
    );
  }
);

const VirtualBoxContent = forwardRef<VirtualBoxHandle, VirtualBoxProps>(
  ({ children, scrollParent, ...rest }, ref) => {
    const parentRef = useRef<HTMLDivElement | null>(null);

    const virtualizer = useVirtualizer({
      overscan: 15,
      count: children.length,
      estimateSize: () => 47,
      getScrollElement: () =>
        scrollParent || getScrollParent(parentRef.current),
    });

    const scrollToIndexSmooth = (
      index: number,
      align: "start" | "center" | "end" | "auto"
    ) => {
      const scrollElement = scrollParent || getScrollParent(parentRef.current);
      const [offset] = virtualizer.getOffsetForIndex(index, align);

      if (offset !== undefined) {
        scrollElement?.scrollTo({
          top: offset,
        });
      }
    };

    useImperativeHandle(ref, () => ({
      scrollToIndex: (index, { align } = {}) => {
        scrollToIndexSmooth(index, align);
      },
    }));

    const items = virtualizer.getVirtualItems();

    return (
      <Box
        ref={parentRef}
        position="relative"
        h={`${virtualizer.getTotalSize()}px`}
        {...rest}
      >
        <Box
          top="0"
          left="0"
          width="100%"
          position="absolute"
          style={{
            transform: `translateY(${items[0]?.start ?? 0}px)`,
          }}
        >
          {items.map((virtualItem) => (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={(node) => {
                // Defer the measurement logic
                if (node) {
                  Promise.resolve().then(() =>
                    virtualizer.measureElement(node)
                  );
                }
              }}
            >
              {children[virtualItem.index]}
            </div>
          ))}
        </Box>
      </Box>
    );
  }
);

export default VirtualBox;
