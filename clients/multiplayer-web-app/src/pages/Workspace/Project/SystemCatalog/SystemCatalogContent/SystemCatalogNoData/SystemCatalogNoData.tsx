import { useMemo } from "react";
import { Button, Flex, Icon, Text } from "@chakra-ui/react";
import { SystemCatalogTabTypes } from "shared/models/enums";
import { useSharedGeneralModals } from "shared/providers/GeneralModalsContext";
import { ArrowRightIcon, GearIcon, RadarIntroIcon } from "shared/icons";
import { useIntegrations } from "shared/providers/IntegrationsContext";
import SystemCatalogNoDataImage from "shared/components/SystemCatalogNoDataImage";
import {
  RoleAccessAction,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import CheckAccess from "shared/components/CheckAccess";

const SystemCatalogNoData = ({
  selectedTab,
  isRadarActive,
}: {
  selectedTab: SystemCatalogTabTypes;
  isRadarActive: boolean;
}) => {
  const { openContactModal } = useSharedGeneralModals();
  const { observabilityModal } = useIntegrations();

  const emptyState = useMemo(
    () => ({
      tabName: selectedTab.toLowerCase(),
      configuration: "Auto-Documentation",
      isCreatable: [
        SystemCatalogTabTypes.Components,
        SystemCatalogTabTypes.Platforms,
        SystemCatalogTabTypes.Environments,
      ].includes(selectedTab),
    }),
    [selectedTab]
  );

  return isRadarActive ? (
    <Flex direction="column" alignItems="center" gap="4" py="6">
      <SystemCatalogNoDataImage tab={selectedTab} props={{ width: "200px" }} />
      <Text fontSize="large" fontWeight="bold">
        You don't have any {emptyState.tabName} yet!
      </Text>
      <Text fontSize="sm" color="muted" maxWidth="500px" textAlign="center">
        We haven’t detected any {emptyState.tabName} yet - make sure{" "}
        {emptyState.configuration} is correctly configured
        {emptyState.isCreatable
          ? ` or manually create ${emptyState.tabName}`
          : ""}
        . If you have any questions, get in touch with us!
      </Text>
      <Flex alignItems="center" justifyContent="center">
        <Button variant="light" onClick={openContactModal}>
          Contact us
        </Button>
      </Flex>
    </Flex>
  ) : (
    <Flex
      w="full"
      h="full"
      backgroundRepeat="no-repeat"
      backgroundImage={`${process.env.PUBLIC_URL}/assets/radar-not-setup-background.svg`}
    >
      <Flex
        w="full"
        h="full"
        gap="8"
        py="10"
        direction="column"
        alignItems="center"
        background={`linear-gradient(180deg, rgba(255, 255, 255, 0.80) 65.61%, rgba(255, 255, 255, 0.79) 70.36%, rgba(255, 255, 255, 0.77) 74.22%, rgba(255, 255, 255, 0.74) 77.33%, rgba(255, 255, 255, 0.70) 79.83%, rgba(255, 255, 255, 0.65) 81.85%, rgba(255, 255, 255, 0.60) 83.54%, rgba(255, 255, 255, 0.54) 85.02%, rgba(255, 255, 255, 0.47) 86.43%, rgba(255, 255, 255, 0.40) 87.91%, rgba(255, 255, 255, 0.33) 89.6%, rgba(255, 255, 255, 0.26) 91.62%, rgba(255, 255, 255, 0.19) 94.12%, rgba(255, 255, 255, 0.12) 97.24%, rgba(255, 255, 255, 0.06) 101.1%, rgba(255, 255, 255, 0.00) 105.84%)`}
      >
        <Icon as={RadarIntroIcon} boxSize="108px"></Icon>
        <Flex direction="column" alignItems="center" gap="2">
          <Text fontSize="x-large" fontWeight="bold">
            Introducing Auto-Documentation
          </Text>
          <Text fontSize="small" color="muted" maxW="450px" textAlign="center">
            Enable OpenTelemetry to automatically discover, track, and debug
            your system architecture.
          </Text>
        </Flex>
        <CheckAccess
          entity={RoleWorkspacePermissionEntity.INTEGRATION}
          permission={RoleAccessAction.CREATE}
        >
          <Button
            rightIcon={<GearIcon width="16px" />}
            onClick={observabilityModal.onOpen}
          >
            Set-up Multiplayer
            <Icon as={ArrowRightIcon} color="inverse" boxSize="16px" ml={2} />
          </Button>
        </CheckAccess>
      </Flex>
    </Flex>
  );
};

export default SystemCatalogNoData;
