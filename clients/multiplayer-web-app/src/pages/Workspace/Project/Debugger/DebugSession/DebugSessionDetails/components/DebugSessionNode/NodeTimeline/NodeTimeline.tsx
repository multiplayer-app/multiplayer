import { Box, BoxProps, Tooltip } from "@chakra-ui/react";
import { IDebugSessionNode } from "../../../../types";
import { useDebugSession } from "../../../../DebugSessionContext";
import { formatDuration, getPosition, getWidth } from "../../../../utils";
import { useDebugSessionLayout } from "../../../../DebugSessionLayoutContext";

interface NodeTimelineProps<T> extends BoxProps {
  node: IDebugSessionNode<T>;
}

const NodeTimeline = <T,>({ node }: NodeTimelineProps<T>) => {
  const { configs, setTimeRange } = useDebugSessionLayout();
  const { sessionTime } = useDebugSession();
  if (!configs.waterfall) return;

  const selectTimeRange = () => {
    if (!node.childSpans?.length) return;
    const startTime = Math.max(node.timestamp, sessionTime.start);
    const start = startTime - sessionTime.start;
    const end = start + node.duration / 1000000;
    setTimeRange({ start, end });
  };

  return (
    <Box
      px="2"
      flexGrow={1}
      flexBasis="40%"
      minWidth="200px"
      userSelect="none"
      borderLeft="solid 1px"
      borderLeftColor="border.primary"
      onDoubleClick={selectTimeRange}
    >
      <WaterfallStep timestamp={node.timestamp} duration={node.duration} />
    </Box>
  );
};

const WaterfallStep = ({ timestamp, duration }) => {
  const { sessionTime } = useDebugSession();
  const { timeRange } = useDebugSessionLayout();
  const d = duration / 1000000;
  const time = Math.max(timestamp, sessionTime.start);
  const endTime = time + d;

  const { start, end } = timeRange
    ? {
        start: sessionTime.start + timeRange.start,
        end: sessionTime.start + timeRange.end,
      }
    : sessionTime;

  if (duration <= 0 || endTime < start || time > end) return null; //

  const position = `${getPosition(start, end, time)}%`;
  const width = `${getWidth(start, end, time, endTime)}%`;

  return (
    <Box w="full" h="full" position="relative" overflow="hidden">
      <Tooltip label={formatDuration(duration)}>
        <Box
          h="4"
          top="0"
          bottom="0"
          my="auto"
          bg="brand.500"
          position="absolute"
          borderRadius="base"
          _groupHover={{ opacity: 1 }}
          opacity="0.2"
          style={{
            left: position,
            width: width,
          }}
        />
      </Tooltip>
    </Box>
  );
};
export default NodeTimeline;
