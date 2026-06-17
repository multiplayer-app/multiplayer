import { Flex, Text } from "@chakra-ui/react";
import Icon from "shared/components/Icon";

type SessionModelInfoProps = {
  model?: string | null;
};

export const SessionModelInfo = ({ model }: SessionModelInfoProps) => {
  const label = model?.trim();
  if (!label) return null;

  return (
    <Flex
      align="center"
      gap="1.5"
      fontSize="xs"
      color="muted"
      fontFamily="mono"
    >
      <Flex align="center" gap="1" minW={0}>
        <Icon name="Cpu" boxSize="3" flexShrink={0} />
        <Text noOfLines={1} title={label}>
          {label}
        </Text>
      </Flex>
    </Flex>
  );
};

export default SessionModelInfo;
