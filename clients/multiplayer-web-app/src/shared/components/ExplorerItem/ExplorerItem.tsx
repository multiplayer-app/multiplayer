import { Flex, FlexProps } from "@chakra-ui/react";

interface ExplorerItemProps extends FlexProps {
  isActive: boolean;
}

const ExplorerItem = ({ isActive, children, ...rest }: ExplorerItemProps) => {
  return (
    <Flex
      h="8"
      mb="1"
      minW="0"
      role="group"
      fontSize="sm"
      color="inherit"
      fontWeight="500"
      cursor="pointer"
      borderRadius="lg"
      position="relative"
      _hover={{ bg: "bg.subtle" }}
      bg={isActive ? "bg.subtle" : "transparent"}
      transition="background .2s cubic-bezier(.87, 0, .13, 1)"
      _before={
        isActive
          ? {
              content: "''",
              w: 0.5,
              mr: "7px",
              top: "1.5",
              bottom: "1.5",
              right: "100%",
              bg: "brand.500",
              borderRadius: "base",
              position: "absolute",
            }
          : null
      }
      {...rest}
    >
      {children}
    </Flex>
  );
};

export default ExplorerItem;
