import { EntityCommitChangeType } from "@multiplayer/types";
import { Input } from "@chakra-ui/react";
import { changeTypeConfig } from "shared/configs/changeTypeProps.config";
import ChangedControlWrapper from "shared/components/ChangedControlWrapper";

const ChangedInputWrapper = ({
  inputProps,
  wrapperProps,
}: {
  inputProps: any;
  wrapperProps: {
    styleProps: any;
    tooltipValue?: string;
    changeType?: EntityCommitChangeType;
    onResetValue: () => void;
  };
}) => {
  return (
    <ChangedControlWrapper props={wrapperProps}>
      <Input
        {...inputProps}
        variant="ghost"
        paddingX="3"
        marginRight="-6px"
        borderRightRadius="md"
        backgroundColor={
          wrapperProps.changeType
            ? changeTypeConfig[wrapperProps.changeType].lightBackground
            : "transparent"
        }
      ></Input>
    </ChangedControlWrapper>
  );
};

export default ChangedInputWrapper;
