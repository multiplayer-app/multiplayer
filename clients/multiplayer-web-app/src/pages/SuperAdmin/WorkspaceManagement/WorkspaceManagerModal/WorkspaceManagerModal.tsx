import { memo, useState, useCallback, useEffect } from "react";
import {
  Flex,
  Text,
  Grid,
  Stack,
  Badge,
  Modal,
  Switch,
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Avatar,
} from "@chakra-ui/react";
import { IWorkspace, FeatureFlag, IProject } from "@multiplayer/types";

import Tag from "shared/components/Tag";
import TimeAgo from "shared/components/TimeAgo";
import useMessage from "shared/hooks/useMessage";
import {
  getWorkspaceProjects,
  updateFeatureAccess,
} from "shared/services/workspace.service";
import { Link } from "react-router-dom";

interface WorkspaceManagerModalProps {
  isOpen: boolean;
  workspace: IWorkspace | null;
  onClose: () => void;
  onWorkspaceUpdate: (updatedWorkspace: IWorkspace) => void;
}

const WorkspaceManagerModal = memo(
  ({
    isOpen,
    onClose,
    workspace,
    onWorkspaceUpdate,
  }: WorkspaceManagerModalProps) => {
    if (!workspace) return null;

    return (
      <Modal size="2xl" isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex alignItems="center" gap={3}>
              <Text>{workspace.name || "Unnamed Workspace"}</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Tabs>
              <TabList>
                <Tab>Details</Tab>
                <Tab>Projects</Tab>
              </TabList>
              <TabPanels pt="4">
                <TabPanel p="0">
                  <WorkspaceDetails
                    workspace={workspace}
                    onWorkspaceUpdate={onWorkspaceUpdate}
                  />
                </TabPanel>
                <TabPanel p="0">
                  <WorkspaceProjects workspace={workspace} />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
          <ModalFooter justifyContent="space-between">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }
);

const WorkspaceDetails = memo(
  ({
    workspace,
    onWorkspaceUpdate,
  }: {
    workspace: IWorkspace;
    onWorkspaceUpdate: (updatedWorkspace: IWorkspace) => void;
  }) => {
    const message = useMessage();
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    const handleFeatureToggle = useCallback(
      async (flag: FeatureFlag, enabled: boolean) => {
        if (!workspace) return;
        setLoading((prev) => ({ ...prev, [flag]: true }));
        try {
          const updatedWorkspace = await updateFeatureAccess(
            workspace._id,
            flag,
            enabled
          );
          onWorkspaceUpdate(updatedWorkspace);
          message.success(
            `Feature ${flag} ${enabled ? "enabled" : "disabled"} successfully`
          );
        } catch (error) {
          message.handleError(error);
        } finally {
          setLoading((prev) => ({ ...prev, [flag]: false }));
        }
      },
      [workspace, onWorkspaceUpdate, message]
    );

    return (
      <Stack spacing={6}>
        {/* Workspace Info */}
        <Stack spacing={3}>
          <Flex alignItems="center" gap={2}>
            <Text color="muted" fontSize="sm">
              @{workspace.handle}
            </Text>
            {workspace.archived && (
              <Badge colorScheme="gray" size="sm">
                Archived
              </Badge>
            )}
          </Flex>
          <Text color="muted" fontSize="sm">
            Created <TimeAgo date={workspace.createdAt} />
          </Text>
          <Text color="muted" fontSize="sm">
            Billing: {workspace.billing?.stripe?.productName || "Free"}
          </Text>
        </Stack>

        {/* Domains */}
        {workspace.domains && workspace.domains.length > 0 && (
          <Stack spacing={2}>
            <Text fontWeight="500">Domains</Text>
            <Flex gap="1" flexWrap="wrap">
              {workspace.domains.map((domain) => (
                <Tag size="sm" key={domain._id} name={domain.domain} />
              ))}
            </Flex>
          </Stack>
        )}

        {/* Feature Flags */}
        <Stack spacing={4}>
          <Text fontWeight="500">Feature Flags</Text>
          <Grid templateColumns="repeat(2, 1fr)" gap={3}>
            {Object.values(FeatureFlag).map((flag) => (
              <Flex
                key={flag}
                alignItems="center"
                justifyContent="space-between"
                p={3}
                bg="bg.surface"
                borderRadius="lg"
              >
                <Text fontWeight="500">{flag}</Text>
                <Switch
                  colorScheme="brand"
                  isReadOnly={loading[flag]}
                  isChecked={workspace.featureFlags?.[flag] || false}
                  onChange={(e) => handleFeatureToggle(flag, e.target.checked)}
                />
              </Flex>
            ))}
          </Grid>
        </Stack>
      </Stack>
    );
  }
);

const WorkspaceProjects = memo(({ workspace }: { workspace: IWorkspace }) => {
  const [projects, setProjects] = useState<IProject[]>([]);
  const fetchProjects = useCallback(async () => {
    const res = await getWorkspaceProjects(workspace._id);
    setProjects(res.data);
  }, [workspace]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <Stack spacing={6}>
      {projects.map((project) => (
        <Flex key={project._id} alignItems="center" gap={2}>
          <Avatar
            size="sm"
            boxSize="8"
            borderRadius="base"
            name={project.name}
            src={project.iconUrl}
          />
          <Text flex="1">{project.name}</Text>
          <Button
            variant="outline"
            as={Link}
            to={`/public/project/${workspace._id}/${project._id}/default`}
            target="_blank"
          >
            View project
          </Button>
        </Flex>
      ))}
    </Stack>
  );
});

export default WorkspaceManagerModal;
