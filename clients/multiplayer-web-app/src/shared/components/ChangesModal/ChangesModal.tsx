import {
  Modal,
  ModalContent,
  ModalOverlay,
  UseDisclosureReturn,
} from "@chakra-ui/react";
import { useVersion } from "shared/providers/VersionContext";
import ChangesView from "../ChangesView";

import { IProjectBranch } from "@multiplayer/types";
import { ChangesProvider } from "shared/providers/ChangesContext";

const ChangesModal = ({
  disclosure,
  sourceBranch,
  targetBranch,
}: {
  disclosure: UseDisclosureReturn;
  sourceBranch: IProjectBranch;
  targetBranch: IProjectBranch;
}) => {
  const { openBranch, currentBranchId } = useVersion();

  const handleMergeDone = async ({
    projectBranchTo,
  }: {
    projectBranchTo: string;
    projectBranchFrom: string;
  }) => {
    disclosure.onClose();
    if (currentBranchId !== projectBranchTo) {
      openBranch(projectBranchTo);
    }
  };

  return (
    <Modal
      motionPreset="slideInBottom"
      isOpen={disclosure.isOpen}
      onClose={disclosure.onClose}
    >
      <ModalOverlay />
      <ModalContent
        m="0"
        maxW="full"
        alignSelf="flex-end"
        borderTopRadius="3xl"
        borderBottomRadius="0"
        h="calc(100% - var(--chakra-space-12))"
      >
        <ChangesProvider
          onMergeDone={handleMergeDone}
          sourceBranch={sourceBranch}
          targetBranch={targetBranch}
          projectId={sourceBranch?.project}
        >
          <ChangesView onMergeDone={handleMergeDone} />
        </ChangesProvider>
      </ModalContent>
    </Modal>
  );
};

export default ChangesModal;
