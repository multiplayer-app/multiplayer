import {
  IIntegration,
  IGitRepository,
  IntegrationTypeEnum,
  OtelAgentSelectionMode,
} from "@multiplayer/types";
import { gitInstance, gitInstanceBaseURL, gitPublicInstance } from "shared/api";
import { memoizeApiFunction } from "shared/helpers/api.helpers";
import { GitSourceType } from "shared/models/enums";
import {
  IListRes,
  IGetGitReposReqParams,
  IGetIntegrationsReqParams,
  IFileContentRes,
} from "shared/models/interfaces";

export const setGitInstanceBaseUrl = (workspaceId: string) => {
  gitInstance.defaults.baseURL = `${gitInstanceBaseURL}/workspaces/${workspaceId}`;
};

export const createIntegration = (body: {
  project: string;
  type: string;
  name?: string;
  metadata?: any;
  description?: string;
  workspaceRole?: string;
  projectRole?: string;
  otel?: {
    agentSelectionMode?: OtelAgentSelectionMode;
    autoCreateRelease?: boolean;
    autoMergeEnabled?: boolean;
    autoResolveIssues?: boolean;
    autoCreateIssues?: boolean;
  };
}): Promise<any> => {
  return gitInstance.post("/integrations", body);
};

export const updateIntegration = (
  integrationId: string,
  body: {
    name?: string;
    description?: string;
    workspaceRole?: string;
    projectRole?: string;
    otel?: {
      agentSelectionMode?: OtelAgentSelectionMode;
      autoCreateRelease?: boolean;
      autoMergeEnabled?: boolean;
      autoResolveIssues?: boolean;
      autoCreateIssues?: boolean;
    };
  }
): Promise<any> => {
  return gitInstance.patch(`/integrations/${integrationId}`, body);
};

/**
 * Retrieves a list of integrations.
 * @param params - Request parameters for retrieving integrations.
 * @returns A promise that resolves to a list of integrations.
 */
export const getIntegrations = (
  params?: IGetIntegrationsReqParams
): Promise<IListRes<IIntegration>> => {
  return gitInstance.get(`/integrations`, { params });
};

/**
 * Retrieves a specific integration.
 * @param integrationId - The ID of the integration to retrieve.
 * @returns A promise that resolves to the requested integration.
 */
export const getIntegration = (
  integrationId: string
): Promise<IIntegration> => {
  return gitInstance.get(`/integrations/${integrationId}`);
};

/**
 * Deletes an integration.
 * @param integrationId - The ID of the integration to delete.
 * @returns A promise that resolves when the integration is successfully deleted.
 */
export const deleteIntegration = (integrationId: string): Promise<any> => {
  return gitInstance.delete(`/integrations/${integrationId}`);
};

/**
 * Retrieves repositories associated with an integration.
 * @param integrationId - The ID of the integration.
 * @returns A promise that resolves to the list of repositories.
 */
export const getRepositories = (
  integrationId: string,
  params: { page: number; perPage: number }
): Promise<any> => {
  return gitInstance.get(`/integrations/${integrationId}/repositories`, {
    params,
  });
};

/**
 * Retrieves the files within a repository at a specific path.
 * @param repositoryId - The ID of the repository.
 * @param path - The path to the directory or file.
 * @returns A promise that resolves to the contents of the specified directory or file.
 */
export const getRepositoryFiles = (
  projectId: string,
  repositoryId: string,
  path: string,
  params: { ref: string }
): Promise<any> => {
  const repoURI = repositoryId;
  const pathURI = encodeURIComponent(encodeURIComponent(path));
  return gitInstance.get(
    `/projects/${projectId}/git-repositories/${repoURI}/git/files/${pathURI}/contents`,
    {
      params,
    }
  );
};

export const getGitRepositoryFiles = (
  projectId: string,
  repositoryId: string,
  path: string,
  params: { ref: string }
): Promise<any> => {
  const repoURI = repositoryId;
  const pathURI = encodeURIComponent(encodeURIComponent(path));
  return gitInstance.get(
    `/projects/${projectId}/git-repositories/git/${repoURI}/files/${pathURI}/contents`,
    { params, responseType: "text" }
  );
};

export const getFileFullPath = (
  projectId: string,
  repositoryId: string,
  path: string,
  params: { ref: string }
) => {
  const pathURI = encodeURIComponent(path);
  return `${gitInstance.defaults.baseURL}/projects/${projectId}/git-repositories/${repositoryId}/git/files/${pathURI}/contents?ref=${params.ref}`;
};

export const getGitFileFullPath = (
  projectId: string,
  repositoryId: string,
  path: string,
  params: { ref: string }
) => {
  const pathURI = encodeURIComponent(path);
  return `${gitInstance.defaults.baseURL}/projects/${projectId}/git-repositories/git/${repositoryId}/files/${pathURI}/contents?ref=${params.ref}`;
};

/**
 * Retrieves the directory tree of a repository at a specific path.
 * @param projectId - The ID of the project.
 * @param repositoryId - The ID of the repository.
 * @param path - The path to the directory.
 * @param params
 *  @param ref - The ID of the branch.
 *  @param page - The page number.
 *  @param PerPage - The items count per page.
 * @returns A promise that resolves to the directory tree of the specified path.
 */
export const getRepositoryThree = (
  projectId: string,
  repositoryId: string,
  path: string,
  params: { ref: string; page: number; perPage: number }
): Promise<any> => {
  const pathURI = encodeURIComponent(encodeURIComponent(path));

  return gitInstance.get(
    `/projects/${projectId}/git-repositories/${repositoryId}/git/tree/${pathURI}`,
    {
      params,
    }
  );
};

/**
 * Retrieves the branches of a repository.
 * @param integrationId - The ID of the integration.
 * @param repositoryId - The ID of the repository.
 * @returns A promise that resolves to the list of branches.
 */
export const getRepositoryBranches = (
  integrationId: string,
  repositoryId: string
): Promise<any> => {
  return gitInstance.get(
    `/integrations/${integrationId}/repositories/${repositoryId}/branches`
  );
};

export const getWorkspaceGitRepositories = (
  params: IGetGitReposReqParams
): Promise<IListRes<IGitRepository>> => {
  return gitInstance.get(`/git-repositories`, { params });
};

export const getProjectGitRepositories = (
  projectId: string,
  params: IGetGitReposReqParams
): Promise<IListRes<IGitRepository>> => {
  return gitInstance.get(`/projects/${projectId}/git-repositories`, { params });
};

export const getGitRepositoryBranches = (
  projectId: string,
  gitRepositoryId: string
): Promise<any> => {
  return gitInstance.get(
    `/projects/${projectId}/git-repositories/${gitRepositoryId}/git/branches`
  );
};

/**
 * Retrieves the repository info.
 * @param integrationId - The ID of the integration.
 * @param repositoryId - The ID of the repository.
 * @returns A promise that resolves to the repository.
 */
export const getGitRepository = (
  projectId: string,
  gitRepositoryId: string
): Promise<any> => {
  return gitInstance.get(
    `/projects/${projectId}/git-repositories/git/${gitRepositoryId}`
  );
};

export const getGitRepositoryMemo = memoizeApiFunction(getGitRepository);

export const createGitRepositoryBranch = (
  projectId: string,
  gitRepositoryId: string,
  body: { name: string; parentBranch?: string }
): Promise<any> => {
  return gitInstance.post(
    `/projects/${projectId}/git-repositories/${gitRepositoryId}/git/branches`,
    body
  );
};

export const getPublicRepositories = (params: {
  gitProviderType: IntegrationTypeEnum;
  page: number;
  perPage: number;
  repositoryName?: string;
}): Promise<any> => {
  return gitPublicInstance.get(`/public-repositories/git`, {
    params,
  });
};

export const getPublicRepoBranches = (
  gitPublicRepositoryId: string,
  params: {
    gitProviderType: string;
    repositoryName: string;
    page: number;
    perPage: number;
  }
): Promise<any> => {
  return gitPublicInstance.get(
    `/public-repositories/${gitPublicRepositoryId}/git/branches`,
    {
      params,
    }
  );
};

export const createGitPublicRepositoryBranch = (
  projectId: string,
  body: {
    url?: string;
    gitRepositoryType?: string;
    gitRepositoryId?: string;
    archived?: boolean;
  }
): Promise<any> => {
  return gitInstance.post(`/projects/${projectId}/git-repositories`, body);
};

export const getPublicRepositoryTree = (
  gitPublicRepositoryId: string,
  path: string,
  params: {
    gitProviderType: string;
    ref: string;
    page: number;
    perPage: number;
  }
): Promise<any> => {
  const pathURI = encodeURIComponent(encodeURIComponent(path));

  return gitPublicInstance.get(
    `/public-repositories/${gitPublicRepositoryId}/git/tree/${pathURI}`,
    {
      params,
    }
  );
};

export const updateProjectConnections = (body): Promise<any> => {
  return gitInstance.patch(`/git-repositories/bulk`, body);
};

export const deleteProjectGitRepository = (
  gitRepositoryId: string,
  projectId: string
) => {
  return gitInstance.delete(
    `/projects/${projectId}/git-repositories/${gitRepositoryId}`
  );
};

const getSourceType = (extension: string) => {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "ico"];
  const videoExtensions = [
    "mp4",
    "webm",
    "ogg",
    "avi",
    "mov",
    "wmv",
    "mkv",
    "flv",
  ];

  const isImage = imageExtensions.includes(extension);
  const isVideo = videoExtensions.includes(extension);
  if (isImage) return GitSourceType.IMAGE;
  if (isVideo) return GitSourceType.VIDEO;
  return GitSourceType.CODE;
};

export const getFileContents = async (
  projectId: string,
  repositoryId: string,
  filePath: string,
  branch: string
): Promise<IFileContentRes> => {
  const extension = filePath.split(".").pop().toLowerCase();
  const sourceType = getSourceType(extension);
  let contents: string;

  if (sourceType === GitSourceType.CODE) {
    const res = await getRepositoryFiles(projectId, repositoryId, filePath, {
      ref: branch,
    });
    contents = typeof res === "string" ? res : JSON.stringify(res, null, 2);
  } else {
    contents = getFileFullPath(projectId, repositoryId, filePath, {
      ref: branch,
    });
  }

  return { contents, sourceType, extension };
};

export const getFileContentsByGitId = async (
  projectId: string,
  repositoryId: string,
  filePath: string,
  branch: string
): Promise<IFileContentRes> => {
  const extension = filePath.split(".").pop().toLowerCase();
  const sourceType = getSourceType(extension);
  let contents: string;

  if (sourceType === GitSourceType.CODE) {
    const res = await getGitRepositoryFiles(projectId, repositoryId, filePath, {
      ref: branch,
    });
    contents = typeof res === "string" ? res : JSON.stringify(res, null, 2);
  } else {
    contents = getFileFullPath(projectId, repositoryId, filePath, {
      ref: branch,
    });
  }

  return { contents, sourceType, extension };
};

export const getFileContentsByGitIdMemo = memoizeApiFunction(
  getFileContentsByGitId
);
