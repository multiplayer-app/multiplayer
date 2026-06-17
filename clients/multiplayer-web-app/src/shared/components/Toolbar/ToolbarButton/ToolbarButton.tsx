import {
  Flex,
  Divider,
  FlexProps,
  IconButton,
  IconButtonProps,
} from "@chakra-ui/react";
import React, { Fragment, forwardRef } from "react";

import Tooltip from "shared/components/Tooltip";
import { useFullScreenContext } from "shared/providers/FullScreenContext";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

export interface ToolbarButtonProps
  extends Omit<IconButtonProps, "aria-label"> {
  label?: string;
  isActive?: boolean;
  command?: string;
  enforceSandboxCheck?: boolean;
}

const ToolbarButton = forwardRef(
  (
    {
      icon,
      label,
      disabled,
      isActive,
      command,
      enforceSandboxCheck,
      ...rest
    }: ToolbarButtonProps,
    ref: any
  ) => {
    const fsContext = useFullScreenContext();
    const { withSandboxCheck } = useProjectSandbox();

    return (
      <Tooltip
        label={label}
        command={command}
        openDelay={300}
        portalProps={
          fsContext?.containerRef
            ? { containerRef: fsContext.containerRef }
            : {}
        }
      >
        <IconButton
          h={8}
          w={8}
          minW={8}
          ref={ref}
          icon={icon}
          variant="base"
          borderRadius="8px"
          isDisabled={disabled}
          onFocus={(e) => e.preventDefault()}
          aria-label={label || "toolbar button"}
          color={isActive ? "brand.500" : "muted"}
          background={isActive ? "bg.subtle" : "unset"}
          _hover={{
            background: "bg.subtle",
          }}
          {...rest}
          {...(rest.onClick
            ? {
                onClick: enforceSandboxCheck
                  ? withSandboxCheck(rest.onClick)
                  : rest.onClick,
              }
            : {})}
        />
      </Tooltip>
    );
  }
);

const ToolbarButtonGroup = ({ children, ...rest }: FlexProps) => {
  return (
    <Flex alignItems="center" {...rest}>
      {React.Children.map(children, (c, i) => (
        <Fragment key={i}>
          {i > 0 ? <Divider orientation="vertical" h="6" /> : null}
          {c as React.ReactElement}
        </Fragment>
      ))}
    </Flex>
  );
};

export default ToolbarButton;
export { ToolbarButtonGroup };
