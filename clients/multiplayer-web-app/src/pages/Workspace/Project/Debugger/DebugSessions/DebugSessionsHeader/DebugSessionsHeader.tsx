import { Flex, Text, Stack, Button } from "@chakra-ui/react";
import { useOtelIntegrations } from "shared/providers/IntegrationsContext";
import {
  RoleAccessAction,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import Visibility from "shared/components/Visibility";
import { WidthAccessCheck } from "shared/components/CheckAccess";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";
import { IS_VSCODE } from "vscode/VsCodeContext";
import OtelKeysSettingsLink from "shared/components/OtelKeysSettingsLink";

interface DebugSessionsHeaderProps {}

const DebugSessionsHeader = (props: DebugSessionsHeaderProps) => {
  const { onShowObservabilityModal } = useOtelIntegrations();
  const { isPublic } = useWorkspace();
  const { isSandbox } = useProjectSandbox();
  return (
    <Flex
      gap="2"
      py="4"
      justifyContent="space-between"
      px={{ base: "4", lg: "10" }}
      direction={{ base: "column", lg: "row" }}
      alignItems={{ base: "flex-start", lg: "center" }}
    >
      <Stack gap="2">
        <Text fontSize="24px" fontWeight="600">
          {isPublic ? "Full-stack session recordings" : "Recordings"}
        </Text>
      </Stack>
      {!IS_VSCODE && (
        <Visibility hideBelow="md">
          <Flex
            alignItems="center"
            alignSelf="flex-start"
            flexWrap="wrap"
            gap={2}
          >
            <WidthAccessCheck
              as={Button}
              variant="light"
              bypassPermissions={isSandbox}
              permission={RoleAccessAction.CREATE}
              entity={RoleWorkspacePermissionEntity.INTEGRATION}
              onClick={() => onShowObservabilityModal()}
            >
              Set up Multiplayer
            </WidthAccessCheck>
            {!isPublic && (
              <OtelKeysSettingsLink
                variant="light"
                bypassPermissions={isSandbox}
              >
                Configure Multiplayer
              </OtelKeysSettingsLink>
            )}
          </Flex>
        </Visibility>
      )}
    </Flex>
  );
};

export default DebugSessionsHeader;
