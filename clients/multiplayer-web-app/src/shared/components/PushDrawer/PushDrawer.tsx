import { Flex, FlexProps, IconButton, keyframes } from "@chakra-ui/react";

import ResizableBox from "shared/components/ResizableBox";
import { CloseIcon } from "shared/icons";

interface PushDrawerProps extends FlexProps {
  w?: number;
  minW?: number;
  maxW?: number;
  onClose?: () => void;
}

const PushDrawer = ({
  children,
  w = 450,
  minW = 450,
  maxW = 900,
  onClose = undefined,

  ...rest
}: PushDrawerProps) => {
  const width = Math.min(w, window.innerWidth);
  const minWidth = Math.min(minW, window.innerWidth);
  const maxWidth = Math.min(maxW, window.innerWidth);
  return (
    <Flex
      h="full"
      maxW="max-content"
      position={{ base: "absolute", md: "relative" }}
      overflow="hidden"
      right="0"
      zIndex="popover"
      animation={animation}
      bg="bg.primary"
      borderLeft="1px solid"
      borderLeftColor="border.primary"
      boxShadow="lg"
      {...rest}
    >
      <ResizableBox
        w={width}
        minW={minWidth}
        maxW={maxWidth}
        resizeDirection="left"
      >
        <Flex direction="column" w="100%" h="100%" position="relative">
          {onClose && (
            <IconButton
              position="absolute"
              aria-label="close"
              color="muted"
              variant="base"
              right="12px"
              top="2"
              size="sm"
              icon={<CloseIcon />}
              zIndex={1}
              onClick={onClose}
            />
          )}
          {children}
        </Flex>
      </ResizableBox>
    </Flex>
  );
};

export default PushDrawer;

const slideInAnimation = keyframes`
  from { width: 0; }
  to { width: 100%; }
`;

const animation = `${slideInAnimation} 0.2s ease-in 0s 1 normal forwards`;
