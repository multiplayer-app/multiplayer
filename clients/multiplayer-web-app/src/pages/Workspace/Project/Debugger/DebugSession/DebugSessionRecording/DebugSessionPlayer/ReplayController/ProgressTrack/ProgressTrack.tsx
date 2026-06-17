import { Box, Icon } from "@chakra-ui/react";
import React, {
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
  memo,
} from "react";
import { ReactComponent as IndicatorIcon } from "assets/icons/indicator.svg";
import { ReactComponent as ProgressHandleIcon } from "assets/icons/progress-handle.svg";
import { CustomEvent, InactivePeriod } from "../types";
import { useCustomEventsState } from "../../hooks/useCustomEventsState";

export interface ProgressTrackHandle {
  setProgress: (percent: number) => void;
}

interface ProgressTrackProps {
  totalTime: number;
  liveMode: boolean;
  speedState: "normal" | "skipping";
  disabled?: boolean;
  onSeek: (timeOffset: number) => void;
  onIndicatorClick: (indicator: CustomEvent | InactivePeriod) => void;
}

const moveThreshold = 5;

const ProgressTrack = memo(
  forwardRef<ProgressTrackHandle, ProgressTrackProps>(
    (
      { disabled, liveMode, totalTime, speedState, onSeek, onIndicatorClick },
      ref
    ) => {
      const progressRef = useRef<HTMLDivElement>(null);
      const fillRef = useRef<HTMLDivElement>(null);
      const handleRef = useRef<SVGSVGElement>(null);
      const { noteIndicators, inactivePeriods, events } =
        useCustomEventsState();

      // Imperative DOM update — called from rAF loop, bypasses React entirely
      useImperativeHandle(
        ref,
        () => ({
          setProgress(percent: number) {
            const p = `${100 * Math.min(1, Math.max(0, percent))}%`;
            if (fillRef.current) fillRef.current.style.width = p;
            if (handleRef.current) handleRef.current.style.left = p;
          },
        }),
        []
      );

      const isDraggingRef = useRef(false);
      const initialMouseXRef = useRef<number | null>(null);

      const onSeekRef = useRef(onSeek);
      const totalTimeRef = useRef(totalTime);
      const speedStateRef = useRef(speedState);
      const liveModeRef = useRef(liveMode);
      onSeekRef.current = onSeek;
      totalTimeRef.current = totalTime;
      speedStateRef.current = speedState;
      liveModeRef.current = liveMode;

      const getPercentFromEvent = useCallback((clientX: number) => {
        const progressRect = progressRef.current!.getBoundingClientRect();
        const x = clientX - progressRect.left;
        return Math.max(0, Math.min(1, x / progressRect.width));
      }, []);

      const handleProgressClick = useCallback(
        (event: React.MouseEvent) => {
          if (speedStateRef.current === "skipping") return;
          const percent = getPercentFromEvent(event.clientX);
          onSeekRef.current(totalTimeRef.current * percent);
        },
        [getPercentFromEvent]
      );

      const handleMouseDown = useCallback(
        (event: React.MouseEvent) => {
          if (speedStateRef.current === "skipping" || liveModeRef.current)
            return;
          initialMouseXRef.current = event.clientX;
          isDraggingRef.current = false;
          document.body.classList.add("no-select");

          const handleMouseMove = (e: MouseEvent) => {
            if (
              speedStateRef.current === "skipping" ||
              initialMouseXRef.current === null ||
              liveModeRef.current
            )
              return;

            if (!isDraggingRef.current) {
              const deltaX = Math.abs(e.clientX - initialMouseXRef.current);
              if (deltaX > moveThreshold) {
                isDraggingRef.current = true;
              }
            }

            if (isDraggingRef.current) {
              const percent = getPercentFromEvent(e.clientX);
              // Update DOM directly for instant visual feedback during drag
              const p = `${100 * percent}%`;
              if (fillRef.current) fillRef.current.style.width = p;
              if (handleRef.current) handleRef.current.style.left = p;
              onSeekRef.current(totalTimeRef.current * percent);
            }
          };

          const handleMouseUp = () => {
            isDraggingRef.current = false;
            initialMouseXRef.current = null;
            document.body.classList.remove("no-select");
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
          };

          window.addEventListener("mousemove", handleMouseMove);
          window.addEventListener("mouseup", handleMouseUp);
        },
        [getPercentFromEvent]
      );

      return (
        <Box
          mt="4"
          mb="2"
          mx="2"
          py="1"
          pointerEvents={disabled ? "none" : "auto"}
          cursor={
            speedState === "skipping" || liveMode ? "not-allowed" : "pointer"
          }
          onClick={handleProgressClick}
        >
          <Box
            h="1"
            bg="bg.muted"
            borderRadius="sm"
            position="relative"
            ref={progressRef}
          >
            <Box
              h="1"
              top="0"
              left="0"
              bg="brand.500"
              position="absolute"
              width="0%"
              transition="width 100ms linear"
              ref={fillRef}
            />
            <InactivePeriodsList
              inactivePeriods={inactivePeriods}
              onIndicatorClick={onIndicatorClick}
            />
            <IndicatorsList
              events={events}
              onIndicatorClick={onIndicatorClick}
            />
            <IndicatorsList
              events={noteIndicators}
              onIndicatorClick={onIndicatorClick}
            />
            <Icon
              top="50%"
              left="0%"
              position="absolute"
              transform="translate(-50%, -50%)"
              transition="left 100ms linear"
              as={ProgressHandleIcon}
              __css={{ path: { stroke: "bg.primary" } }}
              onMouseDown={handleMouseDown}
              ref={handleRef}
            />
          </Box>
        </Box>
      );
    }
  )
);

const InactivePeriodsList = memo(
  ({
    inactivePeriods,
    onIndicatorClick,
  }: {
    inactivePeriods: InactivePeriod[];
    onIndicatorClick: (event: InactivePeriod) => void;
  }) => {
    return (
      <>
        {inactivePeriods.map((period, index) => (
          <Box
            h="full"
            key={index}
            opacity="0.1"
            title={period.name}
            position="absolute"
            width={period.width}
            left={period.position}
            bg={period.background}
            onClick={() => onIndicatorClick(period)}
          />
        ))}
      </>
    );
  }
);

const IndicatorsList = memo(
  ({
    events,
    onIndicatorClick,
  }: {
    events: CustomEvent[];
    onIndicatorClick: (event: CustomEvent) => void;
  }) => {
    return (
      <>
        {events.map((event, index) => (
          <Icon
            key={index}
            boxSize="12px"
            aria-label={event.name}
            title={event.name}
            bottom="100%"
            left={event.position}
            color={event.background}
            onClick={(e) => {
              e.stopPropagation();
              onIndicatorClick(event);
            }}
            as={IndicatorIcon}
            position="absolute"
            transform="translate(-50%, -50%)"
          />
        ))}
      </>
    );
  }
);

export default ProgressTrack;
