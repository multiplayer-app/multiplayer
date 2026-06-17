import { Flex, Icon, IconButton } from "@chakra-ui/react";
import { CheckCircleFilledIcon, CloseCircleFilledIcon } from "shared/icons";

interface ActionButtonsProps {
  onApprove: () => void;
  onReject: () => void;
}

export const ActionButtons = ({ onApprove, onReject }: ActionButtonsProps) => (
  <Flex gap="1">
    <IconButton
      size="xs"
      rounded="lg"
      bg="green.400"
      aria-label="apply"
      borderColor="green.600"
      _hover={{ bg: "green.500" }}
      icon={<Icon as={CheckCircleFilledIcon} />}
      onClick={onApprove}
    />
    <IconButton
      size="xs"
      rounded="lg"
      bg="red.400"
      aria-label="reject"
      borderColor="red.600"
      _hover={{ bg: "red.500" }}
      icon={<Icon as={CloseCircleFilledIcon} />}
      onClick={onReject}
    />
  </Flex>
);
