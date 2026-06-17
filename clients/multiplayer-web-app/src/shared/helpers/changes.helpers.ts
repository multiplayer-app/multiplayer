import {
  EntityType,
  EntityCommitChangeType,
  EntityCommitStorageType,
  IGitRef,
} from "@multiplayer/types";
import { Endpoint, EntityStateStatus, StageStatus } from "shared/models/enums";
import { EntityState, IProjectBranchChange } from "shared/models/interfaces";
import { BranchChanges, StageChunk, StagedChange } from "shared/models/types";
import { getNestedProperty, setNestedProperty } from "shared/utils";
import { getExtractedPatch } from "./diff-parsers/platform-diff-parser";
import { getEntityCommitContentsMemo } from "shared/services/version.service";
import { getFileContentsByGitIdMemo } from "shared/services/git.service";
import { getConvertedData } from "./diff-parsers";
import { EntityConverter } from "@multiplayer/entity";

export const getEntityStage = (
  id: string,
  states: Map<string, EntityState>,
  sourceChanges: BranchChanges,
  targetChanges: BranchChanges
): StagedChange => {
  const sourceChange = sourceChanges.get(id);
  const targetChange = targetChanges.get(id);
  const state = states.get(id);

  if (!state.hasConflicts) {
    const sourceStatus = sourceChange
      ? StageStatus.STAGED
      : StageStatus.UNSTAGED;
    const targetStatus = targetChange
      ? StageStatus.STAGED
      : StageStatus.UNSTAGED;

    return {
      [Endpoint.SOURCE]: {
        status: sourceStatus,
        chunks: getStageChunks(Endpoint.SOURCE, state, sourceStatus),
      },
      [Endpoint.TARGET]: {
        status: targetStatus,
        chunks: getStageChunks(Endpoint.TARGET, state, targetStatus),
      },
    };
  } else {
    const sourceChunks = getStageChunks(Endpoint.SOURCE, state);
    const targetChunks = getStageChunks(Endpoint.TARGET, state);

    return {
      [Endpoint.SOURCE]: {
        status: StageStatus.UNSTAGED, //getEntityStageStatus(sourceChunks, StageStatus.STAGED),
        chunks: sourceChunks,
      },
      [Endpoint.TARGET]: {
        status: StageStatus.UNSTAGED, //getEntityStageStatus(targetChunks, StageStatus.UNSTAGED),
        chunks: targetChunks,
      },
    };
  }
};

export const getEntityStageStatus = (
  chunks: StageChunk,
  initialStatus = StageStatus.UNSTAGED
) => {
  const array = Object.values(chunks);
  if (!array.length) return initialStatus;

  return array.some(({ status }) => status === StageStatus.UNSTAGED)
    ? array.some(({ status }) => status === StageStatus.STAGED)
      ? StageStatus.INDETERMINATE
      : StageStatus.UNSTAGED
    : StageStatus.STAGED;
};

export const getStageChunks = (
  endpoint: Endpoint,
  state: EntityState,
  status?: StageStatus
): StageChunk => {
  const { changesForPreview } = state;
  const chunk = {};
  if (!changesForPreview) return chunk;
  state.changesForPreview.groups.forEach(({ groupId, paths }) => {
    paths.forEach((path: string) => {
      const item = getNestedProperty<any>(changesForPreview, [
        endpoint,
        groupId,
        path,
      ]);
      if (!item) return;

      chunk[path] = {
        status: status || StageStatus.UNSTAGED,
      };
    });
  });
  return chunk;
};

export const getOppositeEndpoint = (endpoint) => {
  return endpoint === Endpoint.SOURCE ? Endpoint.TARGET : Endpoint.SOURCE;
};

export const updateStatusByChunks = (value: StagedChange): void => {
  Object.keys(value).forEach((endpoint) => {
    value[endpoint].status = getEntityStageStatus(
      value[endpoint].chunks,
      value[endpoint].status
    );
  });
};

export const getChangeType = (change) => {
  if (!change) return null;
  if (Array.isArray(change)) {
    if (change.length === 1) {
      // Array with single element: added
      return EntityCommitChangeType.CREATE;
    } else if (change.length === 2) {
      // Array with two elements: modified
      return EntityCommitChangeType.UPDATE;
    } else if (change.length === 3 && change[2] === 0) {
      // Array with three elements and last element is 0: removed
      return EntityCommitChangeType.DELETE;
    } else if (change.length === 3 && change[2] === 2) {
      // Array with three elements and last element is 2: text diff
      return EntityCommitChangeType.UPDATE;
    } else if (change.length === 3 && change[2] === 3) {
      // Array with three elements and last element is 3: array move
      return EntityCommitChangeType.UPDATE;
    }
  } else if (typeof change === "object") {
    return EntityCommitChangeType.UPDATE;
  }
};

export const getInitialState = (
  ids: string[],
  sourceChanges: BranchChanges,
  targetChanges: BranchChanges
): Map<string, EntityState> => {
  return new Map<string, EntityState>(
    ids.map((id) => {
      const source = sourceChanges.get(id);
      const target = targetChanges.get(id);

      return [
        id,
        {
          status: EntityStateStatus.WAITING,
          source: source && { entityCommitId: source.entityCommit._id },
          target: target && { entityCommitId: target.entityCommit._id },
        },
      ];
    })
  );
};

export const getCombinedPatch = (state: EntityState, stage: StagedChange) => {
  const combinedPatch = {};
  const combinePatch = (endpoint: Endpoint) => {
    if (state[endpoint] && stage[endpoint].status) {
      Object.keys(stage[endpoint].chunks).forEach((path) => {
        const status = getNestedProperty(stage, [
          endpoint,
          "chunks",
          path,
          "status",
        ]);
        const patch = getNestedProperty(state[endpoint].patch, path);
        if (patch && status === StageStatus.STAGED) {
          setNestedProperty(combinedPatch, path, patch);
        }
      });
    }
  };

  combinePatch(Endpoint.TARGET);
  combinePatch(Endpoint.SOURCE);

  switch (state.entityType) {
    case EntityType.PLATFORM:
      return getExtractedPatch(combinedPatch);
    default:
      return combinedPatch;
  }
};

export const getEntityContent = async (
  entityType: EntityType,
  projectId: string,
  entityId: string,
  branchId: string,
  commitId: string,
  changeType: EntityCommitChangeType,
  storageType: EntityCommitStorageType,
  gitRef?: IGitRef
) => {
  if (changeType === EntityCommitChangeType.DELETE) return;
  if (storageType === EntityCommitStorageType.S3) {
    return getEntityCommitContentsMemo(branchId, entityId, commitId).then(
      (state) => getConvertedData(entityType, state)
    );
  } else {
    return getFileContentsByGitIdMemo(
      projectId,
      gitRef.repositoryId,
      gitRef.path,
      gitRef.branch
    ).then((res) =>
      EntityConverter.convertYDocToData(
        entityType,
        EntityConverter.convertDataToYDoc(entityType, res)
      )
    );
  }
};

export const getEntityContents = (
  entityType: EntityType,
  projectId: string,
  entityId: string,
  source: IProjectBranchChange,
  target?: IProjectBranchChange
) => {
  return Promise.all([
    getEntityContent(
      entityType,
      projectId,
      entityId,
      source.entityCommit.projectBranch,
      source.entityCommit.baseEntityCommit,
      source.entity.typeOfChangeInBranch,
      source.entityCommit.storageType,
      source.entity.gitRef
    ),
    getEntityContent(
      entityType,
      projectId,
      entityId,
      source.entityCommit.projectBranch,
      source.entityCommit._id,
      source.entity.typeOfChangeInBranch,
      source.entityCommit.storageType,
      source.entity.gitRef
    ),
    target &&
      getEntityContent(
        entityType,
        projectId,
        entityId,
        target.entityCommit.projectBranch,
        target.entityCommit._id,
        target.entity.typeOfChangeInBranch,
        target.entityCommit.storageType,
        target.entity.gitRef
      ),
  ]);
};

export const getChangeTypesByDiff = (diff) => {
  const changes = new Map();
  for (const key in diff) {
    if (diff.hasOwnProperty(key)) {
      const change = diff[key];
      if (Array.isArray(change)) {
        if (change.length === 1) {
          // Array with single element: added
          changes.set(key, EntityCommitChangeType.CREATE);
        } else if (change.length === 2) {
          // Array with two elements: modified
          changes.set(key, EntityCommitChangeType.UPDATE);
        } else if (change.length === 3 && change[2] === 0) {
          // Array with three elements and last element is 0: removed
          changes.set(key, EntityCommitChangeType.DELETE);
        } else if (change.length === 3 && change[2] === 2) {
          // Array with three elements and last element is 2: text diff
          changes.set(key, EntityCommitChangeType.UPDATE);
        } else if (change.length === 3 && change[2] === 3) {
          // Array with three elements and last element is 3: array move
          changes.set(key, EntityCommitChangeType.UPDATE);
        }
      } else if (typeof change === "object") {
        const nestedChanges = getChangeTypesByDiff(change);
        changes.set(key, EntityCommitChangeType.UPDATE);
        nestedChanges.forEach((nestedChangeType, nestedChangeKey) => {
          changes.set(`${key}.${nestedChangeKey}`, nestedChangeType);
        });
      }
    }
  }

  return changes;
};

// export const mergeResolution = (
//   localState: Record<string, StagedChange>,
//   sharedState: Record<string, StagedChange>
// ): Record<string, StagedChange> => {
//   const merged = {};

//   for (const entityId in localState) {
//     if (Object.prototype.hasOwnProperty.call(localState, entityId)) {
//       const localEntity = localState[entityId];
//       if (Object.prototype.hasOwnProperty.call(sharedState, entityId)) {
//         const sharedEntity = localState[entityId];

//         merged[entityId] = {
//           source: {},
//           target: {},
//         };
//       } else {
//         // New entity is missing in shared state
//         merged[entityId] = localEntity;
//       }
//     }
//   }
//   return {};
// };
