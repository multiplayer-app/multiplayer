import { Flex, Text, Checkbox } from "@chakra-ui/react";
import { DependencyDetection } from "../../types";

interface DependencyListItemProps {
  data: DependencyDetection;
  isSelected: boolean;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const DependencyListItem = ({
  data,
  isSelected,
  onSelect,
}: DependencyListItemProps) => {
  return (
    <Flex
      p="4"
      gap="2"
      as="label"
      bg="bg.surface"
      borderRadius="2xl"
      alignItems="center"
      border="solid 1px"
      borderColor="border.secondary"
    >
      <Checkbox
        bg="bg.primary"
        mr="2"
        isChecked={isSelected}
        onChange={onSelect}
      />
      <Text noOfLines={1} flex="1" minW="0">
        {data.source}
      </Text>
      <Text noOfLines={1} flex="1" minW="0" textAlign="right">
        {data.target}
      </Text>
    </Flex>
  );
};
