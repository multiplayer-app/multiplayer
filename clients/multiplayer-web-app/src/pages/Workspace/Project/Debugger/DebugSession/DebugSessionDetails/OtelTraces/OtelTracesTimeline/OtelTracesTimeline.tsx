import { useMemo } from "react";
import { Box, Flex, Icon, IconButton, Text, Tooltip } from "@chakra-ui/react";
import { useDebugSession } from "../../../DebugSessionContext";
import { formatTime } from "../../../utils";
import { PinIcon } from "shared/icons";
import {
  ITraceNode,
  IDebugSessionNode,
  DebugSessionNodeType,
} from "../../../types";
import { useDebugSessionLayout } from "../../../DebugSessionLayoutContext";

interface OtelTracesTimelineProps {}

const OtelTracesTimeline = (props: OtelTracesTimelineProps) => {
  const { configs, setConfigs } = useDebugSessionLayout();
  const { sessionTime, sessionNodes } = useDebugSession();
  const traces = sessionNodes[DebugSessionNodeType.Trace];

  const { start, total } = sessionTime;
  const splitRatio = Math.ceil(total / 120000) * 1000;
  const segments = Math.ceil(total / splitRatio) || 1;
  const segmentW = `${(1 / segments) * 100}%`;

  const tracesPerSegment = useMemo(() => {
    const segmentsMap = new Array(segments).fill(0);
    traces.forEach((node: IDebugSessionNode<ITraceNode>) => {
      // Some traces are recorded before the session starts (e.g. Document load)
      const relativeTime = Math.max(node.timestamp - start, 0);
      const segmentIndex = Math.floor(relativeTime / splitRatio);
      if (segmentIndex < segments) {
        segmentsMap[segmentIndex]++;
      }
    });
    return segmentsMap;
  }, [traces, start, segments]);

  const maxTraces = Math.max(...tracesPerSegment);

  return (
    <Box
      px="4"
      pt="3"
      pb="2"
      top="0"
      bg="bg.primary"
      zIndex="10"
      borderBottom="solid 1px"
      borderBottomColor="border.primary"
      minWidth="500px"
      position={configs.tracesTimelinePinned ? "sticky" : "relative"}
    >
      <Box
        height="12"
        position="relative"
        background={`repeating-linear-gradient(
        90deg,
        var(--chakra-colors-border-primary),
        var(--chakra-colors-border-primary) 1px,
        transparent 1px,
        transparent ${segmentW}
      );`}
      >
        {tracesPerSegment.map((count, index) => {
          const barHeight = maxTraces > 0 ? (count / maxTraces) * 100 : 0; // Calculate height as a percentage

          return (
            <Box
              key={index}
              px="2px"
              bottom="0"
              position="absolute"
              left={`${(index / segments) * 100}%`}
              w={segmentW}
              h={`${barHeight}%`}
            >
              <Tooltip label={count}>
                <Box
                  bg="bg.muted"
                  h="full"
                  w="full"
                  m="auto"
                  borderRadius="sm"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                />
              </Tooltip>
            </Box>
          );
        })}
      </Box>
      <Flex
        mt="2"
        alignItems="center"
        justifyContent="space-between"
        fontSize="12px"
        color="muted"
      >
        <Text>{formatTime(0)}</Text>
        <Text>{formatTime(total / 3)}</Text>
        <Text>{formatTime(total / 2)}</Text>
        <Text>{formatTime(total)}</Text>
      </Flex>
      <IconButton
        size="xs"
        borderRadius="base"
        icon={<Icon as={PinIcon} />}
        aria-label="pin"
        position="absolute"
        top="2"
        right="2"
        variant={configs.tracesTimelinePinned ? "primary" : "outline"}
        onClick={() =>
          setConfigs((prev) => ({
            ...prev,
            tracesTimelinePinned: !prev.tracesTimelinePinned,
          }))
        }
      />
    </Box>
  );
};

export default OtelTracesTimeline;
