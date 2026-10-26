import { useContext, useState } from "react";
import { Button, Code, Flex, Icon, Stack, Tag, Text } from "@chakra-ui/react";
import {
  ITraceLink,
  RoleAccessAction,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";

import Content from "pages/Workspace/Project/Settings/SettingsLayout/Content";
import CheckAccess from "shared/components/CheckAccess";
import IconButton from "shared/components/IconButton";
import LabelGroup from "shared/components/LabelGroup";
import useMessage from "shared/hooks/useMessage";
import { useProjectEnvironments } from "shared/hooks/useProjectEnvironments";
import {
  ClipboardCopyIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "shared/icons";
import { ProjectContext } from "shared/providers/ProjectContext";
import * as WorkspaceService from "shared/services/workspace.service";

import { useProjectSettings } from "../ProjectSettingsContext";
import TraceLinkModal from "./TraceLinkModal";
import {
  MAX_TRACE_LINKS,
  TRACE_LINK_TYPE_LABELS,
  describeTraceLink,
  describeTraceLinkEnvironments,
} from "./traceLinks.utils";

const TraceLinksTab = () => {
  const { workspaceId, projectId, project, onUpdate } = useProjectSettings();
  const refreshProject = useContext(ProjectContext)?.refreshProject;
  const message = useMessage();
  // index of the link being edited; -1 adds one
  const [editing, setEditing] = useState<number | null>(null);

  const links = project.settings?.traceLinks || [];
  const { environments, loading: environmentsLoading } =
    useProjectEnvironments(workspaceId, projectId);

  // The trace id is appended by the linking tool
  const inboundUrl = `${window.location.origin}/project/${workspaceId}/${projectId}/default/trace/`;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success("Link copied");
    } catch (error) {
      message.handleError({ message: "The link could not be copied" });
    }
  };

  const saveLinks = async (traceLinks: ITraceLink[]) => {
    try {
      await WorkspaceService.updateProject(workspaceId, projectId, {
        settings: { traceLinks },
      });
      await Promise.all([onUpdate(), refreshProject?.()]);
      message.success("Trace links updated");
    } catch (error) {
      message.handleError(error);
      throw error;
    }
  };

  const handleSave = (link: ITraceLink) =>
    saveLinks(
      editing === -1
        ? [...links, link]
        : links.map((existing, index) => (index === editing ? link : existing))
    );

  const handleRemove = (index: number) =>
    saveLinks(links.filter((_, i) => i !== index)).catch(() => undefined);

  return (
    <Content title="Trace links">
      <Stack gap="6">
        <LabelGroup
          label="Open spans in your own tools"
          description="Link a span's trace to Grafana Tempo, its logs to Grafana Loki, or open it in any tool that takes a trace id. The links appear on spans and in alert notifications; scope a link to environments to use a different Grafana per environment. A trace only opens if your tool received it too."
        />

        {links.length ? (
          <Stack gap="2">
            {links.map((link, index) => (
              <Flex
                key={link._id || index}
                gap="3"
                p="3"
                alignItems="center"
                border="1px solid"
                borderColor="border.primary"
                borderRadius="md"
              >
                <Flex direction="column" flex="1" minW="0" gap="1">
                  <Flex gap="2" alignItems="center">
                    <Text fontWeight="medium">{link.name}</Text>
                    <Tag size="sm">{TRACE_LINK_TYPE_LABELS[link.type]}</Tag>
                    <Tag size="sm" variant="outline">
                      {describeTraceLinkEnvironments(link)}
                    </Tag>
                  </Flex>
                  <Text fontSize="sm" color="muted" noOfLines={1}>
                    {describeTraceLink(link)}
                  </Text>
                </Flex>
                <CheckAccess
                  permission={RoleAccessAction.UPDATE}
                  entity={RoleWorkspacePermissionEntity.PROJECT}
                >
                  <IconButton
                    size="sm"
                    variant="ghost"
                    label="Edit"
                    icon={<Icon as={PencilIcon} boxSize="4" />}
                    onClick={() => setEditing(index)}
                  />
                  <IconButton
                    size="sm"
                    variant="ghost"
                    label="Remove"
                    icon={<Icon as={TrashIcon} boxSize="4" color="muted" />}
                    onClick={() => handleRemove(index)}
                  />
                </CheckAccess>
              </Flex>
            ))}
          </Stack>
        ) : (
          <Text color="muted">No trace links yet.</Text>
        )}

        <CheckAccess
          permission={RoleAccessAction.UPDATE}
          entity={RoleWorkspacePermissionEntity.PROJECT}
        >
          <Button
            alignSelf="flex-start"
            size="sm"
            leftIcon={<Icon as={PlusIcon} />}
            onClick={() => setEditing(-1)}
            isDisabled={links.length >= MAX_TRACE_LINKS}
          >
            Add link
          </Button>
        </CheckAccess>
      </Stack>

      <Stack gap="3" mt="10">
        <LabelGroup
          label="Open Multiplayer from your tools"
          description="A link with a trace id opens the session or issue of that trace. Add ?span= with a span id to open that span."
        />
        <Code
          p="2"
          fontSize="xs"
          bg="transparent"
          border="1px solid"
          borderColor="border.primary"
          borderRadius="md"
          wordBreak="break-all"
        >
          {inboundUrl}
          <Text as="span" color="blue.500">
            {"<trace-id>"}
          </Text>
        </Code>
        <Flex gap="2" flexWrap="wrap">
          <Button
            size="sm"
            leftIcon={<Icon as={ClipboardCopyIcon} />}
            onClick={() => copy(`${inboundUrl}\${__value.raw}`)}
          >
            Copy for Grafana
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Icon as={ClipboardCopyIcon} />}
            onClick={() => copy(inboundUrl)}
          >
            Copy URL
          </Button>
        </Flex>
        <Text fontSize="sm" color="muted">
          The Grafana link fills in the trace id itself: use it as the URL of a
          data link on a trace id field, or of a Loki derived field that
          matches the trace id. For other tools, copy the URL and append the
          tool's trace id variable.
        </Text>
      </Stack>

      <TraceLinkModal
        isOpen={editing !== null}
        link={editing !== null && editing >= 0 ? links[editing] : undefined}
        environments={environments}
        environmentsLoading={environmentsLoading}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />
    </Content>
  );
};

export default TraceLinksTab;
