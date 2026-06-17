import {
  WarningTwoIcon,
  WarningIcon,
  CheckCircleIcon,
  CloseIcon,
} from "@chakra-ui/icons";
import { Box, Flex, Icon, IconButton } from "@chakra-ui/react";

const ToastContent = ({
  status,
  onClose,
  children,
}: {
  status: "success" | "error" | "warning";
  onClose: () => void;
  children: string | React.ReactNode;
}) => {
  const iconMap = {
    success: CheckCircleIcon,
    error: WarningIcon,
    warning: WarningTwoIcon,
  };

  const bgColorMap = {
    success: "green.600",
    error: "red.600",
    warning: "orange.500",
  };

  const IconComponent = iconMap[status];

  return (
    <Flex
      data-status={status}
      bg={bgColorMap[status]}
      color="inverse"
      p="12px 32px 12px 16px"
      borderRadius="md"
      boxShadow="md"
      justify="space-between"
      position="relative"
    >
      <Icon as={IconComponent} boxSize={5} mr={3} />
      <Box flex={1} fontWeight={700}>
        {children}
      </Box>
      <IconButton
        onClick={onClose}
        icon={<Icon as={CloseIcon} boxSize="10px" />}
        size="xs"
        position="absolute"
        right={1}
        top={1}
        ml={2}
        variant="ghost"
        aria-label="Close"
        color="whiteAlpha.900"
        _hover={{ bg: "whiteAlpha.300" }}
      />
    </Flex>
  );
};

export default ToastContent;
