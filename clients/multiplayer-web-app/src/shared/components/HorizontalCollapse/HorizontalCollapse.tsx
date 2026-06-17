import { Flex, FlexProps, IconButton } from "@chakra-ui/react";
import { CloseIcon } from "shared/icons";
import { useAnimation, motion } from "framer-motion";
import { useState, useEffect } from "react";

interface HorizontalCollapseProps extends FlexProps {
  in: boolean;
  width?: string;
  onClose?: () => void;
}

const HorizontalCollapse = ({
  width = "256px",
  in: isOpen,
  children,
  onClose,
  ...rest
}: HorizontalCollapseProps) => {
  const [isContentVisible, setIsContentVisible] = useState(isOpen);
  const controls = useAnimation();

  useEffect(() => {
    if (isOpen) {
      setIsContentVisible(true);
      controls.start({ width, minWidth: width });
    } else {
      controls
        .start({ width: 0, minWidth: 0 })
        .then(() => setIsContentVisible(false));
    }
  }, [isOpen, width, controls]);

  return (
    <Flex
      h="full"
      as={motion.div}
      overflowX="hidden"
      animate={controls}
      initial={{ width: 0, minWidth: 0 }}
      position="relative"
      {...rest}
    >
      {isContentVisible && children}
      {onClose && isContentVisible && (
        <IconButton
          position="absolute"
          top="4"
          size="xs"
          left={width}
          ml="-10"
          variant="base"
          color="muted"
          cursor="pointer"
          aria-label="close"
          icon={<CloseIcon />}
          onClick={onClose}
        />
      )}
    </Flex>
  );
};

export default HorizontalCollapse;
