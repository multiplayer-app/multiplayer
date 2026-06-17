import { Flex, Switch } from "@chakra-ui/react";
import { EntityCommitChangeType } from "@multiplayer/types";
import { changeTypeConfig } from "shared/configs/changeTypeProps.config";
import ChangedControlWrapper from "shared/components/ChangedControlWrapper";

const ChangedSwitchWrapper = ({
  switchProps,
  wrapperProps,
}: {
  switchProps: any;
  wrapperProps: {
    styleProps: any;
    tooltipValue?: string;
    changeType?: EntityCommitChangeType;
    onResetValue: () => void;
  };
}) => {
  return (
    <ChangedControlWrapper props={wrapperProps}>
      <Flex
        w="100%"
        h="40px"
        zIndex="1"
        paddingX="3"
        marginRight="-6px"
        borderRightRadius="md"
        alignItems="center"
        {...wrapperProps.styleProps}
        backgroundColor={
          wrapperProps.changeType &&
          changeTypeConfig[wrapperProps.changeType].lightBackground
        }
      >
        <Switch variant="ghost" {...switchProps} />
      </Flex>
    </ChangedControlWrapper>
  );
};

export default ChangedSwitchWrapper;
