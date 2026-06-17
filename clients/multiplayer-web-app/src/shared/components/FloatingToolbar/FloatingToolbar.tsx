import { Flex, FlexProps, keyframes } from "@chakra-ui/react";

interface FloatingToolbarProps extends FlexProps {}

const FloatingToolbar = ({ children, ...rest }: FloatingToolbarProps) => {
  return (
    <Flex
      p="1"
      gap="2"
      left="0"
      right="0"
      mx="auto"
      bottom="4"
      bg="bg.primary"
      zIndex="11"
      boxShadow="sm"
      border="1px solid"
      borderRadius="3xl"
      width="max-content"
      position="absolute"
      borderColor="border.primary"
      transform="translateY(100px)"
      animation={animation}
      {...rest}
    >
      {children}
    </Flex>
  );
};

const slideInAnimation = keyframes`
0% { transform: translateY(100px);}
100% { transform: translateY(0);}
`;

const animation = `${slideInAnimation} .2s cubic-bezier(.87, 0, .13, 1) 0s 1 normal forwards`;

export default FloatingToolbar;
