import { Button, Icon, Link, Text } from "@chakra-ui/react";
import { ArrowRightIcon, ChromeIcon, DebuggerIntroIcon } from "shared/icons";
import { useOtelIntegrations } from "shared/providers/IntegrationsContext";
import { WidthAccessCheck } from "shared/components/CheckAccess";
import {
  RoleType,
  RoleAccessAction,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import OtelKeysSettingsLink from "shared/components/OtelKeysSettingsLink";
import IntroLayout from "shared/components/IntroLayout/IntroLayout";

const extensionLink =
  "https://chromewebstore.google.com/detail/multiplayer/nkhglmdpkenhkfhcekoblccmgjolfikf";

const DebuggerIntro = () => {
  const { onShowObservabilityModal } = useOtelIntegrations();
  const { isSandbox } = useProjectSandbox();
  const { isPublic } = useWorkspace();

  return (
    <IntroLayout
      icon={DebuggerIntroIcon}
      title="Replay real sessions with full context"
      description={
        <>
          Full stack session recordings are what makes the Multiplayer debugging
          agent work where others don’t: unsampled, pre-correlated, full-stack
          runtime data. Run us locally right next to your coding agent or
          download our browser extension.
        </>
      }
      screenshotSrc={`${process.env.PUBLIC_URL}/assets/debugger-intro-screenshot.png`}
      screenshotMaxW="980px"
      screenshotAspectRatio="960 / 560"
    >
      <Link
        href={extensionLink}
        isExternal
        rel="noopener noreferrer"
        display="inline-flex"
        alignItems="center"
        px="16px"
        py="10px"
        bg="bg.primary"
        borderRadius={8}
        color="subtle"
        border="1px solid"
        borderColor="border.secondary"
        textDecoration="none"
        _hover={{ textDecoration: "none" }}
      >
        <Icon as={ChromeIcon} boxSize="20px" mr="8px" />
        <Text fontSize="14px" fontWeight={500} color="subtle">
          Install the extension
        </Text>
      </Link>

      <WidthAccessCheck
        as={Button}
        scope={RoleType.WORKSPACE}
        permission={RoleAccessAction.CREATE}
        entity={RoleWorkspacePermissionEntity.INTEGRATION}
        bypassPermissions={isSandbox}
        onClick={() => onShowObservabilityModal()}
      >
        Set up Multiplayer
        <Icon as={ArrowRightIcon} boxSize="16px" ml={2} />
      </WidthAccessCheck>
      {!isPublic && (
        <OtelKeysSettingsLink bypassPermissions={isSandbox}>
          Configure Multiplayer
        </OtelKeysSettingsLink>
      )}
    </IntroLayout>
  );
};

export default DebuggerIntro;
