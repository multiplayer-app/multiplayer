import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Icon, IconButton } from "@chakra-ui/react";
import { BackCircleIcon } from "shared/icons";
import { integrationTypes } from "shared/configs/git.configs";

import { useIntegrations } from "shared/providers/IntegrationsContext";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import { useMemo } from "react";
import { workspaceSettingsHref } from "shared/navigation/workspaceSettingsPath";
import { IIntegration, IntegrationTypeEnum } from "@multiplayer/types";
import IntegrationRepos from "../IntegrationRepos";
import LabelGroup from "shared/components/LabelGroup";
import { IntegrationType } from "shared/models/enums";
import { Content, NARROW_CONTENT_PROPS } from "../../../SettingsLayout";
const Integration = () => {
  const navigate = useNavigate();
  const { type, integrationId, workspaceId } = useParams();
  const { openAlertDialog } = useAlertDialog();
  const {
    integrations,
    projects: integrationProjects,
    onDelete,
  } = useIntegrations();
  const configs = integrationTypes[type];
  const integration = useMemo<IIntegration>(() => {
    const i = integrations.get(type as IntegrationTypeEnum);
    return i && i[0];
  }, [integrations, type]);

  const openConfirmationDialog = async () => {
    const result = await openAlertDialog({
      title: "Disable integration",
      description:
        "Are you sure you want to remove the integration? Current integration metadata will be removed from the projects",
      confirmBtnLabel: "Disable",
    });

    if (result) {
      await handleDelete();
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(type as IntegrationTypeEnum, integrationId);
      navigate(
        workspaceSettingsHref(
          workspaceId!,
          "integrations",
          integrationProjects,
          false
        )
      );
    } catch {
      // Error toast from IntegrationsContext
    }
  };

  const configurationUrl = useMemo(() => {
    if (!configs || !integration) return null;
    const lowType = type.toLowerCase();
    if (integration[lowType]?.integrationSettingsUrl) {
      return integration[lowType]?.integrationSettingsUrl;
    }

    return !integration[lowType]?.installationId
      ? configs.configUrl
      : configs.configUrl.replace(
          "{installationId}",
          integration[lowType]?.installationId
        );
  }, [configs, type, integration]);

  if (!configs || !integration) return null;

  return (
    <Content
      title={configs.label}
      contentProps={NARROW_CONTENT_PROPS}
      leftAction={
        <IconButton
          size="xs"
          variant="base"
          aria-label="back"
          icon={<BackCircleIcon />}
          onClick={() => navigate(-1)}
        />
      }
    >
      <Box
        w="full"
        border="1px"
        bg="bg.subtle"
        borderRadius="xl"
        borderColor="border.secondary"
        p="4"
        mb="8"
      >
        <Icon
          as={configs.icon}
          p="0.5"
          boxSize="8"
          borderRadius="md"
          border="1px solid"
          verticalAlign="top"
          borderColor="border.secondary"
        />
        <LabelGroup
          my="4"
          label="This integration is active"
          description={
            configs.typeKey === IntegrationType.SLACK
              ? ""
              : `You can now connect your ${configs.label} repositories to your Multiplayer projects.`
          }
        />
        <Button
          variant="light"
          as="a"
          target="_blank"
          href={configurationUrl}
          rel="noopener noreferrer"
          isDisabled={!configurationUrl}
        >
          Configure integration
        </Button>
        <Button
          variant="light"
          color="red.600"
          ml="4"
          onClick={openConfirmationDialog}
        >
          Disable
        </Button>
      </Box>
      {configs.typeKey !== IntegrationType.SLACK && (
        <IntegrationRepos
          configs={configs}
          projects={integrationProjects}
          integration={integrationId}
          type={type as IntegrationTypeEnum}
        />
      )}
    </Content>
  );
};

export default Integration;
