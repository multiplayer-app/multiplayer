import { Flex, Box, Text, Button } from "@chakra-ui/react";
import { RadarDetectionSource } from "@multiplayer/types";
import { useTabs } from "shared/providers/TabsContext";
import { ComponentStatusBadge } from "shared/components/ComponentStatusBadge";
import { GearIcon } from "shared/icons";
import { useIntegrations } from "shared/providers/IntegrationsContext";

interface EmptyScreenProps {
  type: string;
}

export const EmptyScreen = ({ type }: EmptyScreenProps) => {
  const { onAutoDocsOpen } = useTabs();
  return (
    <Flex
      m="auto"
      gap="4"
      direction="column"
      alignItems="center"
      justifyContent="center"
    >
      <ComponentStatusBadge sign={RadarDetectionSource.SYNCED.toString()} />
      <Box textAlign="center">
        <Text mb="2" fontWeight="medium">
          Your platform is in sync with the {type} detected.
        </Text>
        <Text color="muted">That's great work!</Text>
      </Box>
      <Button variant="light" onClick={onAutoDocsOpen}>
        Open System Dashboard
      </Button>
    </Flex>
  );
};

export const EnableRadarScreen = () => {
  const { observabilityModal } = useIntegrations();

  return (
    <Flex
      m="auto"
      gap="4"
      direction="column"
      alignItems="center"
      justifyContent="center"
    >
      <ComponentStatusBadge sign={RadarDetectionSource.SYNCED.toString()} />
      <Box textAlign="center">
        <Text mb="2" fontWeight="medium" maxW="360px">
          Enable OpenTelemetry to automatically discover, track, and debug your
          system architecture.
        </Text>
      </Box>
      <Button
        rightIcon={<GearIcon width="16px" />}
        onClick={observabilityModal.onOpen}
      >
        Enable Auto-Docs
      </Button>
    </Flex>
  );
};
