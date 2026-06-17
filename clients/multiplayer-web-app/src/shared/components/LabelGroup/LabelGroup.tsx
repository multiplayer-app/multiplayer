import { Text, Flex, Tag } from "@chakra-ui/react";

const LabelGroup = ({
  label = "",
  optional,
  description,
  children,
  ...rest
}: {
  label?: string;
  optional?: boolean;
  description?: string;
  // All other props
  [x: string]: any;
}) => {
  return (
    <Flex direction="column" gap="2" {...rest}>
      {(label || children) && (
        <Flex alignItems="center" gap="2">
          {children}
          {label && (
            <Text fontWeight="medium" flex="1">
              {label}
            </Text>
          )}
          {optional ? (
            <Tag size="sm" borderRadius="full">
              Optional
            </Tag>
          ) : null}
        </Flex>
      )}
      {!!description && <Text color="muted">{description}</Text>}
    </Flex>
  );
};

export default LabelGroup;
