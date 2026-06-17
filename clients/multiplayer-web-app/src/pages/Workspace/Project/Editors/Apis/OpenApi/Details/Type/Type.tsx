import { Text, TextProps } from "@chakra-ui/react";
import { getRefName } from "shared/helpers/openApi.helpers";

interface TypeProps extends TextProps {
  value: any;
}

// Shared components
const Type = ({ value, ...rest }: TypeProps) => {
  if (!value) return null;

  if (typeof value === "string") {
    return <TypeText {...rest}>{value}</TypeText>;
  }

  if (value.type) {
    return <TypeText {...rest}>{value.type}</TypeText>;
  }

  if (value.$ref) {
    return <TypeText {...rest}>{getRefName(value.$ref)}</TypeText>;
  }

  return null;
};

const TypeText = ({ children, ...rest }: TextProps) => {
  return (
    <Text
      fontFamily="JetBrains Mono, sans-serif"
      color="muted"
      as="span"
      {...rest}
    >
      {children}
    </Text>
  );
};

export default Type;
