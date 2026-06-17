import {
  IEntity,
  EntityType,
  CallbackData,
  EntityEvents,
  BranchEvents,
  IEntityCommit,
  CopyEntityParams,
  EntityCommitMeta,
  ResetEntityParams,
  CreateEntityParams,
  DeleteEntityParams,
  EntityCreateResponse,
  GitCommitEntityParams,
  ContextLimitingEvents,
  ITag,
} from "@multiplayer/types";
import {
  useMemo,
  useState,
  useEffect,
  useContext,
  useCallback,
  createContext,
} from "react";
import { Box, Text } from "@chakra-ui/react";
import { useParams } from "react-router-dom";

import useMessage from "shared/hooks/useMessage";
import { setNestedProperty } from "shared/utils";
import { EntityCategories, PostHogEvents } from "shared/models/enums";
import { fetchAllData } from "shared/helpers/api.helpers";
import {
  commitAllChangesInBranch,
  getBranchState,
  importEntity,
  updateEntity,
} from "shared/services/version.service";
import { entityCategoryMap } from "shared/configs/project.configs";

import PageLoading from "shared/components/PageLoading";

import {
  EntityWithMeta,
  IBranchMergePayload,
  IBranchUpdatePayload,
  IEntityUpdatePayload,
  IProjectBranchState,
} from "shared/models/interfaces";
import { useSocket } from "./SocketContext";
import { useVersion } from "./VersionContext";
import { useAnalytics } from "shared/providers/AnalyticsContext";

interface IEntitiesContext {
  allEntities: EntityWithMeta[];
  entity: EntityWithMeta;
  entitiesFetching: boolean;
  entities: Record<EntityCategories, EntityWithMeta[]>;
  entityCommits: Record<string, IEntityCommit>;
  entityAliasesMap: Map<string, EntityWithMeta>;
  onEntityDelete: (id: string, type: string) => void;
  onEntityUpdate: (
    id: string,
    data: { key?: string; metadata?: Record<string, string>; tags?: ITag[] }
  ) => void;
  onEntityCreate: (
    payload: Omit<CreateEntityParams, "branchId">
  ) => Promise<IEntity>;
  onEntityImport: (payload: FormData) => Promise<IEntity>;
  onEntityGitCommit: (params: GitCommitEntityParams) => Promise<unknown>;
  onMerge: (payload: IBranchMergePayload) => Promise<unknown>;
  onUpdate: (payload: IBranchUpdatePayload) => Promise<unknown>;
  onMergePreparation: (branchId: string) => Promise<unknown>;
  onEntityReset: (params: ResetEntityParams) => Promise<unknown>;
  onEntityCopy: (params: CopyEntityParams) => Promise<unknown>;
  subscribeToBranch: (branchId: string) => () => void;
  fetchEntities: () => Promise<void>;
  fetchEntitiesByType: (
    type: EntityType,
    ids?: string[]
  ) => Promise<IProjectBranchState[]>;
  addListenerToBranch: (
    listenTo: string,
    callback: (arg?: unknown) => void
  ) => () => void;
  findEntityInCache: (entityId: string) => IEntity;
}

export const EntitiesContext = createContext<IEntitiesContext | null>(null);
type EntityCommitState = Record<string, IEntityCommit>;

export const EntitiesProvider = ({ children }) => {
  const message = useMessage();
  const { path: currentEntityId } = useParams();
  const { trackEvent } = useAnalytics();
  const { currentBranchId, openBranch, defaultBranchId } = useVersion();
  const [entitiesFetching, setEntitiesFetching] = useState(true);
  const [entities, setEntities] = useState<EntityWithMeta[]>([]);
  const [entityCommits, setEntityCommits] = useState<EntityCommitState>({});
  const { connected, subscribe, unsubscribe, emitEvent } = useSocket();

  const groupedEntities = useMemo(() => {
    return entities.reduce(
      (acc, entity) => {
        if (
          entity.type === EntityType.PLATFORM_COMPONENT &&
          !entity.meta?.summary
        ) {
          setNestedProperty(entity, ["meta", "summary"], entity.metadata);
        }
        acc[entityCategoryMap[entity.type]]?.push(entity);
        return acc;
      },
      {
        [EntityCategories.REPOSITORY]: [],
        [EntityCategories.SCHEMA]: [],
        [EntityCategories.COMPONENT]: [],
        [EntityCategories.DOCUMENT]: [],
        [EntityCategories.SKETCH]: [],
        [EntityCategories.PLATFORM]: [],
        [EntityCategories.ENVIRONMENT]: [],
        [EntityCategories.SOURCE]: [],
        [EntityCategories.VARIABLE_GROUP]: [],
      }
    );
  }, [entities]);

  const entityAliasesMap = useMemo(() => {
    const aliases = new Map();
    entities.forEach((e) => {
      aliases.set(e.key, e);
      e.keyAliases?.forEach((alias) => {
        aliases.set(alias, e);
      });
    });
    return aliases;
  }, [entities]);

  const entity = useMemo(() => {
    return entities.find((e) => e.entityId === currentEntityId);
  }, [entities, currentEntityId]);

  const findEntityInCache = useCallback(
    (entityId: string) => {
      return entities.find((e) => e.entityId === entityId);
    },
    [entities]
  );

  const onEntityGitCommit = useCallback(
    (params: GitCommitEntityParams) => {
      return new Promise((resolve, reject) => {
        emitEvent(EntityEvents.ENTITY_GIT_COMMIT, params, (e) => {
          if (e.error) {
            reject(e.error);
            return;
          }
          resolve(e.data);
        });
      });
    },
    [emitEvent]
  );

  const onEntityCopy = useCallback(
    (params: CopyEntityParams) => {
      return new Promise((resolve, reject) => {
        emitEvent(EntityEvents.ENTITY_COPY, params, (e) => {
          if (e.error) {
            reject(e.error);
            return;
          }
          setEntities((prev) => [e.data, ...prev]);
          resolve(e.data as IEntity);
        });
      });
    },
    [emitEvent]
  );

  const onEntityReset = useCallback(
    (params: ResetEntityParams) => {
      return new Promise((resolve, reject) => {
        emitEvent(EntityEvents.ENTITY_RESET, params, (e) => {
          if (e.error) {
            reject(e.error);
            return;
          }
          resolve(e.data);
        });
      });
    },
    [emitEvent]
  );

  const onMerge = useCallback(
    (params: {
      projectBranchFrom: string;
      projectBranchTo: string;
      excludedEntities?: string[];
    }) => {
      return new Promise((resolve, reject) => {
        emitEvent(BranchEvents.MERGE, params, (e) => {
          if (e.error) {
            reject(e.error);
            return;
          }
          resolve(e.data);
        });
      });
    },
    [emitEvent]
  );

  const onUpdate = useCallback(
    (params: {
      baseBranch: string;
      branchToUpdate: string;
      resolutions?: Record<string, any>;
    }) => {
      return new Promise((resolve, reject) => {
        emitEvent(BranchEvents.UPDATE, params, (e) => {
          if (e.error) {
            reject(e.error);
            return;
          }
          resolve(e.data);
        });
      });
    },
    [emitEvent]
  );

  const onMergePreparation = useCallback((branchId) => {
    return commitAllChangesInBranch(branchId);
  }, []);

  const onEntityCreate = useCallback(
    (entity: Omit<CreateEntityParams, "branchId">): Promise<IEntity> => {
      return new Promise((resolve, reject) => {
        const params: CreateEntityParams = {
          ...entity,
          branchId: currentBranchId,
        };

        emitEvent(
          EntityEvents.ENTITY_CREATE,
          params,
          (e: CallbackData<EntityCreateResponse>) => {
            if (e.error) {
              reject(e.error);
              return;
            }
            setEntities((prev) => {
              if (
                prev.some(
                  (entity) => e.data.entity.entityId === entity.entityId
                )
              ) {
                return prev;
              }
              return [e.data.entity, ...prev];
            });
            resolve(e.data.entity);
          }
        );
      });
    },
    [emitEvent, currentBranchId]
  );

  const onEntityImport = useCallback(
    async (payload: FormData): Promise<IEntity> => {
      try {
        const res = await importEntity(currentBranchId, payload);
        return res.entity;
      } catch (error) {
        return Promise.reject(error);
      }
    },
    [emitEvent, currentBranchId]
  );

  const onEntityUpdate = useCallback(
    async (entityId: string, data: Partial<IEntityUpdatePayload>) => {
      try {
        const { entity } = await updateEntity(currentBranchId, entityId, data);
        setEntities((prev) =>
          prev.map((e) =>
            e.entityId === entityId
              ? { ...e, key: entity.key, meta: entity.metadata }
              : e
          )
        );
      } catch (err) {
        message.handleError(err);
        return;
      }
    },
    [emitEvent, message, currentBranchId]
  );

  const onEntityDelete = useCallback(
    (id: string, type: string) => {
      const params: DeleteEntityParams = {
        entityId: id,
        branchId: currentBranchId,
      };
      emitEvent(EntityEvents.ENTITY_DELETE, params, (res) => {
        if (res.error) {
          message.handleError(res.error);
          return;
        }
        setEntities((prev) => prev.filter((i) => i.entityId !== id));
        trackEvent(PostHogEvents.DELETE_ENTITY, {
          ...params,
          type,
        });
      });
    },
    [emitEvent, message, currentBranchId]
  );

  const subscribeToBranch = useCallback(
    (branchId: string) => {
      if (branchId !== currentBranchId) {
        emitEvent(ContextLimitingEvents.BRANCH_SUBSCRIBE, branchId);
      }
      return () => {
        if (branchId !== currentBranchId) {
          emitEvent(ContextLimitingEvents.BRANCH_UNSUBSCRIBE, branchId);
        }
      };
    },
    [currentBranchId]
  );

  const addListenerToBranch = useCallback(
    (listenTo: string, callback: (args: any) => void) => {
      subscribe(listenTo, callback);
      return () => {
        unsubscribe(listenTo, callback);
      };
    },
    [currentBranchId, emitEvent, subscribe, unsubscribe]
  );

  const fetchEntitiesByType = useCallback(
    async (
      entityType: EntityType,
      entityId?: string[]
    ): Promise<IProjectBranchState[]> => {
      const page = 0;
      const limit = 100;
      const params = { entityType, entityId };
      try {
        const res = await fetchAllData<IProjectBranchState>(
          getBranchState.bind(null, currentBranchId),
          params,
          page,
          limit
        );

        if (res?.length) {
          setEntityCommits((prev) =>
            res.reduce(
              (acc, { entity, entityCommit }) => {
                acc[entity.entityId] = entityCommit;
                return acc;
              },
              { ...prev }
            )
          );

          setEntities((prev) =>
            res.reduce(
              (acc, { entity, entityCommit }) => {
                acc.unshift({
                  ...entity,
                  meta: entityCommit.meta,
                  key: entityCommit.meta?.entityName || entity.key,
                });
                return acc;
              },
              // Filter out entities in `prev` that are not in `res`
              prev.filter(
                (e) =>
                  !res.some(
                    ({ entity: newEntity }) => newEntity.entityId === e.entityId
                  )
              )
            )
          );
        }
        return res;
      } catch (error) {
        return [];
      }
    },
    [currentBranchId]
  );

  const fetchEntities = useCallback(async () => {
    const page = 0;
    const limit = 100;
    const params = {};

    setEntitiesFetching(true);

    const res = await fetchAllData<IProjectBranchState>(
      getBranchState.bind(null, currentBranchId),
      params,
      page,
      limit
    );
    setEntityCommits(
      res.reduce((acc, { entity, entityCommit }) => {
        acc[entity.entityId] = entityCommit;
        return acc;
      }, {})
    );
    setEntities(
      res.map<IEntity & { meta: EntityCommitMeta }>(
        ({ entity, entityCommit }) => ({
          ...entity,
          meta: entityCommit.meta,
        })
      )
    );
    setEntitiesFetching(false);
  }, [currentBranchId]);

  useEffect(() => {
    if (currentBranchId) {
      fetchEntities();
    }
  }, [currentBranchId, fetchEntities]);

  useEffect(() => {
    const onEntityCreate = (entityCreateResponse: EntityCreateResponse) => {
      setEntities((prev) => {
        if (
          prev.some(
            (entity) => entityCreateResponse.entity.entityId === entity.entityId
          )
        ) {
          return prev;
        }
        return [entityCreateResponse.entity, ...prev];
      });
    };

    const onEntityDelete = (data: { entityId: string; branchId: string }) => {
      setEntities((prev) => prev.filter((i) => i.entityId !== data.entityId));
    };

    const onEntityUpdate = (entity: IEntity) => {
      setEntities((prev) =>
        prev.map((e) => (e.entityId === entity.entityId ? entity : e))
      );
    };

    const onEntityCommit = (commit: IEntityCommit) => {
      setEntityCommits((prev) => ({ ...prev, [commit.entity]: commit }));
    };

    const onBranchDelete = (deletedBranchId: string) => {
      if (deletedBranchId === currentBranchId) {
        openBranch(defaultBranchId);
      }
    };

    if (connected) {
      subscribe(EntityEvents.ENTITY_CREATE, onEntityCreate);
      subscribe(EntityEvents.ENTITY_DELETE, onEntityDelete);
      subscribe(EntityEvents.ENTITY_UPDATE, onEntityUpdate);
      subscribe(EntityEvents.ENTITY_COMMIT, onEntityCommit);
      subscribe(BranchEvents.DELETE, onBranchDelete);
    }

    return () => {
      unsubscribe(EntityEvents.ENTITY_CREATE, onEntityCreate);
      unsubscribe(EntityEvents.ENTITY_UPDATE, onEntityUpdate);
      unsubscribe(EntityEvents.ENTITY_DELETE, onEntityDelete);
      unsubscribe(EntityEvents.ENTITY_COMMIT, onEntityCommit);
      unsubscribe(BranchEvents.DELETE, onBranchDelete);
    };
  }, [connected, emitEvent, subscribe, unsubscribe]);

  useEffect(() => {
    emitEvent(ContextLimitingEvents.BRANCH_SUBSCRIBE, currentBranchId as any);
    return () => {
      emitEvent(
        ContextLimitingEvents.BRANCH_UNSUBSCRIBE,
        currentBranchId as any
      );
    };
  }, [emitEvent, currentBranchId]);

  return (
    <EntitiesContext.Provider
      value={{
        entity,
        entityAliasesMap,
        allEntities: entities,
        entities: groupedEntities,
        entitiesFetching: entitiesFetching,
        entityCommits,
        onMerge,
        onUpdate,
        onEntityReset,
        onEntityCopy,
        onEntityCreate,
        onEntityImport,
        onEntityDelete,
        onEntityUpdate,
        onEntityGitCommit,
        onMergePreparation,
        subscribeToBranch,
        addListenerToBranch,
        fetchEntities,
        fetchEntitiesByType,
        findEntityInCache,
      }}
    >
      {entitiesFetching && !entities.length ? (
        <Box m="auto" textAlign="center">
          <PageLoading position="static" />
          <Text mt="2" color="muted">
            Fetching entities...
          </Text>
        </Box>
      ) : (
        children
      )}
    </EntitiesContext.Provider>
  );
};

export function useEntities() {
  const context = useContext(EntitiesContext);
  if (context === null) {
    throw new Error("useEntities must be used within EntitiesProvider");
  }
  return context;
}
