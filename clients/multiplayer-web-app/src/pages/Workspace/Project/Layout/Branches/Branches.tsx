import { memo } from "react";
import { Icon, useDisclosure } from "@chakra-ui/react";
import { IProjectBranch } from "@multiplayer/types";

import BranchesDrawer from "./BranchesDrawer";
import { CommitIcon, LockIcon } from "shared/icons";
import { useVersion } from "shared/providers/VersionContext";
import { useProject } from "shared/providers/ProjectContext";
import IconButton from "shared/components/IconButton";

const Branches = memo(() => {
  const { projectContentContainerRef } = useProject();
  const {
    openBranch,
    currentBranchId,
    isCurrentBranchLocked,
    currentBranch: { data: currentBranch },
  } = useVersion();
  const branchDisclosure = useDisclosure();

  const onBranchSelect = (b: IProjectBranch) => {
    if (currentBranchId === b._id) return;
    openBranch(b._id);
  };

  if (!currentBranch) return;

  return (
    <>
      <IconButton
        size="sm"
        variant="base"
        label={currentBranch.name}
        onClick={branchDisclosure.onToggle}
        icon={<Icon as={CommitIcon} color="muted" />}
      />
      {isCurrentBranchLocked && (
        <Icon as={LockIcon} ml="2" boxSize="4" color="blackAlpha.300" />
      )}
      <BranchesDrawer
        disclosure={branchDisclosure}
        onBranchSelect={onBranchSelect}
        contentContainerRef={projectContentContainerRef}
      />
    </>
  );
});

export default Branches;
