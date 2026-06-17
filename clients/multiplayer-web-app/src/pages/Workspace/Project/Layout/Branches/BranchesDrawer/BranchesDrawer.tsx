import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Flex,
  Text,
  Box,
  Icon,
  Button,
  IconButton,
  UseDisclosureReturn,
} from "@chakra-ui/react";
import {
  IProjectBranch,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";

import {
  PlusIcon,
  CloseIcon,
  ChevronRightIcon,
  CheckVerifiedIcon,
} from "shared/icons";

import Drawer, { DrawerContent } from "shared/components/Drawer/Drawer";
import BranchDetails from "../BranchDetails";

import BranchItem from "../BranchItem";
import BranchesList from "../BranchesList";
import {
  useVersion,
  useVersionDispatch,
} from "shared/providers/VersionContext";
import { VersionActions } from "shared/models/actions";
import { useProjectModals } from "shared/providers/ProjectModalsContext";
import { ThreadsProvider } from "shared/providers/ThreadsContext";
import CheckAccess from "shared/components/CheckAccess";

const BranchesDrawer = ({
  disclosure,
  onBranchSelect,
  contentContainerRef,
}: {
  disclosure: UseDisclosureReturn;
  onBranchSelect: (branch: IProjectBranch) => void;
  contentContainerRef: React.RefObject<HTMLDivElement>;
}) => {
  const {
    currentBranch,
    currentBranchId,
    defaultBranch: { data: defaultBranch },
  } = useVersion();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useVersionDispatch();
  const { createBranchModal } = useProjectModals();
  const [selectedBranch, setSelectedBranch] = useState<IProjectBranch>(null);

  const onBranchOpen = (b: IProjectBranch) => {
    setSelectedBranch(b);
  };

  const onBranchClose = () => {
    setSelectedBranch(null);
    if (location.hash !== "") {
      navigate({ hash: null });
    }
  };

  const onDrawerClose = () => {
    disclosure.onClose();
    setSelectedBranch(null);
  };

  const onBranchUpdate = (branch: IProjectBranch) => {
    setSelectedBranch(branch);
    if (branch._id === currentBranchId) {
      dispatch({
        type: VersionActions.SET_CURRENT_BRANCH_DATA,
        payload: branch,
      });
    }
  };

  useEffect(() => {
    if (location.hash === "#branchDetails") {
      disclosure.onOpen();
      setSelectedBranch(currentBranch.data);
    }
  }, [disclosure.onOpen, location.hash, currentBranch.data]);

  return (
    <Drawer isOpen={disclosure.isOpen}>
      <DrawerContent parentContainer={contentContainerRef.current}>
        <Flex px="4" py="2" gap="4" alignItems="center" minH="14">
          <Box minW="10">
            <IconButton
              size="sm"
              variant="base"
              aria-label="close"
              icon={<CloseIcon />}
              onClick={onDrawerClose}
            />
          </Box>
          <Text flex="1" fontSize="md" fontWeight="medium" textAlign="center">
            Design branches
          </Text>
          <Box minW="10"></Box>
        </Flex>
        <Flex p="0" minH="0" flex="1" flexDir="column">
          <Box px="4" gap="4" mb="4">
            {defaultBranch && (
              <BranchItem
                isDefault={true}
                name={defaultBranch.name}
                date={defaultBranch.updatedAt}
                isActive={currentBranchId === defaultBranch._id}
                onClick={() => onBranchSelect(defaultBranch)}
                leftIcon={<Icon color="brand.500" as={CheckVerifiedIcon} />}
                rightIcon={
                  <IconButton
                    bg="bg.muted"
                    variant="base"
                    aria-label="lock"
                    borderRadius="full"
                    icon={<ChevronRightIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBranchOpen(defaultBranch);
                    }}
                  />
                }
              />
            )}
            <CheckAccess
              entity={RoleProjectPermissionEntity.PROJECT_BRANCH}
              permission={RoleAccessAction.CREATE}
              scope={RoleType.PROJECT}
            >
              <Button
                mt="4"
                w="full"
                variant="light"
                onClick={createBranchModal.onOpen}
                leftIcon={<Icon color="muted" as={PlusIcon} />}
              >
                Create a design branch
              </Button>
            </CheckAccess>
          </Box>
          <BranchesList
            currentBranchId={currentBranchId}
            onBranchSelect={onBranchSelect}
            onBranchOpen={onBranchOpen}
          />
        </Flex>
      </DrawerContent>
      {selectedBranch && (
        <ThreadsProvider branchId={selectedBranch._id}>
          <BranchDetails
            onClose={onBranchClose}
            branch={selectedBranch}
            onUpdate={onBranchUpdate}
            parentContainer={contentContainerRef.current}
          />
        </ThreadsProvider>
      )}
    </Drawer>
  );
};

export default BranchesDrawer;
