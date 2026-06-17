import { Box, Flex } from "@chakra-ui/react";
import { useDebugSessionLayout } from "../../../DebugSessionLayoutContext";
import { useDebugSession } from "../../../DebugSessionContext";
import { formatDuration } from "../../../utils";
import { useState, useEffect, useRef } from "react";

interface TimelineHeaderProps {}

const TimelineHeader = (props: TimelineHeaderProps) => {
  const selectableBox = useRef();
  const { sessionTime } = useDebugSession();
  const { timeRange, setTimeRange } = useDebugSessionLayout();
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);

  const currentStart = timeRange ? timeRange.start : 0;
  const currentEnd = timeRange ? timeRange.end : sessionTime.total;
  const currentRange = currentEnd - currentStart;

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isSelecting && selectionStart !== null) {
        const timelineBox = selectableBox.current;
        if (timelineBox) {
          const timelineWidth = (timelineBox as HTMLElement).clientWidth;
          let currentPosition =
            ((event.clientX -
              (timelineBox as HTMLElement).getBoundingClientRect().left) /
              timelineWidth) *
            currentRange;
          currentPosition += currentStart;
          setSelectionEnd(currentPosition);
        }
      }
    };

    const handleMouseUp = () => {
      if (selectionStart !== null && selectionEnd !== null) {
        const start = Math.min(selectionStart, selectionEnd);
        const end = Math.max(selectionStart, selectionEnd);
        setTimeRange({
          start: Math.max(start, 0),
          end: Math.min(end, sessionTime.total),
        });
      }
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    if (isSelecting) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isSelecting, selectionStart, selectionEnd, currentRange, currentStart]);

  const handleMouseDown = (event: React.MouseEvent) => {
    const timelineBox = selectableBox.current;
    if (timelineBox) {
      const timelineWidth = (timelineBox as HTMLElement).clientWidth;
      let startPosition = Math.max(
        ((event.clientX -
          (timelineBox as HTMLElement).getBoundingClientRect().left) /
          timelineWidth) *
          currentRange,
        0
      );
      startPosition += currentStart;
      setSelectionStart(startPosition);
      setIsSelecting(true);
    }
  };

  const renderSelectionIndicator = () => {
    if (selectionStart === null || selectionEnd === null) return null;

    const indicatorStart = Math.min(selectionStart, selectionEnd);
    const indicatorEnd = Math.max(selectionStart, selectionEnd);
    const left = `${((indicatorStart - currentStart) / currentRange) * 100}%`;
    const width = `${((indicatorEnd - indicatorStart) / currentRange) * 100}%`;

    return (
      <Box
        position="absolute"
        top="0"
        left={left}
        width={width}
        height="100%"
        bg="blue.200"
        opacity="0.5"
        pointerEvents="none"
      />
    );
  };

  const start = currentStart;
  const end = currentEnd;

  return (
    <Flex
      borderBottom="solid 1px"
      borderBottomColor="border.primary"
      position="sticky"
      top="0"
      bg="bg.primary"
      zIndex="2"
      // minW="800px"
    >
      <Box width="60%" minW="500px" />
      <Box
        px="2"
        width="40%"
        userSelect="none"
        borderLeft="solid 1px"
        borderLeftColor="border.primary"
      >
        <Flex
          fontSize="10px"
          lineHeight="1"
          pt="2"
          color="muted"
          ref={selectableBox}
          position="relative"
          alignItems="flex-end"
          cursor="vertical-text"
          onMouseDown={handleMouseDown}
          justifyContent="space-between"
          overflow="hidden"
        >
          {renderSelectionIndicator()}
          <Flex direction="column" alignItems="flex-start" gap="0.5">
            {formatDuration(start * 1000000)}
            <Line h="3" />
          </Flex>
          <Line h="2" />
          <Flex direction="column" alignItems="center" gap="0.5">
            {formatDuration(((end + start) / 2) * 1000000)}
            <Line h="3" />
          </Flex>
          <Line h="2" />
          <Flex direction="column" alignItems="flex-end" gap="0.5">
            {formatDuration(end * 1000000)}
            <Line h="3" />
          </Flex>
        </Flex>
      </Box>
    </Flex>
  );
};

const Line = ({ h }) => {
  return (
    <Box
      h={h}
      as="span"
      borderLeft="solid 1px"
      borderLeftColor="border.primary"
    />
  );
};

export default TimelineHeader;
