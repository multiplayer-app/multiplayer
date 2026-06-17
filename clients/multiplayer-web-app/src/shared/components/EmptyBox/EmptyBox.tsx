import { Flex, FlexProps, Text } from "@chakra-ui/react";
interface EmptyBoxProps extends FlexProps {
  title: string;
  description?: string;
}
const EmptyBox = ({ title, description, children, ...rest }: EmptyBoxProps) => {
  return (
    <Flex
      px="4"
      py="6"
      gap="4"
      textAlign="center"
      bg="blackAlpha.50"
      borderRadius="base"
      flexDirection="column"
      {...rest}
    >
      <Text fontSize="md">{title}</Text>
      {description && <Text color="muted">{description}</Text>}
      {children}
    </Flex>
  );
};

export default EmptyBox;
