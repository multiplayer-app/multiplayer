import { useDisclosure } from "@chakra-ui/react";
import { EntityType } from "@multiplayer/types";

import { useEntities } from "shared/providers/EntitiesContext";
import { ThreadsProvider } from "shared/providers/ThreadsContext";
import {
  FullScreenContentContainer,
  FullScreenProvider,
} from "shared/providers/FullScreenContext";
import { useVersion } from "shared/providers/VersionContext";
import { useActiveTabState } from "shared/providers/TabsContext";
import useYUndoManager from "shared/hooks/useYUndoManager";
import EntityThreadsDrawer from "shared/components/EntityThreadsDrawer";
import VariablesGroupEditor from "shared/components/Editors/VariablesGroupEditor";
import VariablesGroupToolbar from "./VariableGroupsToolbar";
import useVariablesGroup from "shared/hooks/useVariablesGroup";

const VariableGroups = ({ doc, provider, readonly, clients }) => {
  const { entity } = useEntities();
  const [{ showVariableChanges }, setActiveTabState] = useActiveTabState({
    showVariableChanges: false,
  });
  const threadsDisclosure = useDisclosure();
  const { currentBranchId } = useVersion();

  const groupData = useVariablesGroup({
    doc,
    provider,
    showChanges: showVariableChanges,
  });

  const undoManager = useYUndoManager([
    doc?.getMap("object")?.get("variables"),
  ]);

  return (
    <FullScreenProvider direction="column" flex="1" minH="0">
      <ThreadsProvider branchId={currentBranchId} objectId={provider.entityId}>
        <VariablesGroupToolbar
          readonly={readonly}
          undoManager={undoManager}
          showChanges={showVariableChanges}
          entityThreadsDisclosure={threadsDisclosure}
          setShowChanges={(value) => {
            setActiveTabState({ showVariableChanges: value });
          }}
        />
        <FullScreenContentContainer
          flex="1"
          minH="0"
          minW="0"
          overflowX="auto"
          position="relative"
        >
          <VariablesGroupEditor
            entityName={entity?.key}
            clients={clients}
            provider={provider}
            readonly={readonly}
            groupData={groupData}
          />
          {threadsDisclosure.isOpen && (
            <EntityThreadsDrawer
              onClose={threadsDisclosure.onClose}
              entityType={EntityType.VARIABLE_GROUP}
            />
          )}
        </FullScreenContentContainer>
      </ThreadsProvider>
    </FullScreenProvider>
  );
};

export default VariableGroups;
