import { Divider, Flex, FlexProps, Text, Tooltip } from "@chakra-ui/react";

interface SelectionIndicatorProps extends FlexProps {
  count: number | string;
  actionButtons?: any;
  onResetSelection: () => void;
}

const SelectionIndicator = ({
  count,
  actionButtons,
  onResetSelection,
  ...rest
}: SelectionIndicatorProps) => {
  return (
    <Flex
      pl="3"
      gap="2"
      height={10}
      bg="bg.primary"
      border="1px solid"
      borderColor="border.secondary"
      alignItems="center"
      borderRadius="lg"
      pr={actionButtons ? "0" : "3"}
      {...rest}
    >
      <Tooltip label="Reset selection" openDelay={800}>
        <Text
          color="brand.500"
          fontWeight="500"
          cursor="pointer"
          whiteSpace="nowrap"
          onClick={onResetSelection}
        >
          {count} selected
        </Text>
      </Tooltip>
      {actionButtons && (
        <>
          <Divider orientation="vertical" mr="-2" />
          <Flex alignItems="center">{actionButtons}</Flex>
        </>
      )}
    </Flex>
  );
};

export default SelectionIndicator;
