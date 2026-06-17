import React from "react";
import { Flex, Icon, Tooltip } from "@chakra-ui/react";
import { changeTypeConfig } from "shared/configs/changeTypeProps.config";
import { EntityCommitChangeType } from "@multiplayer/types";

const ChangedControlWrapper = ({
  children,
  props,
}: {
  children: React.ReactElement;
  props: {
    styleProps: any;
    tooltipValue?: string;
    onResetValue: () => void;
    changeType?: EntityCommitChangeType;
  };
}) => {
  const { styleProps, changeType, tooltipValue, onResetValue } = props;
  return (
    <Flex
      w="100%"
      borderRadius="md"
      overflow="hidden"
      border="1px solid"
      {...styleProps}
      {...(changeType && {
        borderColor: changeTypeConfig[changeType].accentColor,
      })}
    >
      {children}
      {changeType ? (
        <Tooltip
          label={
            changeTypeConfig[changeType].tooltipStaticText +
            (tooltipValue || "")
          }
          openDelay={600}
        >
          <Flex
            backgroundColor={changeTypeConfig[changeType].accentColor}
            transition="min-width 0.2s ease-in"
            justifyContent="center"
            alignItems="center"
            pl="8px"
            cursor="pointer"
            width="30px"
            minW="30px"
            maxW="36px"
            _hover={{
              minWidth: "36px",
            }}
            onClick={onResetValue}
          >
            <Icon boxSize="12px" as={changeTypeConfig[changeType].icon}></Icon>
          </Flex>
        </Tooltip>
      ) : null}
    </Flex>
  );
};

export default ChangedControlWrapper;
