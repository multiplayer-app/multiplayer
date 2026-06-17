import { memo, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button, ButtonProps } from "@chakra-ui/react";
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";

import CheckAccess from "shared/components/CheckAccess";
import { useProjectSettingsPath } from "shared/hooks/useProjectSettingsPath";

export type OtelKeysSettingsLinkProps = Omit<ButtonProps, "as"> & {
  children?: ReactNode;
  bypassPermissions?: boolean;
};

const OtelKeysSettingsLink = memo(
  ({
    children = "Session Recorder keys",
    bypassPermissions,
    ...buttonProps
  }: OtelKeysSettingsLinkProps) => {
    const { segmentPath } = useProjectSettingsPath();
    const to = segmentPath("otel-keys");

    if (!to) {
      return null;
    }

    return (
      <CheckAccess
        scope={RoleType.PROJECT}
        permission={RoleAccessAction.READ}
        entity={RoleProjectPermissionEntity.INTEGRATION}
        bypassPermissions={bypassPermissions}
      >
        <Button as={Link} to={to} {...buttonProps}>
          {children}
        </Button>
      </CheckAccess>
    );
  }
);

export default OtelKeysSettingsLink;
