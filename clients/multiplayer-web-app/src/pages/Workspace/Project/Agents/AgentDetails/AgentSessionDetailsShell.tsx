import { Box, Flex, useBreakpointValue } from "@chakra-ui/react";

import SplitLayoutHorizontal from "shared/components/SplitLayoutHorizontal";

import { AgentSessionChatColumn } from "./AgentSessionChatColumn";
import SessionSidePanel from "./AgentSessionSidePanel/SessionSidePanel";
import { IAgentChat } from "@multiplayer/types";

const SPLIT_INITIAL_WIDTH = ["50%", "50%"];

export type AgentSessionPanelControls = {
  sidePanelOpen: boolean;
  sidePanelTab: number;
  setSidePanelTab: (index: number) => void;
  setSidePanelOpen: (open: boolean) => void;
};

type AgentSessionDetailsShellProps = {
  session: IAgentChat;
  panel: AgentSessionPanelControls;
  forceOverlayLayout?: boolean;
};

export function AgentSessionDetailsShell({
  session,
  panel,
  forceOverlayLayout = false,
}: AgentSessionDetailsShellProps) {
  const breakpointIsDesktop =
    useBreakpointValue({ base: false, md: true }, { ssr: false }) === true;
  const isDesktop = !forceOverlayLayout && breakpointIsDesktop;

  const panelEl = panel.sidePanelOpen ? (
    <SessionSidePanel
      session={session}
      tabIndex={panel.sidePanelTab}
      onTabChange={panel.setSidePanelTab}
    />
  ) : null;

  if (isDesktop) {
    return (
      <Flex minH="0" flex="1" overflow="hidden" w="full" direction="column">
        <SplitLayoutHorizontal
          key={panel.sidePanelOpen ? "split-open" : "split-collapsed"}
          flex="1"
          minH="0"
          {...(panel.sidePanelOpen
            ? { initialWidth: SPLIT_INITIAL_WIDTH }
            : {})}
        >
          <AgentSessionChatColumn />
          {panelEl}
        </SplitLayoutHorizontal>
      </Flex>
    );
  }

  return (
    <Flex
      position="relative"
      flex="1"
      minH="0"
      minW="0"
      overflow="hidden"
      w="full"
      direction="column"
    >
      <AgentSessionChatColumn />
      {panel.sidePanelOpen ? (
        <>
          <Box
            position="absolute"
            inset="0"
            zIndex={1}
            bg="blackAlpha.600"
            aria-hidden
            onClick={() => panel.setSidePanelOpen(false)}
          />
          <Flex
            position="absolute"
            top="0"
            right="0"
            bottom="0"
            zIndex={2}
            maxW="100%"
            flexDirection="column"
            bg="bg.primary"
            borderColor="border.primary"
            boxShadow="2xl"
            {...(forceOverlayLayout
              ? { w: "min(100%, 40rem)", borderLeftWidth: "1px" }
              : {
                  w: { base: "100%", sm: "min(100vw, 28rem)" },
                  borderLeftWidth: { base: "0", sm: "1px" },
                })}
          >
            {panelEl}
          </Flex>
        </>
      ) : null}
    </Flex>
  );
}
