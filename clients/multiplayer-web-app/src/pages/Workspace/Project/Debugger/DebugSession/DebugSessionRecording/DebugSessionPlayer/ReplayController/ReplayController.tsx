import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import type { playerMetaData } from "@rrweb/types";
import type { PlayerMachineState, SpeedMachineState } from "@rrweb/replay";
import {
  ArrowsCollapseIcon,
  ArrowsExpandIcon,
  RecordingIcon,
} from "shared/icons";

import {
  Box,
  Flex,
  Text,
  Icon,
  Menu,
  MenuItem,
  MenuList,
  MenuButton,
  IconButton,
  useEventListener,
} from "@chakra-ui/react";
import { ReactComponent as PlayIcon } from "assets/icons/play.svg";
import { ReactComponent as PauseIcon } from "assets/icons/pause.svg";
import { ReactComponent as ForwardIcon } from "assets/icons/forward.svg";
import { ReactComponent as BackwardsIcon } from "assets/icons/backwards.svg";
import { ReplayControllerProps, InactivePeriod, CustomEvent } from "./types";
import { speedOptions } from "../../../DebugSession.configs";
import { useFullScreenContext } from "shared/providers/FullScreenContext";
import { useDebugSession } from "../../../DebugSessionContext";
import { formatTime } from "../../../utils";
import ProgressTrack, { ProgressTrackHandle } from "./ProgressTrack";
import { normalizeTimestamp } from "../utils/normalizeTimestamp";
import debounce from "lodash.debounce";
import SnapshotAddButton from "../../../attachments/SnapshotAddButton";

const defaultTags = {};

const ReplayController = ({
  replayer,
  autoPlay,
  liveMode,
  metadata,
  tags = defaultTags,
  selectNodeByTimestamp,
}: ReplayControllerProps) => {
  const [speed, setSpeed] = useState(1);
  const { isFullscreen, toggleFullscreen, fullscreenElement } =
    useFullScreenContext();
  const [playerState, setPlayerState] = useState<"playing" | "paused" | "live">(
    "paused"
  );
  const [speedState, setSpeedState] = useState<"normal" | "skipping">("normal");
  const [meta, setMeta] = useState<playerMetaData>({
    startTime: 0,
    endTime: 0,
    totalTime: 0,
  });
  const { path } = useParams();
  const [finished, setFinished] = useState(false);
  const [skipInactiveState, setSkipInactiveState] = useState(true);

  const timerRef = useRef<number | null>(null);

  // All time tracking lives in refs — zero React re-renders for position updates
  const pauseAtRef = useRef<number | false>(false);
  const loopRef = useRef<{ start: number; end: number } | null>(null);
  const onPauseHookRef = useRef<(() => unknown) | null>(null);
  const currentTimeRef = useRef(0);
  const playerStateRef = useRef<"playing" | "paused" | "live">("paused");
  const finishedRef = useRef(false);
  const metaRef = useRef(meta);

  // Imperative DOM refs for time display and progress bar
  const progressTrackRef = useRef<ProgressTrackHandle>(null);
  const timeDisplayRef = useRef<HTMLParagraphElement>(null);

  // Keep refs in sync with state
  metaRef.current = meta;
  playerStateRef.current = playerState;
  finishedRef.current = finished;

  // Seek throttle: prevent multiple replayer.pause() calls per animation frame
  const seekRafRef = useRef<number | null>(null);
  const pendingSeekRef = useRef<{ time: number; play?: boolean } | null>(null);

  const { onSeekRef } = useDebugSession();

  // Imperatively update progress bar and time display — no React re-render
  const updateTimeDisplay = useCallback((timeMs: number) => {
    const totalTime = metaRef.current.totalTime;
    currentTimeRef.current = timeMs;
    if (progressTrackRef.current && totalTime > 0) {
      progressTrackRef.current.setProgress(timeMs / totalTime);
    }
    if (timeDisplayRef.current) {
      timeDisplayRef.current.textContent = formatTime(
        normalizeTimestamp(timeMs)
      );
    }
  }, []);

  // Register updateTimeDisplay as the seek callback so external seeks
  // (e.g. clicking a node in the details panel) update the progress bar
  useEffect(() => {
    onSeekRef.current = updateTimeDisplay;
    return () => {
      onSeekRef.current = null;
    };
  }, [onSeekRef, updateTimeDisplay]);

  useEffect(() => {
    const handleStateChange = debounce(
      (states: { player?: PlayerMachineState; speed?: SpeedMachineState }) => {
        const { player, speed } = states;
        setPlayerState((prev) => {
          if (player?.value && prev !== player.value) {
            switch (player.value) {
              case "playing":
                loopTimer();
                break;
              case "paused":
                stopTimer();
                break;
              default:
                break;
            }
            return player.value;
          } else {
            return prev;
          }
        });
        setSpeedState((prev) => {
          if (speed?.value && prev !== speed.value) {
            return speed.value;
          } else {
            return prev;
          }
        });
      },
      100
    );

    const handleFinish = () => {
      setFinished(true);
      finishedRef.current = true;
    };

    if (replayer) {
      replayer.on("state-change", handleStateChange);
      replayer.on("finish", handleFinish);
      setMeta(replayer.getMetaData());

      if (autoPlay) {
        replayer.play();
      }

      return () => {
        replayer.off("state-change", handleStateChange);
        replayer.off("finish", handleFinish);
        stopTimer();
      };
    }
  }, [replayer, autoPlay, tags]);

  useEffect(() => {
    if (path && replayer) {
      replayer.pause();
    }
  }, [path]);

  useEffect(() => {
    if (replayer && skipInactiveState !== replayer.config.skipInactive) {
      replayer.setConfig({ skipInactive: skipInactiveState });
    }
  }, [skipInactiveState, replayer]);

  const loopTimer = useCallback(() => {
    stopTimer();

    const update = () => {
      const cTime = replayer.getCurrentTime();
      currentTimeRef.current = cTime;

      const pAt = pauseAtRef.current;
      if (pAt && cTime >= pAt) {
        const l = loopRef.current;
        if (l) {
          playRange(l.start, l.end, true, undefined);
        } else {
          replayer.pause();
          const hook = onPauseHookRef.current;
          if (hook) {
            hook();
            onPauseHookRef.current = null;
          }
        }
      }

      updateTimeDisplay(cTime);

      const totalTime = metaRef.current.totalTime;
      if (cTime < totalTime) {
        timerRef.current = requestAnimationFrame(update);
      }
    };

    timerRef.current = requestAnimationFrame(update);
  }, [replayer]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
    // Flush final position on stop — read directly from replayer to catch
    // external seeks (e.g. context calling replayer.pause() directly)
    if (replayer) {
      const t = replayer.getCurrentTime();
      currentTimeRef.current = t;
      updateTimeDisplay(t);
    }
  }, [replayer, updateTimeDisplay]);

  const play = useCallback(() => {
    if (playerStateRef.current !== "paused") {
      return;
    }
    if (finishedRef.current) {
      replayer.play();
      setFinished(false);
      finishedRef.current = false;
    } else {
      replayer.play(currentTimeRef.current);
    }
  }, [replayer]);

  const pause = useCallback(() => {
    if (playerStateRef.current !== "playing") {
      return;
    }
    replayer.pause();
    pauseAtRef.current = false;
  }, [replayer]);

  const toggle = useCallback(() => {
    switch (playerStateRef.current) {
      case "playing":
        pause();
        break;
      case "paused":
        play();
        break;
      default:
        break;
    }
  }, [play, pause]);

  // rAF-throttled seek: coalesces multiple seek requests into one per frame.
  // This is the key optimization for drag-seek on large mutation chunks.
  const flushSeek = useCallback(() => {
    seekRafRef.current = null;
    const pending = pendingSeekRef.current;
    if (!pending || !replayer || liveMode) return;
    pendingSeekRef.current = null;

    const t = normalizeTimestamp(
      Math.min(pending.time, metaRef.current.totalTime)
    );

    if (t === 0) {
      replayer.play(0);
      setTimeout(() => {
        replayer.pause(0);
      }, 10);
    } else {
      replayer.pause(t);
    }

    const resumePlaying =
      typeof pending.play === "boolean"
        ? pending.play
        : playerStateRef.current === "playing";
    if (resumePlaying) {
      replayer.play(t);
    }
    currentTimeRef.current = t;
    updateTimeDisplay(t);
    pauseAtRef.current = false;
    setFinished(false);
    finishedRef.current = false;
  }, [replayer, liveMode, updateTimeDisplay]);

  const goto = useCallback(
    (timeOffset: number, play?: boolean) => {
      if (!replayer || liveMode) return;
      pendingSeekRef.current = { time: timeOffset, play };
      if (seekRafRef.current === null) {
        seekRafRef.current = requestAnimationFrame(flushSeek);
      }
    },
    [replayer, liveMode, flushSeek]
  );

  // Cleanup pending seek rAF on unmount
  useEffect(() => {
    return () => {
      if (seekRafRef.current !== null) {
        cancelAnimationFrame(seekRafRef.current);
      }
    };
  }, []);

  const playRange = useCallback(
    (
      timeOffset: number,
      endTimeOffset: number,
      startLooping = false,
      afterHook: undefined | (() => void) = undefined
    ) => {
      if (startLooping) {
        loopRef.current = { start: timeOffset, end: endTimeOffset };
      } else {
        loopRef.current = null;
      }
      const t = normalizeTimestamp(timeOffset);
      currentTimeRef.current = t;
      updateTimeDisplay(t);
      pauseAtRef.current = normalizeTimestamp(endTimeOffset);
      onPauseHookRef.current = afterHook || null;
      replayer.play(timeOffset);
    },
    [replayer]
  );

  const onSpeedChange = useCallback(
    (newSpeed: number) => {
      setSpeed(newSpeed);
      const needFreeze = playerStateRef.current === "playing";
      replayer.setConfig({ speed: newSpeed });
      if (needFreeze) {
        replayer.pause();
        replayer.play(currentTimeRef.current);
      }
    },
    [replayer]
  );

  const toggleSkipInactive = useCallback(() => {
    setSkipInactiveState((prev) => !prev);
  }, []);

  const handleProgressKeydown = useCallback(
    (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLButtonElement ||
        event.target instanceof HTMLSelectElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLAnchorElement
      ) {
        return;
      }
      if (speedState === "skipping") {
        return;
      }
      if (event.key === "ArrowLeft") {
        goto(replayer.getCurrentTime() - 5000);
      } else if (event.key === "ArrowRight") {
        goto(replayer.getCurrentTime() + 5000);
      }
    },
    [goto, replayer, speedState]
  );

  useEventListener("keydown", handleProgressKeydown);

  const selectableIndicatorTypes = useMemo(
    () => new Set(["Console log", "Console warn", "Console info"]),
    []
  );

  const onIndicatorClick = useCallback(
    (indicator: CustomEvent | InactivePeriod) => {
      goto(indicator.timeOffset);
      const sourceName =
        "sourceName" in indicator
          ? indicator.sourceName ?? indicator.name
          : indicator.name;

      if (selectableIndicatorTypes.has(sourceName)) {
        selectNodeByTimestamp(indicator.timestamp);
      }
    },
    [goto, selectNodeByTimestamp, selectableIndicatorTypes]
  );

  const isFullscreenDisabled = useMemo(() => {
    return fullscreenElement && !isFullscreen;
  }, [fullscreenElement, isFullscreen]);

  return (
    <Box
      px="2"
      pb="2"
      pt="1"
      borderTop="solid 1px"
      borderTopColor="border.primary"
      pointerEvents={replayer ? "inherit" : "none"}
      opacity={replayer ? 1 : 0.5}
    >
      <ProgressTrack
        ref={progressTrackRef}
        onSeek={goto}
        liveMode={liveMode}
        speedState={speedState}
        totalTime={meta.totalTime}
        onIndicatorClick={onIndicatorClick}
      />
      <Flex alignItems="center" overflowX="auto">
        <Box flex="1">
          {liveMode ? (
            <Flex gap="1" alignItems="center">
              <Icon as={RecordingIcon} />
              Live
            </Flex>
          ) : (
            <Flex alignItems="center" gap="1">
              <Flex
                p="1"
                gap="0.5"
                bg="bg.subtle"
                color="muted"
                fontSize="10px"
                textAlign="center"
                alignItems="center"
                borderRadius="base"
                fontFamily="JetBrains Mono, sans-serif"
                display="inline-flex"
              >
                <Text minW="32px" ref={timeDisplayRef}>
                  {formatTime(0)}
                </Text>
                /<Text minW="32px">{formatTime(meta.totalTime)}</Text>
              </Flex>
              <SnapshotAddButton />
            </Flex>
          )}
        </Box>

        <Flex
          gap="1"
          flex="1"
          fontSize="13px"
          alignItems="center"
          justifyContent="center"
        >
          <Menu>
            <MenuButton
              as={IconButton}
              size="xs"
              variant="base"
              disabled={speedState === "skipping" || liveMode}
              icon={<>{speed}x</>}
            />
            <MenuList minW="8" zIndex={12}>
              {speedOptions.map((s, index) => (
                <MenuItem key={index} onClick={() => onSpeedChange(s)}>
                  {s}x
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          <IconButton
            p="0"
            size="xs"
            variant="base"
            color="muted"
            aria-label="Forward"
            isDisabled={liveMode}
            onClick={() => goto(currentTimeRef.current - 15000)}
            icon={<Icon boxSize="5" as={BackwardsIcon} />}
          />
          <IconButton
            p="0"
            size="xs"
            color="body"
            variant="base"
            onClick={toggle}
            isDisabled={liveMode}
            icon={
              <Icon
                boxSize="5"
                as={
                  playerState === "playing" || liveMode ? PauseIcon : PlayIcon
                }
              />
            }
            aria-label={
              playerState === "playing" || liveMode ? "Pause" : "Play"
            }
          />
          <IconButton
            p="0"
            size="xs"
            variant="base"
            color="muted"
            isDisabled={liveMode}
            aria-label="Forward"
            onClick={() => goto(currentTimeRef.current + 15000)}
            icon={<Icon boxSize="5" as={ForwardIcon} />}
          />
          <IconButton
            p="0"
            size="xs"
            variant="base"
            color="muted"
            aria-label="FullScreen"
            isDisabled={isFullscreenDisabled}
            onClick={toggleFullscreen}
            icon={
              <Icon
                boxSize="5"
                as={isFullscreen ? ArrowsCollapseIcon : ArrowsExpandIcon}
              />
            }
          />
        </Flex>

        <Box flex="1" textAlign="right">
          <Flex
            p="1"
            gap="1"
            bg="bg.subtle"
            color="muted"
            fontSize="10px"
            textAlign="center"
            alignItems="center"
            borderRadius="base"
            fontFamily="JetBrains Mono, sans-serif"
            display="inline-flex"
          >
            <Text>{metadata?.width | 0}</Text>x
            <Text>{metadata?.height | 0}</Text>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};

export default ReplayController;
