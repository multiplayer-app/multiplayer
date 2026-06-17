import { Button } from "@chakra-ui/react";
import React, { createContext, useContext, useMemo } from "react";
import { useParams } from "react-router-dom";
import { EntityType } from "@multiplayer/types";

import { useMultiplayerState } from "shared/hooks/useMultiplayerState";
import { ConnectionStatus, SocketErrorCodes } from "shared/models/enums";
import {
  MultiplayerState,
  ProviderConfig,
  SocketNamespace,
} from "shared/models/interfaces";
import EntityEmptyView from "shared/components/EntityEmptyView";

import { useTabs } from "./TabsContext";
import { useVersion } from "./VersionContext";
import ErrorBoundary from "../components/ErrorBoundary";
import EntityLoading from "shared/components/EntityLoading";

const MultiplayerStateContext = createContext<MultiplayerState | null>(null);

interface MultiplayerStateProviderProps {
  projectId: string;
  branchId: string;
  children: React.ReactNode;
  entityId?: string;
  entityType?: EntityType;
  configs?: ProviderConfig;
  nameSpace?: SocketNamespace;
  maxConnections?: number;
}

export const MultiplayerStateProvider = ({
  projectId,
  branchId,
  entityId,
  children,
  entityType,
  configs,
  maxConnections = 1,
  nameSpace = SocketNamespace.ENTITY,
}: MultiplayerStateProviderProps) => {
  const state = useMultiplayerState(
    projectId,
    branchId,
    entityId,
    nameSpace,
    configs,
    maxConnections,
    entityType
  );

  return (
    <MultiplayerStateContext.Provider value={state}>
      <ErrorBoundary>
        {state.status === ConnectionStatus.failed ? (
          <ErrorBox error={state.error} />
        ) : state.status !== ConnectionStatus.connected ||
          !state.provider ||
          state.provider.entityId !== entityId ||
          !state.doc ? (
          <EntityLoading type={entityType} />
        ) : (
          children
        )}
      </ErrorBoundary>
    </MultiplayerStateContext.Provider>
  );
};

const ErrorBox = ({ error }) => {
  const { tabs } = useTabs();
  const { openBranch } = useVersion();
  const { branchId, path } = useParams();

  const tabBranchId = useMemo(() => {
    const activeTab = tabs.find((t) => t._id === path);
    return activeTab?.originBranch;
  }, [tabs, path]);

  return error ? (
    error.data?.code === SocketErrorCodes.ENTITY_NOT_FOUND ? (
      <EntityEmptyView
        title="This file does not exist in your current design branch."
        description="Ensure you're in the right design branch or consult your team if you
                believe this file should be present."
      >
        {tabBranchId && tabBranchId !== branchId && (
          <Button mt="12" onClick={() => openBranch(tabBranchId)}>
            Switch branch
          </Button>
        )}
      </EntityEmptyView>
    ) : (
      <EntityEmptyView
        title={
          error.message === "websocket error"
            ? "We're having trouble connecting to Multiplayer. Reload the page to try again."
            : error.message
        }
      />
    )
  ) : (
    <EntityEmptyView title="Failed to fetch entity!" />
  );
};

export const useMultiplayerStateContext = () => {
  const currentUserContext = useContext(MultiplayerStateContext);

  if (!currentUserContext) {
    throw new Error(
      "useMultiplayerState has to be used within <MultiplayerStateContext.Provider>"
    );
  }

  return currentUserContext;
};
