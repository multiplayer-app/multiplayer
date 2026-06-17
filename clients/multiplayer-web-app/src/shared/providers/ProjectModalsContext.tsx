import { createContext, useContext, useEffect, useRef, useState } from "react";
import { UseDisclosureReturn, useDisclosure } from "@chakra-ui/react";

import { IProjectBranch } from "@multiplayer/types";
import { useVersion } from "./VersionContext";
import BranchModal from "shared/components/BranchModal";
import ChangesModal from "shared/components/ChangesModal";
import MultiplayerSandbox from "shared/components/MultiplayerSandbox";
import * as WorkspaceService from "shared/services/workspace.service";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import { useTabs } from "shared/providers/TabsContext";
import { useIntegrations } from "shared/providers/IntegrationsContext";
import { ProjectSourceType } from "shared/models/enums";
import { projectCategoryConfigs } from "shared/configs/project";

interface IProjectModalsContext {
  changesModal: UseDisclosureReturn;
  createBranchModal: UseDisclosureReturn;
  openChangesModal: (
    sourceBranch: IProjectBranch,
    targetBranch?: IProjectBranch
  ) => void;
}

interface IProjectModalsState {
  changesModal: any;
  createBranchModal: any;
}

const MULTIPLAYER_SANDBOX_DISMISSED_KEY = "mp-multiplayer-sandbox-dismissed";

export const ProjectModalsContext = createContext<IProjectModalsContext>(null);

export const ProjectModalsProvider = ({ children }) => {
  const { workspace, isPublic, updateWorkspace } = useWorkspace();
  const { onTabOpen } = useTabs();
  const { defaultBranch, defaultBranchId, onBranchCreate } = useVersion();
  const [hasDismissedMultiplayerSandbox, setHasDismissedMultiplayerSandbox] =
    useState(false);

  const stateRef = useRef<IProjectModalsState>({
    changesModal: {},
    createBranchModal: {},
  });
  const { onShowObservabilityModal } = useIntegrations();
  const changesModal = useDisclosure();
  const createBranchModal = useDisclosure();
  const welcomeModal = useDisclosure();

  useEffect(() => {
    const dismissed = localStorage.getItem(MULTIPLAYER_SANDBOX_DISMISSED_KEY);
    if (dismissed === "true") {
      setHasDismissedMultiplayerSandbox(true);
    }
  }, []);

  useEffect(() => {
    if (workspace.data && !workspace.data.isWorkspaceOnboarded) {
      onShowObservabilityModal(false);

      setTimeout(() => {
        onTabOpen({
          _id: ProjectSourceType.AGENTS,
          key: projectCategoryConfigs[ProjectSourceType.AGENTS].name,
          sourceType: ProjectSourceType.AGENTS,
        });
      });

      WorkspaceService.updateWorkspace(workspace.data._id, {
        isWorkspaceOnboarded: true,
      }).then(() => {
        updateWorkspace({ isWorkspaceOnboarded: true });
      });
    }
  }, [workspace.data?.isWorkspaceOnboarded]);

  useEffect(() => {
    if (isPublic) {
      hasDismissedMultiplayerSandbox
        ? welcomeModal.onClose()
        : welcomeModal.onOpen();
    }
  }, [isPublic, hasDismissedMultiplayerSandbox]);

  const handleMultiplayerSandboxClose = () => {
    setHasDismissedMultiplayerSandbox(true);
    localStorage.setItem(MULTIPLAYER_SANDBOX_DISMISSED_KEY, "true");
  };

  const openChangesModal = (
    sourceBranch: IProjectBranch,
    targetBranch: IProjectBranch = defaultBranch.data
  ) => {
    stateRef.current.changesModal = { sourceBranch, targetBranch };
    changesModal.onOpen();
  };

  return (
    <ProjectModalsContext.Provider
      value={{
        changesModal,
        createBranchModal,
        openChangesModal,
      }}
    >
      {children}
      <BranchModal
        disclosure={createBranchModal}
        defaultBranchId={defaultBranchId}
        onComplete={onBranchCreate}
      />
      <ChangesModal
        disclosure={changesModal}
        sourceBranch={stateRef.current.changesModal.sourceBranch}
        targetBranch={stateRef.current.changesModal.targetBranch}
      />
      {isPublic && (
        <MultiplayerSandbox
          disclosure={welcomeModal}
          onCloseComplete={handleMultiplayerSandboxClose}
        />
      )}
    </ProjectModalsContext.Provider>
  );
};

export function useProjectModals() {
  const context = useContext(ProjectModalsContext);
  if (context === null) {
    throw new Error(
      "useProjectModals must be used within ProjectModalsProvider"
    );
  }
  return context;
}
