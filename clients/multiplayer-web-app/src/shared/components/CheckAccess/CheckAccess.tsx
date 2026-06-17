import { forwardRef, memo, PropsWithChildren, Ref, useMemo } from "react";
import {
  RoleType,
  RoleAccessAction,
  RoleAccountPermissionEntity,
  RoleProjectPermissionEntity,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import { usePermissions } from "shared/providers/PermissionsContext";
import { Box, BoxProps } from "@chakra-ui/react";
import type { ChakraComponent } from "@chakra-ui/system";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

interface CheckAccessProps extends PropsWithChildren {
  scope?: RoleType;
  permission: RoleAccessAction;
  fallbackElement?: React.ReactNode;
  entity:
    | RoleProjectPermissionEntity
    | RoleWorkspacePermissionEntity
    | RoleAccountPermissionEntity;
  bypassPermissions?: boolean;
}

const CheckAccess = memo(
  ({
    entity,
    children,
    permission,
    scope = RoleType.WORKSPACE,
    fallbackElement = null,
    bypassPermissions = false,
  }: CheckAccessProps) => {
    const { hasAccess, permissions } = usePermissions();

    const memoizedHasAccess = useMemo(
      () => hasAccess(entity, permission, scope) || bypassPermissions,
      [hasAccess, entity, permission, scope, bypassPermissions]
    );

    if (permissions.fetching) return <></>;

    return <>{memoizedHasAccess ? children : fallbackElement}</>;
  }
);
interface WidthAccessCheckControlProps {
  scope?: RoleType;
  permission: RoleAccessAction;
  fallbackElement?: React.ReactNode;
  entity:
    | RoleProjectPermissionEntity
    | RoleWorkspacePermissionEntity
    | RoleAccountPermissionEntity;
  bypassPermissions?: boolean;
}

type WidthAccessCheckProps = BoxProps & WidthAccessCheckControlProps;
type WidthAccessCheckComponent = ChakraComponent<
  "div",
  WidthAccessCheckControlProps
>;

const WidthAccessCheckBase = (
  {
    children,
    scope,
    entity,
    permission,
    fallbackElement,
    bypassPermissions,
    onClick,
    onMouseDown,
    onMouseUp,
    onPointerDown,
    onPointerUp,
    ...props
  }: WidthAccessCheckProps,
  ref: Ref<any>
) => {
  const { withSandboxCheck } = useProjectSandbox();

  return (
    <CheckAccess
      scope={scope}
      entity={entity}
      permission={permission}
      fallbackElement={fallbackElement}
      bypassPermissions={bypassPermissions}
    >
      <Box
        ref={ref}
        {...props}
        onClick={onClick ? withSandboxCheck(onClick) : undefined}
        onMouseUp={onMouseUp ? withSandboxCheck(onMouseUp) : undefined}
        onMouseDown={onMouseDown ? withSandboxCheck(onMouseDown) : undefined}
        onPointerDown={
          onPointerDown ? withSandboxCheck(onPointerDown) : undefined
        }
        onPointerUp={onPointerUp ? withSandboxCheck(onPointerUp) : undefined}
      >
        {children}
      </Box>
    </CheckAccess>
  );
};

export const WidthAccessCheck = forwardRef(
  WidthAccessCheckBase
) as WidthAccessCheckComponent;

export default CheckAccess;
