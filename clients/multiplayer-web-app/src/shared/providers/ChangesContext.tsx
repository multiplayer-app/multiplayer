import { EntityDiffPatch } from "@multiplayer/entity";
import {
  AliasConflict,
  EntityCommitChangeType,
  EntityEvents,
  EntityType,
  IProjectBranch,
  RequestEntityType,
  WarningEvents,
} from "@multiplayer/types";
import React, {
  useRef,
  useState,
  useEffect,
  useContext,
  useCallback,
  createContext,
  useMemo,
} from "react";
import { DiffSupportedEntityTypes } from "shared/configs/project.configs";
import { fetchAllData } from "shared/helpers/api.helpers";
import {
  getEntityStage,
  getInitialState,
  getEntityContents,
  getOppositeEndpoint,
  updateStatusByChunks,
} from "shared/helpers/changes.helpers";
import { Endpoint, EntityStateStatus, StageStatus } from "shared/models/enums";
import {
  EntityState,
  IBranchMergePayload,
  IBranchUpdatePayload,
  IProjectBranchChange, SocketNamespace,
} from 'shared/models/interfaces'
import { BranchChanges, StagedChange } from "shared/models/types";
import {
  getBranchChanges,
  getBranchesConflicts,
} from "shared/services/version.service";
import { useEntities } from "./EntitiesContext";

import useMessage from "shared/hooks/useMessage";
import useYMapState from "shared/hooks/useYMapState";

import {
  MultiplayerStateProvider,
  useMultiplayerStateContext,
} from "./MultiplayerStateContext";

import {
  getConflicts,
  getModifiedData,
  getChangesListForPreview,
} from "shared/helpers/diff-parsers";

interface ChangesProviderProps {
  projectId: string;
  sourceBranch: IProjectBranch;
  targetBranch: IProjectBranch;
  children: React.ReactNode;
  onMergeDone: (arg: {
    projectBranchTo: string;
    projectBranchFrom: string;
  }) => Promise<void>;
}

interface ChangesContextState {
  selected: string;
  sourceBranch: IProjectBranch;
  targetBranch: IProjectBranch;
  entityIds: string[];
  isLoading: boolean;
  isResolved: boolean;
  isAllFetched: boolean;
  aliasConflicts: AliasConflict[];
  conflicts: Set<string>;
  isReloadRequired: boolean;
  sourceChanges: BranchChanges;
  targetChanges: BranchChanges;
  states: Map<string, EntityState>;
  staged: Record<string, StagedChange>;
  preview: string;
  onSelect: (id: string) => void;
  pushChanges: (payload: IBranchMergePayload) => Promise<unknown>;
  pullChanges: (payload: IBranchUpdatePayload) => Promise<unknown>;
  setPreview: React.Dispatch<React.SetStateAction<string>>;
  stageEntityChange: (entityId: string, value: any) => void;
  stageAllChanges: (endpoint: Endpoint, value: boolean) => void;
  reloadChanges: () => void;
  getEntityState: (
    entityId: string,
    source: IProjectBranchChange,
    target: IProjectBranchChange
  ) => Promise<void>;
}
const excludedEntityTypes = new Set([EntityType.FILE]);

export const ChangesProviderContent = ({
  children,
  projectId,
  targetBranch,
  sourceBranch,
  onMergeDone,
}: ChangesProviderProps) => {
  const message = useMessage();
  const { doc } = useMultiplayerStateContext();
  const {
    entities,
    onMerge,
    onUpdate,
    subscribeToBranch,
    onMergePreparation,
    addListenerToBranch,
  } = useEntities();
  const statusRef = useRef<Map<string, EntityStateStatus>>(new Map());
  const [preview, setPreview] = useState<string>();
  const [selected, setSelected] = useState<string>();
  const [loading, setLoading] = useState<boolean>(true);
  const [entityIds, setEntityIds] = useState<string[]>([]);
  const [reloadRequired, setReloadRequired] = useState<boolean>(false);
  const [excludedEntities, setExcludedEntities] = useState<string[]>([]);
  const [allFetched, setAllFetched] = useState<boolean>(false);
  const [conflicts, setConflicts] = useState<Set<string>>(new Set());
  const [aliasConflicts, setAliasConflicts] = useState<AliasConflict[]>([]);
  const [preparationDone, setPreparationDone] = useState<boolean>(false);
  const [states, setStates] = useState<Map<string, EntityState>>(new Map());

  const [sourceChanges, setSourceChanges] = useState<BranchChanges>(new Map());
  const [targetChanges, setTargetChanges] = useState<BranchChanges>(new Map());

  const [resolutions, onResolutionsChange] = useYMapState<
    Record<string, StagedChange>
  >(doc.getMap("resolutions"));

  const stageEntityChange = useCallback(
    (entityId: string, value) => {
      const newValue =
        typeof value === "function"
          ? value(resolutions[entityId], resolutions)
          : value;
      updateStatusByChunks(newValue);
      onResolutionsChange(entityId, newValue);
    },
    [doc, resolutions]
  );

  const stageAllChanges = useCallback(
    (endpoint: Endpoint, checked: boolean) => {
      const status = checked ? StageStatus.STAGED : StageStatus.UNSTAGED;
      Object.keys(resolutions).forEach((key) => {
        const item = resolutions[key];
        if (conflicts.has(key)) {
          const oppEndpoint = getOppositeEndpoint(endpoint);
          item[endpoint].status = status;
          item[endpoint].chunks &&
            Object.keys(item[endpoint].chunks).forEach((key) => {
              item[endpoint].chunks[key] = { status };
            });
          if (checked) {
            item[oppEndpoint].status = StageStatus.UNSTAGED;
            item[oppEndpoint].chunks &&
              Object.keys(item[oppEndpoint].chunks).forEach((key) => {
                item[oppEndpoint].chunks[key] = {
                  status: StageStatus.UNSTAGED,
                };
              });
          }
        }
      });

      doc.transact(() => {
        Object.keys(resolutions).forEach((key) => {
          onResolutionsChange(key, resolutions[key]);
        });
      });
    },
    [conflicts, resolutions, doc]
  );

  const getEntityState = useCallback(
    async (
      entityId: string,
      source: IProjectBranchChange,
      target: IProjectBranchChange
    ) => {
      try {
        if (statusRef.current.get(entityId) !== EntityStateStatus.WAITING) {
          return;
        }

        statusRef.current.set(entityId, EntityStateStatus.FETCHING);

        setStates((prev) => {
          const newMap = new Map(prev);
          newMap.set(entityId, { status: EntityStateStatus.FETCHING });
          return newMap;
        });
        const { entity } = source || target;
        const [initialData, sourceData, targetData] = await getEntityContents(
          entity.type,
          projectId,
          entityId,
          source,
          target
        );

        const isEntityConflict = Boolean(source && target);
        const patcher = EntityDiffPatch.getDiffPatcher(entity.type);
        const canBeResolvedPartially = DiffSupportedEntityTypes.has(
          entity.type
        );

        let conflicts = new Set<string>();
        let sourcePatch;
        let targetPatch;

        if (canBeResolvedPartially) {
          const modifiedInitialData = getModifiedData(entity.type, initialData);
          sourcePatch =
            sourceData &&
            patcher.getDiff(
              modifiedInitialData,
              getModifiedData(entity.type, sourceData)
            );
          targetPatch =
            targetData &&
            patcher.getDiff(
              modifiedInitialData,
              getModifiedData(entity.type, targetData)
            );
        }

        const changesForPreview = getChangesListForPreview(
          entity.type,
          {
            source: source && {
              data: sourceData,
              patch: sourcePatch,
              changes: sourceChanges,
            },
            target: target && {
              data: targetData,
              patch: targetPatch,
              changes: targetChanges,
            },
          },
          entities
        );

        if (sourcePatch && targetPatch) {
          conflicts = getConflicts(
            entity.type,
            sourcePatch,
            targetPatch,
            changesForPreview
          );
        }

        let hasConflicts = false;
        if (isEntityConflict) {
          if (canBeResolvedPartially) {
            hasConflicts =
              source.entity.typeOfChangeInBranch !==
                target.entity.typeOfChangeInBranch || !!conflicts.size;
          } else {
            hasConflicts =
              source.entity.typeOfChangeInBranch !==
                target.entity.typeOfChangeInBranch ||
              source.entity.typeOfChangeInBranch ===
                EntityCommitChangeType.UPDATE;
          }
        }

        statusRef.current.set(entityId, EntityStateStatus.FETCHED);

        setStates((prev) => {
          const newMap = new Map(prev);
          newMap.set(entityId, {
            conflicts,
            hasConflicts,
            entityType: entity.type,
            initialContent: initialData,
            status: EntityStateStatus.FETCHED,
            changesForPreview,
            source: source && {
              content: sourceData,
              patch: sourcePatch,
              entityCommitId: source.entityCommit._id,
              changeType: source.entity.typeOfChangeInBranch,
            },
            target: target && {
              content: targetData,
              patch: targetPatch,
              entityCommitId: target.entityCommit._id,
              changeType: target.entity.typeOfChangeInBranch,
            },
          });
          return newMap;
        });
      } catch (error) {
        console.error(error);
        statusRef.current.set(entityId, EntityStateStatus.FETCHED);
        setStates((prev) => {
          const newMap = new Map(prev);
          newMap.set(entityId, {
            ...newMap.get(entityId),
            hasConflicts: true,
            status: EntityStateStatus.FAILED,
          });
          return newMap;
        });
      }
    },
    [sourceChanges, targetChanges]
  );

  const getChanges = useCallback(async (sourceBranch, targetBranch) => {
    setLoading(true);
    let [sourceBranchChanges, conflictedChanges] = await Promise.all([
      fetchAllData<IProjectBranchChange>(
        getBranchChanges.bind(null, sourceBranch._id)
      ),
      getBranchesConflicts({
        projectBranchFrom: sourceBranch._id,
        projectBranchTo: targetBranch._id,
      }),
    ]);
    const excludedItems = new Set<string>();
    const excludedItemsFilter = (c) => {
      if (excludedEntityTypes.has(c.entity.type)) {
        excludedItems.add(c.entity.entityId);
        return false;
      }
      return true;
    };
    const sourceChanges = new Map(
      sourceBranchChanges
        .filter(excludedItemsFilter)
        .map((c) => [c.entity.entityId, c])
    );
    const targetChanges = new Map<string, IProjectBranchChange>(
      conflictedChanges.commits.filter(excludedItemsFilter).map((c) => [
        c.entity.entityId,
        {
          _id: c.entity.entityId,
          entity: {
            ...c.entity,
            typeOfChangeInBranch: c.entityCommitTo.changeType,
          },
          entityCommit: c.entityCommitTo,
        },
      ])
    );

    const sortByEntityKey = (a: string, b: string) => {
      const keyA =
        sourceChanges.get(a)?.entity.key ||
        targetChanges.get(a)?.entity.key ||
        "";
      const keyB =
        sourceChanges.get(b)?.entity.key ||
        targetChanges.get(b)?.entity.key ||
        "";
      return keyA.localeCompare(keyB);
    };

    const entityIds = Array.from(sourceChanges.keys()).sort(sortByEntityKey);
    const [conflicts, nonConflicts] = entityIds.reduce(
      (acc, id) => {
        acc[sourceChanges.has(id) && targetChanges.has(id) ? 0 : 1].push(id);
        return acc;
      },
      [[], []]
    );

    const ids = conflicts.concat(nonConflicts);

    setEntityIds(ids);
    setConflicts(new Set(conflicts));
    setAliasConflicts(conflictedChanges.aliases);
    setSourceChanges(sourceChanges);
    setTargetChanges(targetChanges);
    setExcludedEntities(Array.from(excludedItems));
    setStates(getInitialState(ids, sourceChanges, targetChanges));
    setLoading(false);

    statusRef.current = new Map(
      ids.map((id) => [id, EntityStateStatus.WAITING])
    );
  }, []);

  const cleanupConflicts = () => {
    doc.transact(() => {
      setStates((prev) => {
        const newStates = new Map(prev);
        conflicts.forEach((entityId) => {
          newStates.set(entityId, {
            ...newStates.get(entityId),
            status: EntityStateStatus.WAITING,
          });
          statusRef.current.set(entityId, EntityStateStatus.WAITING);
          onResolutionsChange(entityId);
        });
        return newStates;
      });
    });
  };

  const reloadChanges = useCallback(async () => {
    cleanupConflicts();
    setAllFetched(false);
    await getChanges(sourceBranch, targetBranch);
    setReloadRequired(false);
  }, [conflicts, doc, onResolutionsChange]);

  const pushChanges = useCallback(
    async (payload) => {
      await onMerge({ ...payload, excludedEntities });
    },
    [excludedEntities]
  );

  const pullChanges = useCallback(
    async (payload) => {
      await onUpdate({ ...payload, excludedEntities });
      getChanges(sourceBranch, targetBranch);
    },
    [sourceBranch, targetBranch, excludedEntities]
  );

  const isResolved = useMemo(() => {
    // Checking conflicts without status, that means conflict is not resolved
    const stagesArray = Object.values(resolutions);
    const unresolvedItem = stagesArray.some(
      (st) => !st.source.status && !st.target.status
    );
    return !unresolvedItem;
  }, [resolutions]);

  useEffect(() => {
    const subscriptions = new Set<() => void>();
    if (preparationDone && targetBranch && sourceBranch) {
      try {
        getChanges(sourceBranch, targetBranch);

        const onEntityUpdates = () => setReloadRequired(true);
        const onMergeFinished = (res: {
          projectBranchTo: string;
          projectBranchFrom: string;
        }) => {
          if (res.projectBranchTo === sourceBranch._id) {
            message.success("Branch updated successfully!");
            getChanges(sourceBranch, targetBranch);
          } else {
            message.success("Branch merged successfully!");
            onMergeDone(res);
          }
        };
        subscriptions.add(subscribeToBranch(sourceBranch._id));
        subscriptions.add(
          addListenerToBranch(EntityEvents.ENTITY_COMMIT, onEntityUpdates)
        );
        subscriptions.add(
          addListenerToBranch(EntityEvents.ENTITY_DELETE, onEntityUpdates)
        );
        subscriptions.add(
          addListenerToBranch(EntityEvents.ENTITY_CREATE, onEntityUpdates)
        );
        subscriptions.add(
          addListenerToBranch(WarningEvents.MERGE_FINISHED, onMergeFinished)
        );
      } catch (error) {
        console.log(error);
      }
    }
    return () => {
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, [
    targetBranch,
    sourceBranch,
    preparationDone,
    getChanges,
    subscribeToBranch,
  ]);

  useEffect(() => {
    const fetchState = async () => {
      if (!entityIds.length) return;
      setAllFetched(false);
      for await (const entityId of entityIds) {
        if (
          statusRef.current.get(entityId) === EntityStateStatus.WAITING &&
          sourceChanges.get(entityId) &&
          targetChanges.get(entityId)
        ) {
          await getEntityState(
            entityId,
            sourceChanges.get(entityId),
            targetChanges.get(entityId)
          );
        }
      }
      setAllFetched(true);
    };
    fetchState();
  }, [entityIds, conflicts, sourceChanges, targetChanges]);

  useEffect(() => {
    if (allFetched) {
      doc.transact(() => {
        Object.keys(resolutions).forEach((key) => {
          if (!states.get(key)) {
            onResolutionsChange(key);
          }
        });
        Array.from(states.keys()).forEach((key) => {
          if (!resolutions[key]) {
            const entityStage = getEntityStage(
              key,
              states,
              sourceChanges,
              targetChanges
            );
            onResolutionsChange(key, entityStage);
          }
        });
      });
    }
  }, [doc, states, allFetched, conflicts, sourceChanges, targetChanges]);

  useEffect(() => {
    const startPreparation = async () => {
      setPreparationDone(false);
      try {
        await onMergePreparation(sourceBranch._id);
      } catch (error) {
        message.handleError(error);
      }
      setPreparationDone(true);
    };
    startPreparation();
  }, [onMergePreparation, sourceBranch]);

  return (
    <ChangesContext.Provider
      value={{
        states,
        selected,
        entityIds,
        conflicts,
        aliasConflicts,
        isResolved,
        sourceBranch,
        targetBranch,
        sourceChanges,
        targetChanges,
        isLoading: loading,
        staged: resolutions,
        isAllFetched: allFetched,
        isReloadRequired: reloadRequired,
        preview,
        reloadChanges,
        pushChanges,
        pullChanges,
        setPreview,
        getEntityState,
        stageAllChanges,
        stageEntityChange,
        onSelect: setSelected,
      }}
    >
      {children}
    </ChangesContext.Provider>
  );
};

const multiplayerStateConfigs = {
  query: { type: RequestEntityType.MERGE_REQUEST },
};

export const ChangesProvider = (props: ChangesProviderProps) => {
  return (
    <MultiplayerStateProvider
      nameSpace={SocketNamespace.REQUEST}
      configs={multiplayerStateConfigs}
      branchId={props.sourceBranch._id}
      projectId={props.sourceBranch.project}
    >
      <ChangesProviderContent {...props} />
    </MultiplayerStateProvider>
  );
};

export const ChangesContext = createContext<ChangesContextState | null>(null);

export function useChangesContext() {
  const context = useContext(ChangesContext);
  if (context === null) {
    throw new Error("useChangesContext must be used within ChangesProvider");
  }
  return context;
}
