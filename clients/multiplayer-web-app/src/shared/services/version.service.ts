import {
  IGitRefTag,
  IProjectLink,
  GitRefTagType,
  IBranchReview,
  IEntityCommit,
  DataWithCursor,
  IProjectBranch,
  IntegrationTypeEnum,
  ProjectLinkObjectType,
  EntityCommitChangeType,
  ProjectBranchReviewState,
  EntityType,
  GitContentType,
  CreateEntityParams,
  IEntity,
  ICommit,
  ListBranchReviewsResponse,
  GetConflictsResponse,
  IPopulatedEntityState,
  ITag,
} from "@multiplayer/types";

import { versionInstance, versionInstanceBaseURL } from "shared/api";

import {
  IListRes,
  ICreateBranchReqBody,
  IUpdateBranchReqBody,
  IGetBranchesReqParams,
  IGetChangesReqParams,
  IGetStateReqParams,
  IProjectBranchChange,
  IGetReleasesReqParams,
  IAIExtractedComponents,
  IEntityUpdateBulkPayload,
  IEntityDeleteBulkPayload,
  IEntityMergePayload,
  IEntityUpdatePayload,
} from "shared/models/interfaces";
import { Buffer } from "buffer";
import { memoizeApiFunction } from "shared/helpers/api.helpers";

export const setBaseUrl = (workspaceId: string, projectId: string) => {
  versionInstance.defaults.baseURL = `${versionInstanceBaseURL}/workspaces/${workspaceId}/projects/${projectId}`;
};

/**
 * Retrieves a list of branches.
 * @param params - Request parameters for retrieving branches.
 * @returns A promise that resolves to a list of branches.
 */
export const getBranches = (
  params: IGetBranchesReqParams
): Promise<IListRes<IProjectBranch>> => {
  return versionInstance.get(`/branches`, { params });
};

/**
 * Creates a new branch.
 * @param body - Request body for creating a branch.
 * @returns A promise that resolves to the created branch.
 */
export const createProjectBranch = (
  body: ICreateBranchReqBody
): Promise<IProjectBranch> => {
  return versionInstance.post("/branches", body);
};

/**
 * Retrieves the default branch for a project.
 * @param params - Parameters specifying the project.
 * @returns A promise that resolves to the default branch.
 */
export const getDefaultProjectBranch = (): Promise<IProjectBranch> => {
  return versionInstance.get(`/branches/default`);
};

/**
 * Retrieves the conflicts between two branches.
 * @param params - Parameters specifying the branch ids.
 * @returns A promise that resolves to the conflicts.
 */
export const getBranchesConflicts = (params: {
  projectBranchFrom: string;
  projectBranchTo: string;
}): Promise<GetConflictsResponse> => {
  return versionInstance.get(`/branches/conflicts`, { params });
};

/**
 * Retrieves a specific branch by ID.
 * @param branchId - The ID of the branch to retrieve.
 * @returns A promise that resolves to the requested branch.
 */
export const getBranchById = (branchId: string): Promise<IProjectBranch> => {
  return versionInstance.get(`/branches/${branchId}`);
};

/**
 * Updates a branch.
 * @param branchId - The ID of the branch to update.
 * @param body - Partial request body containing the updates to apply.
 * @returns A promise that resolves to the updated branch.
 */
export const updateBranch = (
  branchId: string,
  body: Partial<IUpdateBranchReqBody>
): Promise<IProjectBranch> => {
  return versionInstance.patch(`/branches/${branchId}`, body);
};

/**
 * Updates a branch.
 * @param branchId - The ID of the branch to update.
 * @param gitRepositoryId - The ID of the gitRepository to update.
 * @param branchName - The name of branch.
 * @returns A promise that resolves to the updated branch.
 */
export const updateBranchMapping = (
  branchId: string,
  gitRepositoryId: string,
  branchName: string
): Promise<IProjectBranch> => {
  return versionInstance.patch(`branches/${branchId}/git/${gitRepositoryId}`, {
    branchName,
  });
};

/**
 * Deletes a branch.
 * @param branchId - The ID of the branch to delete.
 * @returns A promise that resolves when the branch is successfully deleted.
 */
export const deleteBranch = (
  branchId: string
): Promise<{
  code: number;
  status: string;
  message: string;
}> => {
  return versionInstance.delete(`/branches/${branchId}`);
};

/**
 * Retrieves the state of a branch.
 * @param branchId - The ID of the branch.
 * @param params - Optional request parameters for retrieving the branch state.
 * @returns A promise that resolves to the list of branch states.
 */
export const getBranchState = (
  branchId: string,
  params?: IGetStateReqParams
): Promise<IListRes<IPopulatedEntityState>> => {
  return versionInstance.get(`/branches/${branchId}/state`, { params });
};

/**
 * Retrieves the changes made to a branch.
 * @param branchId - The ID of the branch.
 * @param params - Optional request parameters for retrieving the branch changes.
 * @returns A promise that resolves to the list of branch changes.
 */
export const getBranchChanges = (
  branchId: string,
  params?: IGetChangesReqParams
): Promise<IListRes<IProjectBranchChange>> => {
  return versionInstance.get(`/branches/${branchId}/changes`, { params });
};

export const getBranchChangesStats = (
  branchId: string
): Promise<{ count: number; changeType: EntityCommitChangeType }[]> => {
  return versionInstance.get(`/branches/${branchId}/changes/stats`);
};

export const commitAllChangesInBranch = (
  branchId: string
): Promise<IListRes<IProjectBranchChange>> => {
  return versionInstance.post(`/branches/${branchId}/commit`);
};

/**
 * Updates a commit on a branch.
 * @param branchId - The ID of the branch.
 * @param commitId - The ID of the commit to update.
 * @returns A promise that resolves when the commit is successfully updated.
 */
export const updateCommit = (
  branchId: string,
  commitId: string
): Promise<any> => {
  return versionInstance.patch(`/branches/${branchId}/commits/${commitId}`);
};

/**
 * Deletes a commit from a branch.
 * @param branchId - The ID of the branch.
 * @param commitId - The ID of the commit to delete.
 * @returns A promise that resolves when the commit is successfully deleted.
 */
export const deleteCommit = (
  branchId: string,
  commitId: string
): Promise<any> => {
  return versionInstance.delete(`/branches/${branchId}/commits/${commitId}`);
};

/**
 * Retrieves the reviews made to a branch.
 * @param branchId - The ID of the branch.
 * @returns A promise that resolves to the list of branch reviews.
 */
export const getBranchReviews = (
  branchId: string,
  params?: { skip?: number; limit?: number }
): Promise<IListRes<ListBranchReviewsResponse>> => {
  return versionInstance.get(`/branches/${branchId}/reviews`, { params });
};

/**
 * Retrieves the reviews made to a branch.
 * @param branchId - The ID of the branch.
 */
export const inviteBranchReviewer = (
  branchId: string,
  body: { workspaceUsers: string[]; emails: string[] }
): Promise<IBranchReview> => {
  return versionInstance.post(`/branches/${branchId}/reviews/reviewer`, body);
};

export const deleteReviewer = (
  branchId: string,
  body: { workspaceUser: string }
): Promise<IBranchReview> => {
  return versionInstance.delete(`/branches/${branchId}/reviews/reviewer`, {
    data: body,
  });
};

export const addReview = (
  branchId: string,
  body: { state: ProjectBranchReviewState; comment?: string }
): Promise<IBranchReview> => {
  return versionInstance.post(`/branches/${branchId}/reviews`, body);
};

export const updateReview = (
  branchId: string,
  body: { state: ProjectBranchReviewState; comment?: string }
): Promise<IBranchReview> => {
  return versionInstance.patch(`/branches/${branchId}/reviews`, body);
};

/**
 * Retrieves the commits related to an entity.
 * @param entityId - The ID of the entity.
 * @param branchId - The ID of the branch.
 * @returns A promise that resolves to the list of entity commits.
 */
export const getEntityCommits = (
  branchId: string,
  entityId: string,
  params: {
    name?: string;
    limit?: number;
    skip?: number;
    commit?: string;
    namedOnly?: boolean;
  }
): Promise<IListRes<IEntityCommit>> => {
  return versionInstance.get(
    `/branches/${branchId}/entities/${entityId}/commits`,
    { params }
  );
};
/**
 * Retrieves a specific entity commit.
 * @param branchId - The ID of the branch.
 * @param entityId - The ID of the entity.
 * @param entityCommitId - The ID of the entity commit to retrieve.
 * @returns A promise that resolves to the requested entity commit.
 */
export const updateEntityCommit = (
  branchId: string,
  entityId: string,
  entityCommitId: string,
  body: { name?: string; status?: string; meta?: string }
): Promise<any> => {
  return versionInstance.patch(
    `/branches/${branchId}/entities/${entityId}/commits/${entityCommitId}`,
    body
  );
};

// Repository (repo/file/folder) tags
export const getRepositoryTags = (
  projectBranch: string,
  params: {
    archived?: boolean;
    gitRefPath?: string;
    gitRefType?: IntegrationTypeEnum;

    gitRefBranch?: string;
    gitRefRepositoryId?: string;
    type?: GitRefTagType;
    objectId?: string;
  }
): Promise<DataWithCursor<IGitRefTag>> => {
  return versionInstance.get(`/branches/${projectBranch}/git-ref-tags`, {
    params,
  });
};

export const createProjectRepoTag = (
  projectBranch: string,
  body: {
    archived: boolean;
    gitRef?: {
      repositoryType: IntegrationTypeEnum;
      repositoryId: string;
      repositoryName: string;
      repositoryOwner: string;
      branch: string;
      path: string;
    };
    tags: ITag[];
    systemTags?: string[];

    objectId?: string;
    type: GitRefTagType;
  }
): Promise<IGitRefTag> => {
  return versionInstance.post(`/branches/${projectBranch}/git-ref-tags`, body);
};

export const updateProjectRepoTag = (
  projectBranch: string,
  gitRefTagId: string,
  body: {
    tags: ITag[];
    systemTags: string[];
    archived: boolean;
  }
): Promise<IGitRefTag> => {
  return versionInstance.patch(
    `/branches/${projectBranch}/git-ref-tags/${gitRefTagId}`,
    body
  );
};

// Project links
export const getProjectRepoLinks = (
  projectBranch: string,
  params: {
    archived?: boolean;
    gitRefPath?: string;
    gitRefBranch?: string;
    gitRefRepositoryId?: string;
    gitRefType?: IntegrationTypeEnum;
    sourceObjectType?: ProjectLinkObjectType[];
    targetObjectType?: ProjectLinkObjectType[];
    sourceEntityType?: EntityType[];
    targetEntityType?: EntityType[];
    sourceObjectId?: string;
    targetObjectId?: string;
  }
): Promise<DataWithCursor<IProjectLink>> => {
  return versionInstance.get(`/branches/${projectBranch}/project-links`, {
    params,
  });
};

export const createProjectRepoLink = (
  projectBranch: string,
  body: {
    archived?: boolean;
    sourceGitRef?: {
      path: string;
      branch: string;
      repositoryId: string;
      repositoryType: IntegrationTypeEnum;
      repositoryOwner: string;
      repositoryName: string;
      contentType?: GitContentType;
    };
    sourceObject?: string;
    sourceObjectType: ProjectLinkObjectType;
    targetObject: string;
    targetObjectType: ProjectLinkObjectType;
    sourceUri?: string;
  }
): Promise<IProjectLink> => {
  return versionInstance.post(`/branches/${projectBranch}/project-links`, body);
};

export const createProjectRepoLinksBulk = (
  projectBranch: string,
  body: {
    archived?: boolean;
    sourceGitRef?: {
      path: string;
      branch: string;
      repositoryId: string;
      repositoryOwner: string;
      repositoryName: string;
      repositoryType: IntegrationTypeEnum;
      contentType?: GitContentType;
    };
    sourceObject?: string;
    sourceObjectType: ProjectLinkObjectType;
    targetObject: string;
    targetObjectType: ProjectLinkObjectType;
    sourceUri?: string;
  }[]
): Promise<IProjectLink[]> => {
  return versionInstance.post(
    `/branches/${projectBranch}/project-links/bulk`,
    body
  );
};

export const updateProjectRepoLink = (
  projectBranch: string,
  projectLinkId: string,
  body: {
    rightObject: string;
    archived: boolean;
  }
): Promise<IProjectLink> => {
  return versionInstance.patch(
    `/branches/${projectBranch}/project-links/${projectLinkId}`,
    body
  );
};

export const deleteProjectRepoLink = (
  projectBranch: string,
  projectLinkId: string
): Promise<IProjectLink> => {
  return versionInstance.delete(
    `/branches/${projectBranch}/project-links/${projectLinkId}`
  );
};
export const deleteEntityLinks = (
  projectBranch: string,
  sourceEntityId: string,
  targetEntityId: string
): Promise<IProjectLink> => {
  return versionInstance.delete(`/branches/${projectBranch}/project-links`, {
    params: {
      sourceObject: sourceEntityId,
      targetObject: targetEntityId,
    },
  });
};

export const getEntityCommitContents = (
  branchId: string,
  entityId: string,
  entityCommitId: string
): Promise<Uint8Array> => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(
        `${versionInstance.defaults.baseURL}/branches/${branchId}/entities/${entityId}/commits/${entityCommitId}/contents`,
        { method: "GET", credentials: "include" }
      );

      if (!response.ok) {
        const errorResponse = await response.json();
        const errorMessage = errorResponse.message || "An error occurred";
        throw new Error(errorMessage);
      }
      const res = [];
      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // @ts-ignore
          resolve(Buffer.concat(res));
          return;
        }
        res.push(value);
      }
    } catch (error) {
      reject(error);
    }
  });
};

export const getEntityCommitContentsMemo = memoizeApiFunction<Uint8Array>(
  getEntityCommitContents
);

export const createEntity = (
  projectBranchId: string,
  body: Omit<CreateEntityParams, "branchId">
): Promise<any> => {
  return versionInstance.post(`/branches/${projectBranchId}/entities`, body);
};

export const importEntity = (
  projectBranchId: string,
  body: FormData
): Promise<any> => {
  return versionInstance.post(`/branches/${projectBranchId}/entities`, body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const createEntitiesBulk = (
  projectBranchId: string,
  body: Omit<CreateEntityParams, "branchId">[]
): Promise<{
  added: { entity: IEntity }[];
  deleted: IEntityCommit[];
  total: number;
  commit: ICommit;
}> => {
  return versionInstance.post(
    `/branches/${projectBranchId}/entities/bulk`,
    body
  );
};

export const createEntitiesBulkAI = (
  projectBranchId: string,
  body: {
    name: string;
    components: IAIExtractedComponents[];
  }
): Promise<{ platform: IEntity; components: IEntity[] }> => {
  return versionInstance.post(`/branches/${projectBranchId}/entities/ai`, body);
};

export const updateEntity = (
  projectBranchId: string,
  entityId: string,
  body: Partial<IEntityUpdatePayload>
): Promise<{ entity: IEntity }> => {
  return versionInstance.patch(
    `/branches/${projectBranchId}/entities/${entityId}`,
    body
  );
};

export const updateEntitiesBulk = (
  projectBranchId: string,
  body: Partial<IEntityUpdateBulkPayload>[]
): Promise<{ platform: IEntity; components: IEntity[] }> => {
  return versionInstance.patch(
    `/branches/${projectBranchId}/entities/bulk`,
    body
  );
};

export const deleteEntitiesBulk = (
  projectBranchId: string,
  body: IEntityDeleteBulkPayload
): Promise<{ platform: IEntity; components: IEntity[] }> => {
  return versionInstance.delete(
    `/branches/${projectBranchId}/entities/bulk`,
    body && {
      data: body,
    }
  );
};

export const mergeEntities = (
  projectBranchId: string,
  body: IEntityMergePayload
) => {
  return versionInstance.post(
    `/branches/${projectBranchId}/entities/merge`,
    body
  );
};

// List releases
export const getReleases = (params: IGetReleasesReqParams) => {
  return versionInstance.get(`/releases`, { params });
};

export const createRelease = (body: {
  entity: string;
  version: string;
  releaseNotes?: string;
}) => {
  return versionInstance.post(`/releases`, body);
};

export const updateRelease = (
  releaseId: string,
  body: {
    version?: string;
    releaseNotes?: string;
  }
) => {
  return versionInstance.patch(`/releases${releaseId}`, body);
};

export const deleteRelease = (releaseId: string) => {
  return versionInstance.delete(`/releases${releaseId}`);
};

/**
 * Upload yjs update that cannot be shared through ws.
 * @param branchId - The ID of the branch.
 * @param entityId - The ID of the entity.
 * @param entityUpdateId - The ID of the update.
 * @param update
 * @returns void
 */
export const uploadEntityUpdate = (
  branchId: string,
  entityId: string,
  entityUpdateId: string,
  update: Uint8Array
): Promise<void> => {
  return versionInstance.post(
    `/branches/${branchId}/entities/${entityId}/updates/${entityUpdateId}/upload`,
    Buffer.from(update),
    {
      headers: {
        "Content-Type": "text/plain",
      },
    }
  );
};

/**
 * Download yjs update.
 * @param branchId - The ID of the branch.
 * @param entityId - The ID of the entity.
 * @param entityUpdateId - The ID of the update.
 * @returns void
 */
export const downloadEntityUpdate = (
  branchId: string,
  entityId: string,
  entityUpdateId: string
): Promise<Uint8Array> => {
  return versionInstance.get(
    `/branches/${branchId}/entities/${entityId}/updates/${entityUpdateId}/download`,
    {
      responseType: "arraybuffer",
    }
  );
};
