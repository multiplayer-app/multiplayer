import { ReactNode } from "react";
import { FlexProps, Flex, Box, Text, Tooltip, Fade } from "@chakra-ui/react";

export interface NavbarNavItemProps extends FlexProps {
  icon: ReactNode;
  href?: string;
  to?: string;
  label?: string;
  isExpanded: boolean;
  isSelected?: boolean;
  labelProps?: any;
}

const NavbarNavItem = ({
  icon,
  label,
  isExpanded,
  isSelected = false,
  labelProps,
  ...rest
}: NavbarNavItemProps) => {
  return (
    <Flex
      px="4"
      border="0"
      cursor="pointer"
      alignItems="center"
      position="relative"
      userSelect="none"
      {...rest}
    >
      {isSelected && (
        <Box
          w="0.5"
          h="8"
          top="0"
          left="0"
          bottom="0"
          my="auto"
          bg="brand.500"
          position="absolute"
          borderEndRadius="2px"
          boxShadow="0px 0px 2.75px 0px #5E41FF80"
        />
      )}
      <Flex
        flex="1"
        gap="2.5"
        rounded="lg"
        alignItems="center"
        whiteSpace="nowrap"
        transition="background 0.15s ease-in-out"
        bg={isSelected ? "bg.subtle" : "transparent"}
        _hover={{ bg: "bg.surface" }}
      >
        <Tooltip label={label} isDisabled={isExpanded} placement="right">
          <Flex w="8" h="8" alignItems="center" justifyContent="center">
            {icon}
          </Flex>
        </Tooltip>
        <Flex as={Fade} in={isExpanded} unmountOnExit>
          <Text flex="1" color={isSelected ? "body" : "muted"} {...labelProps}>
            {label}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};
export default NavbarNavItem;
