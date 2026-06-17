import Drawer, { DrawerContent } from "shared/components/Drawer";
import Icon from "shared/components/Icon";
import { Box, useEventListener } from "@chakra-ui/react";
import { ToolbarButton } from "shared/components/Toolbar";
import AgentDetails from "./AgentDetails";

const AgentSessionPreviewDrawer = ({
  sessionId,
  onClose,
  onOpenInNewTab,
  containerRef,
}: {
  sessionId: string;
  onClose: () => void;
  onOpenInNewTab: (e: React.MouseEvent<any>) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}) => {
  useEventListener("keydown", (e) => {
    if (!sessionId) return;
    if (e.key === "Escape") {
      onClose();
    }
  });

  if (!sessionId) return null;

  return (
    <Drawer isOpen={!!sessionId}>
      <DrawerContent
        height="auto"
        width={Math.min(720, window.innerWidth - 40)}
        maxWidth={Math.min(1200, window.innerWidth - 40)}
        parentContainer={containerRef.current}
      >
        <Box
          flex="1"
          minH="0"
          h="full"
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
          <AgentDetails
            sessionId={sessionId}
            isPreviewMode
            toolbarExtraRight={
              <>
                <ToolbarButton
                  onClick={onOpenInNewTab}
                  icon={<Icon name="SquareArrowOutUpLeft" />}
                  label="Open in page view"
                />
                <ToolbarButton
                  onClick={onClose}
                  icon={<Icon name="X" />}
                  label="Close"
                />
              </>
            }
          />
        </Box>
      </DrawerContent>
    </Drawer>
  );
};

export default AgentSessionPreviewDrawer;
