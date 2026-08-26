import Drawer, { DrawerContent } from "shared/components/Drawer";
import DebugSession from "./DebugSession";
import Icon from "shared/components/Icon";
import { useEventListener } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { ToolbarButton } from "shared/components/Toolbar";
import useMessage from "shared/hooks/useMessage";
import { ProjectSourceType } from "shared/models/enums";

const DebugSessionPreviewDrawer = ({
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
  const message = useMessage();
  const { workspaceId, projectId, branchId } = useParams();

  const onCopyUrl = () => {
    const url = `${window.location.origin}/project/${workspaceId}/${projectId}/${branchId}/${ProjectSourceType.DEBUGGER}/session/${sessionId}`;
    try {
      navigator.clipboard.writeText(url);
      message.success("Copied!");
    } catch (error) {
      message.handleError({ message: "Something went wrong!" });
    }
  };

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
        width={Math.min(720, window.innerWidth - 40)}
        maxWidth={Math.min(1200, window.innerWidth - 40)}
        height="auto"
        parentContainer={containerRef.current}
      >
        <ToolbarButton
          position="absolute"
          top="5"
          right="5"
          zIndex="11"
          onClick={onClose}
          icon={<Icon name="X" />}
          label="Close"
        />
        <ToolbarButton
          position="absolute"
          top="5"
          right="14"
          zIndex="11"
          onClick={onOpenInNewTab}
          icon={<Icon name="SquareArrowOutUpLeft" />}
          label="Open in page view"
        />
        <ToolbarButton
          position="absolute"
          top="5"
          right="23"
          zIndex="11"
          onClick={onCopyUrl}
          icon={<Icon name="Link" />}
          label="Copy URL"
        />
        <DebugSession
          key={sessionId}
          sessionId={sessionId}
          isPreviewMode={true}
        />
      </DrawerContent>
    </Drawer>
  );
};

export default DebugSessionPreviewDrawer;
