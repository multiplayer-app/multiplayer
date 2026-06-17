import { Flex, FlexProps, Text } from "@chakra-ui/react";

interface EmptyScreenProps extends FlexProps {
  title: string;
  icon?: JSX.Element;
  description: string | React.ReactNode;
  children?: React.ReactNode;
}

const EmptyScreen = ({
  icon,
  title,
  children,
  description,
  ...rest
}: EmptyScreenProps) => {
  return (
    <Flex
      gap="2"
      flex="1"
      minH="0"
      flexDir="column"
      textAlign="center"
      alignItems="center"
      justifyContent="center"
      {...rest}
    >
      {icon}
      <Text fontSize="lg" fontWeight="medium">
        {title}
      </Text>
      <Flex
        mb="2"
        fontSize="sm"
        color="muted"
        fontWeight="light"
        direction="column"
        gap="2"
      >
        {description}
      </Flex>
      {children}
    </Flex>
  );
};

export default EmptyScreen;
