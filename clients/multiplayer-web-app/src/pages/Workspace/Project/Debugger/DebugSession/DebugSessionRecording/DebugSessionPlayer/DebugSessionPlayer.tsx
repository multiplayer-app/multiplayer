import { Replayer } from "rrweb";
import { Box, Flex } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import {
  EventType,
  eventWithTime,
  viewportResizeDimension,
} from "@rrweb/types";

import { FullScreenProvider } from "shared/providers/FullScreenContext";

import { useDebugSession } from "../../DebugSessionContext";
import { useDebugSessionLayout } from "../../DebugSessionLayoutContext";

import ReplayController from "./ReplayController";
import { CanvasReplayerPlugin } from "./canvas-plugin";
import ReplayerOverlay, {
  Toolbar,
  ReplayerOverlayProvider,
} from "./ReplayerOverlay";

import "./DebugSessionPlayer.scss";
import {
  RoleType,
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from "@multiplayer/types";
import CheckAccess from "shared/components/CheckAccess";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

interface DebugSessionPlayerProps {
  events: eventWithTime[];
  metadata: any;
}

const timeOffsets = new Map<string, number>();

const DebugSessionPlayer = ({ events, metadata }: DebugSessionPlayerProps) => {
  const {
    session,
    setMetadata,
    setPlayerRef,
    setCustomSeekTime,
    selectNodeByTimestamp,
  } = useDebugSession();

  const { isSandbox } = useProjectSandbox();
  const { playerContainer } = useDebugSessionLayout();
  const [replayer, setReplayer] = useState<Replayer>(null);
  const replayDimensionRef = useRef<viewportResizeDimension>();
  const playerFrameRef = useRef<HTMLDivElement>();
  const liveMode = session && !session.stoppedAt;

  useEffect(() => {
    if (replayer || (events.length < 2 && !liveMode)) return;

    const newPlayer = new Replayer(events, {
      root: playerFrameRef.current,
      skipInactive: true,
      plugins: [CanvasReplayerPlugin(events) as unknown],
      mouseTail: {
        duration: 500, // shorten trail from default 500ms
        lineWidth: 1, // thinner = cheaper paint
      },
      showDebug: false,
      showWarning: false,
      useVirtualDom: true,
      pauseAnimation: false,
      UNSAFE_replayCanvas: false,
      liveMode,
      logger: {
        log: () => {},
        warn: () => {},
      },
    });
    if (liveMode) {
      newPlayer.startLive();
    }
    setReplayer(newPlayer);
    setPlayerRef(newPlayer);

    const resizeObserver = new ResizeObserver(() => {
      handleResize(newPlayer);
    });

    newPlayer.on("fullsnapshot-rebuilded", (e) => {
      newPlayer.iframe.contentDocument.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    newPlayer.on("event-cast", (e: eventWithTime) => {
      if (e.type === EventType.Meta) {
        setMetadata(e);
      }
    });

    newPlayer.on("resize", (dimensions: viewportResizeDimension) =>
      updatePlayerDimensions(dimensions, newPlayer)
    );

    resizeObserver.observe(playerContainer.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [liveMode, setPlayerRef]);

  const updatePlayerDimensions = (
    replayDimensions: viewportResizeDimension | undefined,
    player: Replayer
  ) => {
    if (!replayDimensions || !player) return;

    const { width: parentWidth, height: parentHeight } =
      playerFrameRef.current?.parentElement?.getBoundingClientRect() || {};
    const scale = Math.min(
      parentWidth / replayDimensions.width,
      parentHeight / replayDimensions.height,
      1
    );

    replayDimensionRef.current = replayDimensions;
    player.wrapper.style.transform = `scale(${scale})`;
  };

  const handleResize = (player: Replayer) => {
    if (
      !replayDimensionRef ||
      !replayDimensionRef.current ||
      !playerContainer.current ||
      !player
    ) {
      return;
    }

    const { width: parentWidth, height: parentHeight } =
      playerContainer.current.getBoundingClientRect();
    const scale = Math.min(
      parentWidth / replayDimensionRef.current.width,
      parentHeight / replayDimensionRef.current.height,
      1
    );

    player.wrapper.style.transform = `scale(${scale})`;
  };

  useEffect(() => {
    if (!replayer || !session || liveMode) return;

    const timeOffset = timeOffsets.get(session?._id) || 0;
    if (timeOffset) {
      setCustomSeekTime(timeOffset);
    }
    return () => {
      if (replayer) {
        setPlayerRef(null);
        timeOffsets.set(session?._id, replayer?.getCurrentTime() || 0);
      }
    };
  }, [replayer, session, liveMode]);

  return (
    <FullScreenProvider
      flex="1"
      minH="0"
      bg="bg.primary"
      borderRadius="lg"
      direction="column"
    >
      <ReplayerOverlayProvider replayer={replayer}>
        <Flex direction="column" flex={1}>
          {!liveMode && (
            <CheckAccess
              scope={RoleType.PROJECT}
              permission={RoleAccessAction.CREATE}
              entity={RoleProjectPermissionEntity.SESSION_NOTES}
              bypassPermissions={isSandbox}
            >
              <Toolbar />
            </CheckAccess>
          )}
          <Flex
            flex={1}
            overflow="hidden"
            ref={playerContainer}
            position="relative"
            bg="bg.surface"
            alignItems="center"
            justifyContent="center"
            className="player-frame"
          >
            <Box
              position="absolute"
              className="player-frame__content"
              ref={playerFrameRef}
            />
            {replayer && !liveMode && (
              <CheckAccess
                scope={RoleType.PROJECT}
                permission={RoleAccessAction.READ}
                entity={RoleProjectPermissionEntity.SESSION_NOTES}
              >
                <ReplayerOverlay
                  replayer={replayer}
                  containerRef={playerContainer}
                />
              </CheckAccess>
            )}
          </Flex>
        </Flex>

        <ReplayController
          autoPlay={false}
          metadata={metadata}
          replayer={replayer}
          liveMode={liveMode}
          selectNodeByTimestamp={selectNodeByTimestamp}
        />
      </ReplayerOverlayProvider>
    </FullScreenProvider>
  );
};

export default DebugSessionPlayer;
