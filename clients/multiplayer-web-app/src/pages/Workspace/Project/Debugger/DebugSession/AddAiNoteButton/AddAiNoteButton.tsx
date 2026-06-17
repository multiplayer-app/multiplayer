import {
  Flex,
  Icon,
  Portal,
  Button,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Box,
  useDisclosure,
  PlacementWithLogical,
} from "@chakra-ui/react";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import useMessage from "shared/hooks/useMessage";
import IconButton from "shared/components/IconButton";
import { CopilotIcon, CopilotOIcon } from "shared/icons";
import { SessionNoteType, ISessionNoteItem } from "@multiplayer/types";

interface AddAiNoteButtonProps extends PropsWithChildren {
  label?: string;
  isSimple?: boolean;
  isActive?: boolean;
  instruction?: string;
  icon?: React.ReactNode;
  type: SessionNoteType;
  placement?: PlacementWithLogical;
  onSave?: (instruction?: string) => Promise<ISessionNoteItem | null>;
  onDelete?: () => Promise<void>;
}

const AddAiNoteButton = ({
  isSimple,
  isActive,
  children,
  instruction,
  placement = "auto",
  onSave,
  onDelete,
}: AddAiNoteButtonProps) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const message = useMessage();

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(textareaRef.current?.value);
    setIsSaving(false);
    onClose();
    if (textareaRef.current) {
      textareaRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    await onDelete();
    onClose();
  };

  const label = isActive ? "Edit AI Note" : "Add to AI Notes";

  useEffect(() => {
    if (!triggerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (isOpen && !entry.isIntersecting) {
          onClose();
        }
      },
      { threshold: 0 }
    );

    observer.observe(triggerRef.current);
    return () => observer.disconnect();
  }, [isOpen, onClose]);

  return (
    <Popover isOpen={isOpen} placement={placement} onClose={onClose} isLazy>
      <PopoverTrigger>
        <Box
          ref={triggerRef}
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          {isSimple ? (
            <IconButton
              p="1"
              my="-1"
              h="auto"
              size="xs"
              label={label}
              variant="base"
              aria-label={label}
              icon={
                isActive ? (
                  <Icon color="brand.500" as={CopilotIcon} />
                ) : (
                  <Icon color="muted" as={CopilotOIcon} />
                )
              }
            />
          ) : (
            <Button
              size="sm"
              borderRadius="md"
              leftIcon={<Icon as={CopilotIcon} />}
            >
              {label}
            </Button>
          )}
        </Box>
      </PopoverTrigger>
      <Portal>
        <PopoverContent w="500px" onClick={(e) => e.stopPropagation()}>
          <PopoverArrow />
          <PopoverHeader
            gap="2"
            as={Flex}
            alignItems="center"
            fontWeight="medium"
          >
            {children}
            {onSave && (
              <Button
                ml="auto"
                size="sm"
                flexShrink={0}
                borderRadius="md"
                onClick={handleSave}
                isLoading={isSaving}
                leftIcon={<Icon as={CopilotIcon} />}
              >
                Save
              </Button>
            )}
            {onDelete && isActive && (
              <Button
                size="sm"
                flexShrink={0}
                variant="outline"
                borderRadius="md"
                onClick={handleDelete}
              >
                Delete
              </Button>
            )}
          </PopoverHeader>
          <PopoverBody
            rows={4}
            bg="none"
            as="textarea"
            ref={textareaRef}
            defaultValue={instruction}
            placeholder="Write note..."
          />
        </PopoverContent>
      </Portal>
    </Popover>
  );
};
export default AddAiNoteButton;
