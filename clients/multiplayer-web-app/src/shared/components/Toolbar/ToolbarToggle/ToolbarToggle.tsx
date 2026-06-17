import { Button, Flex, Icon } from "@chakra-ui/react";
import { IconType } from "shared/models/types";

interface ToolbarToggleProps {
  buttons: ToolbarToggleButton[];
  value?: any;
  onChange?: (arg: any) => void;
}

const ToolbarToggle = ({ buttons, value, onChange }: ToolbarToggleProps) => {
  if (!buttons.length) return null;
  return (
    <Flex p="1" bg="bg.subtle" gap="1" borderRadius="3xl" alignItems="center">
      {buttons.map((btn) => {
        const isActive = value === btn.key;
        return (
          <Button
            size="sm"
            key={btn.key}
            variant="base"
            _hover={{ bg: "bg.primary" }}
            bg={isActive ? "bg.primary" : "inherit"}
            color={isActive ? "subtle" : "muted"}
            leftIcon={
              <Icon as={btn.icon} color={isActive ? "blue.400" : "inherit"} />
            }
            onClick={() => onChange(btn.key)}
          >
            {btn.label}
          </Button>
        );
      })}
    </Flex>
  );
};

export interface ToolbarToggleButton {
  key: any;
  label: string;
  icon: IconType;
}
export default ToolbarToggle;
