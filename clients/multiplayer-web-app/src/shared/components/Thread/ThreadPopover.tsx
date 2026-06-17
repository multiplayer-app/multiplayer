import {
  Box,
  Popover,
  BoxProps,
  useDisclosure,
  PopoverTrigger,
  PopoverContent,
  PlacementWithLogical,
} from "@chakra-ui/react";
import {
  ThreadStatus,
  ThreadUpdatePayload,
  CommentCreatePayload,
} from "@multiplayer/types";
import { memo, useEffect, useState } from "react";
import ThreadContent from "./ThreadContent";
import WorkspaceUserAvatar from "../WorkspaceUserAvatar";
import { useWorkspaceUsers } from "shared/providers/WorkspaceContext";

let timeout = null;
let openTimeout = null;
let saveTimeout = null;
let isDragging = false;
let isPointerDown = false;
let initialX = 0;
let initialY = 0;
let movementThreshold = 5;

interface ThreadPopoverProps {
  x: number;
  y: number;
  threadId?: string;
  zoomLevel?: number;
  closeOnBlur?: boolean;
  defaultIsOpen?: boolean;
  hideThreadAvatars?: boolean;
  status?: ThreadStatus;
  initiator: string;
  triggerProps?: BoxProps;
  placement?: PlacementWithLogical;
  popoverTrigger?: boolean;
  onClose?: (threadId?: string) => void;
  onDelete?: (threadId: string) => void;
  onSubmit?: (arg: CommentCreatePayload) => void;
  onUpdate?: (threadId: string, payload: ThreadUpdatePayload) => void;
}

const ThreadPopover = ({
  x,
  y,
  status,
  threadId,
  initiator,
  closeOnBlur,
  defaultIsOpen,
  hideThreadAvatars,
  triggerProps,
  zoomLevel = 1,
  placement = "left-start",
  onClose,
  onSubmit,
  onDelete,
  onUpdate,
}: ThreadPopoverProps) => {
  const disclosure = useDisclosure({ defaultIsOpen });
  const workspaceUsers = useWorkspaceUsers();
  const [position, setPosition] = useState({
    x: x * zoomLevel,
    y: y * zoomLevel,
  });

  const handleClose = () => {
    if (isPointerDown || isDragging) return;
    disclosure.onClose();
    onClose(threadId);
  };

  const handlePointerMove = ({
    pressure,
    clientX,
    clientY,
    movementX,
    movementY,
  }) => {
    if (!isPointerDown) return;

    const totalMovementX = Math.abs(clientX - initialX);
    const totalMovementY = Math.abs(clientY - initialY);

    if (
      !isDragging &&
      (totalMovementX > movementThreshold || totalMovementY > movementThreshold)
    ) {
      isDragging = true;
    }

    if (isDragging && pressure && onUpdate) {
      isDragging = true;
      setPosition((prev) => {
        const x = prev.x + movementX;
        const y = prev.y + movementY;

        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          onUpdate(threadId, {
            status,
            position: [x / zoomLevel, y / zoomLevel],
          });
        }, 100);
        return { x, y };
      });
      clearTimeout(timeout);
    }
  };

  const handlePointerDown = (event) => {
    isPointerDown = true;
    isDragging = false;
    initialX = event.clientX;
    initialY = event.clientY;
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  const handlePointerUp = () => {
    isPointerDown = false;
    document.removeEventListener("pointerup", handlePointerUp);
    document.removeEventListener("pointermove", handlePointerMove);
    timeout = setTimeout(() => {
      isDragging = false;
    }, 10);
  };

  const handleClick = () => {
    if (isDragging) return;
    disclosure.onToggle();
  };

  useEffect(() => {
    if (defaultIsOpen) {
      clearTimeout(openTimeout);
      openTimeout = setTimeout(() => {
        disclosure.onOpen();
      });
    } else {
      handleClose();
    }
  }, [defaultIsOpen]);

  useEffect(() => {
    setPosition({ x: x * zoomLevel, y: y * zoomLevel });
  }, [x, y, zoomLevel]);

  const initiatorInfo = workspaceUsers[initiator];

  return (
    <Popover
      isLazy
      placement={placement}
      closeOnBlur={closeOnBlur}
      isOpen={disclosure.isOpen}
      onClose={handleClose}
    >
      <PopoverTrigger>
        <Box
          w="8"
          h="8"
          p="1"
          left="0"
          zIndex="9"
          bottom="100%"
          boxShadow="base"
          cursor="pointer"
          position="absolute"
          bg={initiatorInfo.color}
          borderTopRadius="full"
          borderRightRadius="full"
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          {...triggerProps}
          style={{
            opacity: hideThreadAvatars ? 0 : 1,
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
        >
          <WorkspaceUserAvatar
            size="full"
            fontSize="3xl"
            user={initiatorInfo}
            pointerEvents="none"
          />
        </Box>
      </PopoverTrigger>
      {/* <Portal> */}
      <PopoverContent w="380px" borderRadius="2xl" className="thread-popover">
        <ThreadContent
          threadId={threadId}
          initiator={initiator}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onSubmit={onSubmit}
          onClose={handleClose}
        />
      </PopoverContent>
      {/* </Portal> */}
    </Popover>
  );
};

export default memo(ThreadPopover);
