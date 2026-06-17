import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import {
  RoleType,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import { useMemo } from "react";
import NavItem from "shared/components/NavItem";
import { useProjectSettingsPath } from "shared/hooks/useProjectSettingsPath";
import { usePermissions } from "shared/providers/PermissionsContext";

const ProjectSettingsNav = () => {
  const { basePath } = useProjectSettingsPath();
  const { hasAccess } = usePermissions();

  const items: Array<{
    to: string;
    end?: boolean;
    label: string;
  }> = useMemo(() => {
    if (!basePath) return [];

    const items = [
      { to: basePath, end: true, label: "General" },
      { to: `${basePath}/access`, label: "Access" },
    ];

    if (
      hasAccess(
        RoleProjectPermissionEntity.ISSUE_SETTINGS,
        RoleAccessAction.READ,
        RoleType.PROJECT
      )
    ) {
      items.push({ to: `${basePath}/issues`, label: "Issues" });
    }
    if (
      hasAccess(
        RoleProjectPermissionEntity.AGENT,
        RoleAccessAction.READ,
        RoleType.PROJECT
      )
    ) {
      items.push({ to: `${basePath}/api-keys`, label: "API keys" });
      items.push({
        to: `${basePath}/otel-keys`,
        label: "Session Recorder",
      });
    }
    if (
      hasAccess(
        RoleWorkspacePermissionEntity.PROJECT,
        RoleAccessAction.DELETE,
        RoleType.WORKSPACE
      )
    ) {
      items.push({ to: `${basePath}/danger`, label: "Danger zone" });
    }
    return items;
  }, [basePath, hasAccess]);

  return (
    <>
      <Box
        as="nav"
        aria-label="Project settings"
        display={{ base: "block", lg: "none" }}
        flexShrink={0}
        bg="bg.surface"
        borderBottom="1px"
        borderBottomColor="border.secondary"
        sx={{ WebkitOverflowScrolling: "touch" }}
      >
        <Flex
          gap="0.5"
          px="2"
          py="2"
          overflowX="auto"
          css={{
            scrollbarGutter: "stable",
            "&::-webkit-scrollbar": { height: "4px" },
            "&::-webkit-scrollbar-thumb": {
              borderRadius: "full",
              background: "var(--chakra-colors-border-secondary)",
            },
          }}
        >
          {items.map(({ to, end, label }) => (
            <NavItem
              key={to}
              to={to}
              end={end}
              flexShrink={0}
              w="auto"
              whiteSpace="nowrap"
            >
              {label}
            </NavItem>
          ))}
        </Flex>
      </Box>

      <Box
        display={{ base: "none", lg: "block" }}
        p="2"
        w="230px"
        minW="230px"
        bg="bg.surface"
        overflowY="auto"
        borderRight="1px"
        borderRightColor="border.secondary"
      >
        <Stack mb="4">
          <Text fontSize="xs" fontWeight="semibold" color="muted" px="2">
            PROJECT
          </Text>
          <Stack spacing="0.5">
            {items.map(({ to, end, label }) => (
              <NavItem key={to} to={to} end={end} w="100%">
                {label}
              </NavItem>
            ))}
          </Stack>
        </Stack>
      </Box>
    </>
  );
};

export default ProjectSettingsNav;
