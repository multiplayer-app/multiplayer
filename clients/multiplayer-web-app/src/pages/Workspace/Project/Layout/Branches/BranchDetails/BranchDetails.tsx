import {
  Tab,
  Box,
  Icon,
  Flex,
  Text,
  Tabs,
  Menu,
  Button,
  TabList,
  MenuList,
  TabPanel,
  MenuItem,
  TabPanels,
  MenuButton,
  IconButton,
  MenuDivider,
  useDisclosure,
} from "@chakra-ui/react";
import {
  ProjectBranchStatus,
  IProjectBranch,
  RoleAccessAction,
  RoleType,
  RoleProjectPermissionEntity,
} from "@multiplayer/types";
import {
  MergeIcon,
  MoreDotesIcon,
  ArrowLeftIcon,
  SwitchIcon,
} from "shared/icons";
import useMessage from "shared/hooks/useMessage";
import { useVersion } from "shared/providers/VersionContext";
import { useThreads } from "shared/providers/ThreadsContext";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import { useProjectModals } from "shared/providers/ProjectModalsContext";
import { deleteBranch, updateBranch } from "shared/services/version.service";

import { DrawerContent } from "shared/components/Drawer/Drawer";
import Threads from "shared/components/Threads";
import BranchModal from "shared/components/BranchModal";
import ThreadActionsRow from "shared/components/Thread/ThreadActionsRow";
import ThreadForm from "shared/components/Thread/ThreadForm";
import { PostHogEvents } from "shared/models/enums";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import StatusBadge from "../StatusBadge";
import Changes from "./Changes";
import Reviews from "./Reviews";
import CheckAccess from "shared/components/CheckAccess";

const BranchDetails = ({
  branch,
  onClose,
  onUpdate,
  parentContainer,
}: {
  branch: IProjectBranch;
  onClose: () => void;
  onUpdate: (branch: IProjectBranch) => void;
  parentContainer: HTMLElement;
}) => {
  const {
    defaultBranchId,
    currentBranchId,
    branches: { params },
    getBranches,
    openBranch,
  } = useVersion();
  const { createThread } = useThreads();
  const message = useMessage();
  const updateModal = useDisclosure();
  const { openAlertDialog } = useAlertDialog();
  const { trackEvent } = useAnalytics();
  const { openChangesModal } = useProjectModals();

  const handleUpdateList = () => {
    getBranches(params);
  };

  const onBranchUpdate = (res) => {
    handleUpdateList();
    onUpdate(res);
  };

  const handleDeleteBranch = async () => {
    try {
      await deleteBranch(branch._id);
      if (branch._id === currentBranchId) {
        openBranch(defaultBranchId);
      }
      handleUpdateList();
      onClose();
    } catch (error) {
      message.handleError(error);
    }
  };

  const handleToggleArchiveBranch = async () => {
    try {
      const res = await updateBranch(branch._id, {
        archived: !branch.archived,
      });
      onBranchUpdate(res);
    } catch (error) {
      message.handleError(error);
    }
  };

  const handleMergeBranch = () => {
    openChangesModal(branch);
    onClose();
  };

  const handleUpdateBranch = async (status: ProjectBranchStatus) => {
    try {
      const res = await updateBranch(branch._id, { archived: false, status });
      if (status === ProjectBranchStatus.TO_REVIEW) {
        trackEvent(PostHogEvents.SUBMITTED_DESIGN_REVIEW, {
          currentBranch: res.name,
          currentBranchId: branch._id,
          type: res.type,
          actionSource: "Project -> Branch details -> Request design review",
        });
      }
      onBranchUpdate(res);
    } catch (error) {
      message.handleError(error);
    }
  };

  const openConfirmationDialog = async () => {
    const result = await openAlertDialog({
      title: "Delete Design Branch",
    });

    if (result) {
      await handleDeleteBranch();
      trackEvent(PostHogEvents.DELETE_BRANCH, {
        branchId: currentBranchId,
      });
    }
  };

  if (!branch) return null;

  return (
    <>
      <DrawerContent className="brand-shadow" parentContainer={parentContainer}>
        <Flex px="4" py="2" mb="4" gap="4" alignItems="center" minH="14">
          <Box minW="10">
            <IconButton
              size="sm"
              variant="base"
              aria-label="close"
              onClick={onClose}
              icon={<Icon color="muted" as={ArrowLeftIcon} />}
            />
          </Box>
          <Text flex="1" fontSize="md" fontWeight="medium" textAlign="center">
            {branch.name}
            <StatusBadge ml="2" status={branch.status} />
          </Text>
          <Box minW="10" textAlign="right">
            {!branch.default && (
              <CheckAccess
                entity={RoleProjectPermissionEntity.PROJECT_BRANCH}
                permission={RoleAccessAction.UPDATE}
                scope={RoleType.PROJECT}
              >
                <Menu placement="bottom-end">
                  <IconButton
                    size="sm"
                    variant="base"
                    as={MenuButton}
                    textAlign="center"
                    aria-label="close"
                    icon={<Icon color="muted" as={MoreDotesIcon} />}
                  />
                  <MenuList zIndex="popover">
                    <MenuItem onClick={updateModal.onOpen}>
                      Update Design Branch
                    </MenuItem>
                    <MenuItem onClick={handleToggleArchiveBranch}>
                      {branch.archived ? "Unarchive" : "Archive"} branch
                    </MenuItem>
                    <CheckAccess
                      entity={RoleProjectPermissionEntity.PROJECT_BRANCH}
                      permission={RoleAccessAction.DELETE}
                      scope={RoleType.PROJECT}
                    >
                      <MenuDivider />
                      <MenuItem onClick={openConfirmationDialog}>
                        Delete Design Branch
                      </MenuItem>
                    </CheckAccess>
                  </MenuList>
                </Menu>
              </CheckAccess>
            )}
          </Box>
        </Flex>
        {!branch.default && currentBranchId !== branch._id && (
          <Box px="4" mb="4">
            <Button
              w="full"
              variant="light"
              leftIcon={<Icon as={SwitchIcon} />}
              onClick={() => openBranch(branch._id)}
            >
              Switch to this design branch
            </Button>
          </Box>
        )}
        <Flex p="0" flex="1" display="flex" flexDirection="column" minH="0">
          <Tabs
            isLazy
            isFitted
            flex="1"
            minH="0"
            display="flex"
            flexDir="column"
            colorScheme="brand"
          >
            <TabList borderBottomWidth="1px" px="4">
              {!branch.default && (
                <Tab px="6" fontSize="sm" mb="-1px" fontWeight="medium">
                  Changes
                </Tab>
              )}
              <CheckAccess
                entity={RoleProjectPermissionEntity.THREAD}
                permission={RoleAccessAction.READ}
                scope={RoleType.PROJECT}
              >
                <Tab px="6" fontSize="sm" mb="-1px" fontWeight="medium">
                  Comments
                </Tab>
              </CheckAccess>
            </TabList>
            <TabPanels
              flex="1"
              minH="0"
              bg="bg.primary"
              display="flex"
              overflow="auto"
              flexDirection="column"
            >
              {!branch.default && (
                <TabPanel
                  gap="4"
                  minH="0"
                  flex="1"
                  overflow="auto"
                  display="flex"
                  flexDirection="column"
                >
                  <CheckAccess
                    entity={RoleProjectPermissionEntity.PROJECT_BRANCH_REVIEW}
                    permission={RoleAccessAction.READ}
                    scope={RoleType.PROJECT}
                  >
                    <Reviews branchId={branch._id} />
                  </CheckAccess>
                  <Changes branchId={branch._id} />
                </TabPanel>
              )}
              <CheckAccess
                entity={RoleProjectPermissionEntity.THREAD}
                permission={RoleAccessAction.READ}
                scope={RoleType.PROJECT}
              >
                <TabPanel
                  flex="1"
                  minH="0"
                  display="flex"
                  flexDirection="column"
                  p="0"
                >
                  <ThreadActionsRow />
                  <Threads />
                  <Box
                    borderTop="1px solid"
                    borderTopColor="border.primary"
                    p={4}
                  >
                    <ThreadForm
                      onSubmit={createThread}
                      parentId="push-drawer"
                    />
                  </Box>
                </TabPanel>
              </CheckAccess>
            </TabPanels>
          </Tabs>
        </Flex>
        {!branch.archived && !branch.default && (
          <CheckAccess
            entity={RoleProjectPermissionEntity.PROJECT_BRANCH}
            permission={RoleAccessAction.UPDATE}
            scope={RoleType.PROJECT}
          >
            <Flex flexDirection="column" gap="2" p="4">
              <BranchAction branch={branch} onUpdate={handleUpdateBranch} />
              {branch.status !== ProjectBranchStatus.MERGED && (
                <Button
                  w="full"
                  variant="light"
                  leftIcon={<Icon as={MergeIcon} />}
                  onClick={handleMergeBranch}
                >
                  Merge
                </Button>
              )}
            </Flex>
          </CheckAccess>
        )}
      </DrawerContent>

      <BranchModal
        target={branch}
        disclosure={updateModal}
        defaultBranchId={defaultBranchId}
        onComplete={onBranchUpdate}
      />
    </>
  );
};

const BranchAction = ({
  branch,
  onUpdate,
}: {
  branch: IProjectBranch;
  onUpdate: (status: ProjectBranchStatus) => void;
}) => {
  switch (branch.status) {
    case ProjectBranchStatus.DRAFT:
      return (
        <Button
          w="full"
          onClick={() => onUpdate(ProjectBranchStatus.TO_REVIEW)}
        >
          Request Design Review
        </Button>
      );
    case ProjectBranchStatus.TO_REVIEW:
      return (
        <Button
          w="full"
          onClick={() => onUpdate(ProjectBranchStatus.IN_DEVELOPMENT)}
        >
          Start Development
        </Button>
      );
    default:
      return null;
  }
};

export default BranchDetails;
