import { Text, TextProps } from "@chakra-ui/react";

const MonoText = ({ children, ...rest }: TextProps) => {
  return (
    <Text
      fontSize="13px"
      color="muted"
      fontFamily="JetBrains Mono, sans-serif"
      whiteSpace="nowrap"
      {...rest}
    >
      {children}
    </Text>
  );
};

export default MonoText;
