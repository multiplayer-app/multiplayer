import {
  Grid,
  Flex,
  Icon,
  Button,
  Box,
  Switch,
  Skeleton,
} from "@chakra-ui/react";
import { IntegrationTypeEnum } from "@multiplayer/types";
import { useParams, Link } from "react-router-dom";

import LabelGroup from "shared/components/LabelGroup";
import { integrationTypes } from "shared/configs/git.configs";
import { GearIcon, ExternalLinkIcon } from "shared/icons";
import { useIntegrations } from "shared/providers/IntegrationsContext";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import { Content, NARROW_CONTENT_PROPS } from "../../../SettingsLayout";
import { config } from "../../../../../../../config";

const IntegrationsList = () => {
  const { integrations, onDelete } = useIntegrations();

  return (
    <Content title="Integrations" contentProps={NARROW_CONTENT_PROPS}>
      <Grid
        gap="6"
        flexWrap="wrap"
        gridTemplateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
      >
        {Object.keys(integrationTypes).map((key: IntegrationTypeEnum) => (
          <IntegrationCard
            key={key}
            onDelete={onDelete}
            configs={integrationTypes[key]}
            integrations={integrations.get(key)}
          />
        ))}
      </Grid>
    </Content>
  );
};

const IntegrationCard = ({ configs, integrations, onDelete }) => {
  const { workspaceId } = useParams();
  const { openAlertDialog } = useAlertDialog();
  const { isIntegrationsLoaded } = useIntegrations();
  const apiBase = config.REACT_APP_API_BASE_URL;
  const gitPrefix = config.REACT_APP_GIT_PREFIX;
  const redirectUrl = window.location.origin + window.location.pathname;
  const integration = integrations && integrations[0];

  const openConfirmationDialog = async () => {
    const result = await openAlertDialog({
      title: "Disable integration",
      description:
        "Are you sure you want to remove the integration? Current integration metadata will be removed from the projects",
      confirmBtnLabel: "Disable",
    });

    if (result) {
      try {
        await onDelete(integration.type, integration._id);
      } catch {
        // Error toast from IntegrationsContext
      }
    }
  };

  return (
    <Box
      p="4"
      bg="bg.subtle"
      borderRadius="xl"
      border="1px solid"
      borderColor="border.secondary"
    >
      <Flex gap="4" mb="6">
        <Icon
          as={configs.icon}
          p="2"
          bg="bg.primary"
          boxSize="16"
          borderRadius="md"
          border="1px solid"
          verticalAlign="top"
          borderColor="border.secondary"
        />
        <LabelGroup
          mb="4"
          gap="0"
          label={configs.label}
          description={configs.description}
        />
      </Flex>
      {!isIntegrationsLoaded ? (
        <Skeleton height="36px" borderRadius="md" />
      ) : integration ? (
        <Flex alignItems="center" justifyContent="space-between">
          <Button
            as={Link}
            variant="light"
            leftIcon={<Icon color="muted" as={GearIcon} />}
            to={
              integration.type === IntegrationTypeEnum.SLACK
                ? integrationTypes.SLACK.configUrl
                : `${integration.type}/${integration._id}`
            }
          >
            Configure
          </Button>

          <Switch
            size="lg"
            colorScheme="brand"
            isChecked={true}
            onChange={openConfirmationDialog}
          />
        </Flex>
      ) : (
        <Button
          as="a"
          variant="light"
          leftIcon={<Icon color="muted" as={ExternalLinkIcon} />}
          href={`${apiBase}${gitPrefix}${configs.path}?redirectUrl=${redirectUrl}&workspace=${workspaceId}`}
        >
          Enable this integration
        </Button>
      )}
    </Box>
  );
};
export default IntegrationsList;
