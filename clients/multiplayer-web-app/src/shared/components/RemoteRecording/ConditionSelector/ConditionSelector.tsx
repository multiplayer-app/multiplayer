import { ChevronDownIcon } from "@chakra-ui/icons";
import { RemoteSessionRecordingConditionCompareOperator } from "@multiplayer/types";
import { Button, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react";

const conditionTypeToLabel: Record<
  RemoteSessionRecordingConditionCompareOperator,
  string
> = {
  [RemoteSessionRecordingConditionCompareOperator.EQUALS]: "= equals",
  [RemoteSessionRecordingConditionCompareOperator.NOT_EQUALS]: "!= not equals",
  [RemoteSessionRecordingConditionCompareOperator.CONTAINS]: "∈ contains",
  [RemoteSessionRecordingConditionCompareOperator.NOT_CONTAINS]:
    "∉ not contains",
  [RemoteSessionRecordingConditionCompareOperator.GREATER_THAN]:
    "> greater than",
  [RemoteSessionRecordingConditionCompareOperator.LESS_THAN]: "< less than",
  [RemoteSessionRecordingConditionCompareOperator.GREATER_THAN_OR_EQUALS]:
    ">= greater than or equal to",
  [RemoteSessionRecordingConditionCompareOperator.LESS_THAN_OR_EQUALS]:
    "<= less than or equal to",
  [RemoteSessionRecordingConditionCompareOperator.EXISTS]: "✓ exists",
  [RemoteSessionRecordingConditionCompareOperator.NOT_EXISTS]: "✕ not exists",
};

const conditionTypeToValue: Record<
  RemoteSessionRecordingConditionCompareOperator,
  string
> = {
  [RemoteSessionRecordingConditionCompareOperator.EQUALS]: "=",
  [RemoteSessionRecordingConditionCompareOperator.NOT_EQUALS]: "!=",
  [RemoteSessionRecordingConditionCompareOperator.CONTAINS]: "∈",
  [RemoteSessionRecordingConditionCompareOperator.NOT_CONTAINS]: "∉",
  [RemoteSessionRecordingConditionCompareOperator.GREATER_THAN]: ">",
  [RemoteSessionRecordingConditionCompareOperator.LESS_THAN]: "<",
  [RemoteSessionRecordingConditionCompareOperator.GREATER_THAN_OR_EQUALS]: ">=",
  [RemoteSessionRecordingConditionCompareOperator.LESS_THAN_OR_EQUALS]: "<=",
  [RemoteSessionRecordingConditionCompareOperator.EXISTS]: "✓",
  [RemoteSessionRecordingConditionCompareOperator.NOT_EXISTS]: "✕",
};

const ConditionSelector = ({
  value,
  onChange,
}: {
  value: RemoteSessionRecordingConditionCompareOperator;
  onChange: (v: RemoteSessionRecordingConditionCompareOperator) => void;
}) => {
  return (
    <Menu>
      <MenuButton
        as={Button}
        size="sm"
        rightIcon={<ChevronDownIcon />}
        w="65px"
        height="40px"
        borderRadius="6px"
        variant="light"
        textAlign="left"
      >
        {conditionTypeToValue[value]}
      </MenuButton>
      <MenuList>
        {(
          Object.keys(
            conditionTypeToLabel
          ) as RemoteSessionRecordingConditionCompareOperator[]
        ).map((type) => (
          <MenuItem key={type} onClick={() => onChange(type)}>
            {conditionTypeToLabel[type]}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default ConditionSelector;
