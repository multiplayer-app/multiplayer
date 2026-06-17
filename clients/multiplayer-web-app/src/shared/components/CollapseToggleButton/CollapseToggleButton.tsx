import { IconButton, Icon, IconButtonProps } from "@chakra-ui/react";
import { ChevronDownIcon } from "shared/icons";

interface CollapseToggleButtonProps
  extends Omit<IconButtonProps, "aria-label"> {
  collapsed?: boolean;
  onToggle?: () => void;
}

const CollapseToggleButton = ({
  collapsed,
  onToggle,
  ...rest
}: CollapseToggleButtonProps) => {
  return (
    <IconButton
      size="xs"
      bg="bg.subtle"
      variant="unstyled"
      borderRadius="base"
      aria-label="Collapse toggle"
      {...rest}
      icon={
        <Icon
          as={ChevronDownIcon}
          transform={collapsed ? "rotate(-90deg)" : "rotate(0)"}
        />
      }
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    />
  );
};

export default CollapseToggleButton;
