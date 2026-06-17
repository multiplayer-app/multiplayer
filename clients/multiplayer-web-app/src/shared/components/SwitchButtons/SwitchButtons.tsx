import {
  Flex,
  Button,
  Icon,
  ResponsiveValue,
  ButtonGroup,
  Menu,
  MenuButton,
  MenuList,
  Portal,
  FlexProps,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { ChevronDownIcon } from "shared/icons";
import Tooltip from "shared/components/Tooltip";

interface SwitchButtonsProps extends FlexProps {
  value: any;
  size?: "xl" | "lg" | "md";
  hideLabel?: boolean;
  onChange: (value: any) => void;
  options: {
    value: any;
    label?: string;
    icon?: any;
    tooltip?: string;
    iconColor?: string;
    menuContent?: ReactNode | null;
    command?: string;
  }[];
}

const sizeProps = {
  xl: {
    p: "1",
    py: "2",
    flex: "1",
    height: "auto",
    flexDir: "column",
    borderRadius: "xl",
  },
  lg: {
    p: "2",
    py: "2",
    flex: "1",
    height: "auto",
    flexDir: "column",
    borderRadius: "lg",
  },
  md: {
    p: "1",
    py: "2",
    flex: "auto",
    height: "8",
    flexDir: "row",
    borderRadius: "3xl",
  },
};

const SwitchButtons = ({
  size = "md",
  value,
  onChange,
  options,
  hideLabel = true,
  ...props
}: SwitchButtonsProps) => {
  const style = sizeProps[size];

  return (
    <Flex
      borderRadius={style.borderRadius}
      bg="bg.subtle"
      p={style.p}
      gap="2"
      {...props}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        const hasMenu = opt.menuContent && isActive;
        const iconColor = opt.iconColor || "#0091FF";
        const bg = isActive ? "bg.primary" : "transparent";
        const tooltipLabel = opt.tooltip || opt.label;

        return (
          <ButtonGroup
            gap="0"
            bg={bg}
            size="xs"
            variant="ghost"
            key={opt.value}
            borderRadius="inherit"
            flex={style.flex}
          >
            <Tooltip label={tooltipLabel} command={opt.command}>
              <Button
                gap="2"
                py={style.py}
                h={style.height}
                flex={style.flex}
                borderRadius="inherit"
                px={opt.icon ? "4" : "3"}
                pr={hasMenu ? 0 : null}
                _hover={{ bg }}
                flexDir={style.flexDir as ResponsiveValue<any>}
                onClick={() => value !== opt.value && onChange(opt.value)}
              >
                {opt.icon && (
                  <Icon as={opt.icon} color={isActive ? iconColor : "muted"} />
                )}
                {isActive || !opt.icon || size === "lg" || !hideLabel
                  ? opt.label
                  : ""}
              </Button>
            </Tooltip>

            {hasMenu ? (
              <Menu placement="bottom-end">
                <MenuButton ml="0!" px="3">
                  <ChevronDownIcon />
                </MenuButton>
                <Portal>
                  <MenuList
                    gap="2"
                    w="160px"
                    zIndex="101" // TODO: fix this when we have a better way to handle z-index
                    display="flex"
                    flexDir="column"
                  >
                    {opt.menuContent}
                  </MenuList>
                </Portal>
              </Menu>
            ) : null}
          </ButtonGroup>
        );
      })}
    </Flex>
  );
};

export default SwitchButtons;
