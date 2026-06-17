import { Flex, Text, Checkbox } from "@chakra-ui/react";
import NodeIcon from "shared/components/NodeIcon";
import { ComponentDetection } from "../../types";

interface ComponentListItemProps {
  data: ComponentDetection;
  isSelected: boolean;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ComponentListItem = ({
  data,
  isSelected,
  onSelect,
}: ComponentListItemProps) => {
  return (
    <Flex
      p="4"
      gap="2"
      as="label"
      bg="blue.50"
      borderRadius="2xl"
      alignItems="center"
      border="solid 1px"
      borderColor="#C7D2FE"
    >
      <Checkbox
        bg="bg.primary"
        mr="2"
        isChecked={isSelected}
        onChange={onSelect}
      />
      <NodeIcon type={data.type} />
      <Text noOfLines={1} flex="1" minW="0">
        {data.componentName}
      </Text>
    </Flex>
  );
};
