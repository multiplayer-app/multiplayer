import { Button, Icon } from "@chakra-ui/react";
import {
  RoleAccessAction,
  RoleType,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import { ArrowRightIcon, IssuesIntroIcon } from "shared/icons";
import { WidthAccessCheck } from "shared/components/CheckAccess";
import IntroLayout from "shared/components/IntroLayout/IntroLayout";
import { useOtelIntegrations } from "shared/providers/IntegrationsContext";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import OtelKeysSettingsLink from "shared/components/OtelKeysSettingsLink";

const IssueIntro = () => {
  const { onShowObservabilityModal } = useOtelIntegrations();
  const { isSandbox } = useProjectSandbox();
  const { isPublic } = useWorkspace();

  return (
    <IntroLayout
      icon={IssuesIntroIcon}
      title="Catch production issues early"
      screenshotSrc={`${process.env.PUBLIC_URL}/assets/issues-intro-screenshot.png`}
      screenshotAspectRatio="1511 / 805"
      description={
        <>
          Issues are the errors, exceptions and events that occur in your
          system. When the same bug happens multiple times, we consolidate the
          duplicate alerts into a single issue and link the corresponding
          recordings. This ensures you never have to investigate the same
          problem twice.
        </>
      }
    >
      <WidthAccessCheck
        as={Button}
        scope={RoleType.WORKSPACE}
        permission={RoleAccessAction.CREATE}
        entity={RoleWorkspacePermissionEntity.INTEGRATION}
        bypassPermissions={isSandbox}
        onClick={() => onShowObservabilityModal()}
        rightIcon={<Icon as={ArrowRightIcon} boxSize="16px" />}
      >
        Set up Multiplayer
      </WidthAccessCheck>
      {!isPublic && (
        <OtelKeysSettingsLink bypassPermissions={isSandbox}>
          Configure Multiplayer
        </OtelKeysSettingsLink>
      )}
    </IntroLayout>
  );
};

export default IssueIntro;
