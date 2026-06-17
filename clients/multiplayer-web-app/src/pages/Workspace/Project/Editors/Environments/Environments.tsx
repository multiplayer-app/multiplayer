import { useCallback, useEffect, useMemo } from "react";
import { useDisclosure } from "@chakra-ui/react";
import { EntityType, EnvironmentInformation, ITag } from "@multiplayer/types";
import { EntityCategories } from "shared/models/enums";
import useYMapState from "shared/hooks/useYMapState";
import LazyContent, { lazyModule } from "shared/components/LazyContent";
import useYUndoManager from "shared/hooks/useYUndoManager";
import { useVersion } from "shared/providers/VersionContext";
import { useEntities } from "shared/providers/EntitiesContext";
import { ThreadsProvider } from "shared/providers/ThreadsContext";
import {
  FullScreenContentContainer,
  FullScreenProvider,
} from "shared/providers/FullScreenContext";
import EnvironmentsToolbar from "./EnvironmentsToolbar/EnvironmentsToolbar";
import EntityThreadsDrawer from "shared/components/EntityThreadsDrawer";
import { updateEntity } from "shared/services/version.service";
import useSlugifiedName from "shared/hooks/useSlugifiedName";
import usePresenceState from "shared/hooks/usePresenceState";

const EnvironmentEditor = lazyModule(
  () => import("shared/components/Editors/EnvironmentEditor")
);

const Environments = ({ doc, provider, clients, readonly }) => {
  const undoManager = useYUndoManager([
    doc?.getMap("information"),
    doc?.getXmlFragment("description"),
  ]);
  const threadsDisclosure = useDisclosure();
  const { currentBranchId } = useVersion();
  const { entities } = useEntities();
  const { presenceState } = usePresenceState(clients);

  const [nameMap, onNameChange] = useYMapState<{ name: string }>(
    doc.getMap("name")
  );

  const { slugifiedName, setSlugifiedName } = useSlugifiedName(
    nameMap?.name,
    (val) => {
      onNameChange("name", val);
    }
  );

  useEffect(() => {
    setSlugifiedName(nameMap?.name);
  }, [nameMap?.name]);

  const [environmentInfo, onChange] = useYMapState<EnvironmentInformation>(
    doc.getMap("information")
  );

  const entity = useMemo(() => {
    return entities[EntityCategories.ENVIRONMENT].find(
      (e) => e.entityId === provider.entityId
    );
  }, [entities, provider.entityId]);

  const onAliasChange = useCallback(
    (keyAliases: string[]) => {
      return updateEntity(currentBranchId, provider.entityId, { keyAliases });
    },
    [currentBranchId, provider.entityId]
  );

  const onTagsChange = useCallback(
    (tags: ITag[]) => {
      return updateEntity(currentBranchId, provider.entityId, { tags });
    },
    [currentBranchId, provider.entityId]
  );

  const handleChange = (
    rootKey: "description" | "information" | "name" | "tags" | "keyAliases",
    key: keyof EnvironmentInformation,
    value: any
  ) => {
    switch (rootKey) {
      case "information":
        return onChange(key, value);
      case "name":
        const slugified = value
          .replace(/[^-a-zA-Z0-9\s+]+/gi, "")
          .replace(/\s+/gi, "-")
          .toLowerCase();
        return setSlugifiedName(slugified);
      case "tags":
        return onTagsChange(value);
      case "keyAliases":
        return onAliasChange(value);
      default:
        break;
    }
  };

  return (
    <FullScreenProvider direction="column" flex="1" minH="0">
      <ThreadsProvider branchId={currentBranchId} objectId={provider.entityId}>
        <EnvironmentsToolbar
          readonly={readonly}
          undoManager={undoManager}
          entityThreadsDisclosure={threadsDisclosure}
        />
        <FullScreenContentContainer
          flex="1"
          minH="0"
          minW="0"
          overflowX="auto"
          position="relative"
        >
          <LazyContent
            element={
              <EnvironmentEditor
                doc={doc}
                name={slugifiedName}
                entityName={entity?.key}
                provider={provider}
                readonly={readonly}
                presenceState={presenceState}
                information={environmentInfo}
                undoManager={undoManager.instance.current}
                onChange={handleChange}
              />
            }
          />
          {threadsDisclosure.isOpen && (
            <EntityThreadsDrawer
              onClose={threadsDisclosure.onClose}
              entityType={EntityType.ENVIRONMENT}
            />
          )}
        </FullScreenContentContainer>
      </ThreadsProvider>
    </FullScreenProvider>
  );
};

export default Environments;
