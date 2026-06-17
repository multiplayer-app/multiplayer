import { Button, Icon } from "@chakra-ui/react";
import { ArrowRightIcon, SystemCatalogIcon } from "shared/icons";
import { WidthAccessCheck } from "shared/components/CheckAccess";
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";

import { useIntegrations } from "shared/providers/IntegrationsContext";
import IntroLayout from "shared/components/IntroLayout/IntroLayout";

const SystemCatalogIntro = () => {
  const { onShowObservabilityModal } = useIntegrations();

  return (
    <IntroLayout
      icon={SystemCatalogIcon}
      title="System Dashboard"
      description={
        <>
          Multiplayer automatically discovers, tracks and documents your
          services, dependencies, APIs, and environments. Use this dashboard to
          understand how everything in your system works together.
        </>
      }
      screenshotSrc={`${process.env.PUBLIC_URL}/assets/system-example.svg`}
      screenshotAspectRatio="960 / 560"
    >
      <WidthAccessCheck
        as={Button}
        scope={RoleType.PROJECT}
        permission={RoleAccessAction.READ}
        entity={RoleProjectPermissionEntity.INTEGRATION}
        onClick={() => onShowObservabilityModal()}
      >
        Set up Multiplayer
        <Icon as={ArrowRightIcon} boxSize="16px" ml={2} />
      </WidthAccessCheck>
    </IntroLayout>
  );
};

export default SystemCatalogIntro;
