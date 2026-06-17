import { Select } from "@chakra-ui/react";
import { EntityCommitChangeType } from "@multiplayer/types";
import { changeTypeConfig } from "shared/configs/changeTypeProps.config";
import ChangedControlWrapper from "shared/components/ChangedControlWrapper";

const ChangedSelectWrapper = ({
  wrapperProps,
  selectProps,
  options,
}: {
  options: any;
  selectProps: any;
  wrapperProps: {
    changeType: EntityCommitChangeType;
    tooltipValue: string;
    styleProps: any;
    onResetValue: () => void;
  };
}) => {
  return (
    <ChangedControlWrapper props={wrapperProps}>
      <Select
        cursor="pointer"
        variant="ghost"
        {...selectProps}
        marginRight="-6px"
        borderRightRadius="md"
        backgroundColor={
          wrapperProps.changeType &&
          changeTypeConfig[wrapperProps.changeType].lightBackground
        }
      >
        {options}
      </Select>
    </ChangedControlWrapper>
  );
};

export default ChangedSelectWrapper;
