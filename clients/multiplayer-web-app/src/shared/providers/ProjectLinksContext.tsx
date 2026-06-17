import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  IEntity,
  IGitRepository,
  IProjectLink,
  ProjectLinkObjectType,
} from "@multiplayer/types";
import { useDisclosure } from "@chakra-ui/react";
import {
  createProjectRepoLink,
  getProjectRepoLinks,
  updateProjectRepoLink,
} from "shared/services/version.service";
import { useVersion } from "./VersionContext";
import useMessage from "shared/hooks/useMessage";
import { getNestedProperty } from "shared/utils";
import { fetchAllData } from "shared/helpers/api.helpers";
import { IProjectLinkProps } from "shared/models/interfaces";
import LinkEntityModal from "shared/components/LinkEntityModal";
import { useTabs } from "./TabsContext";
import { ProjectSourceType } from "shared/models/enums";

export const ProjectLinksProvider = ({ children }) => {
  const message = useMessage();
  const modalDisclosure = useDisclosure();
  const { onTabOpen } = useTabs();

  const { currentBranchId: projectBranch } = useVersion();
  const [target, setTarget] = useState<IProjectLinkProps>(null);
  const [repoLinks, setRepoLinks] = useState<Record<string, IProjectLink>>({});
  const [links, setLinks] = useState<
    Record<string, Record<string, IProjectLink>>
  >({});

  const openLinksModal = (target) => {
    setTarget(target);
    modalDisclosure.onOpen();
  };

  const getRepoLinks = useCallback(async (projectBranch) => {
    try {
      const params = {
        sourceObjectType: [ProjectLinkObjectType.GitRepository],
      };
      const data = await fetchAllData<IProjectLink>(
        getProjectRepoLinks.bind(null, projectBranch),
        params
      );
      setRepoLinks(
        data.reduce((acc, item) => {
          acc[item.sourceGitRef.repositoryId] = item;
          return acc;
        }, {})
      );
    } catch (error) {
      console.log(error);
    }
  }, []);

  const getLinks = async (repository: IGitRepository) => {
    if (links[repository._id]) return;
    try {
      const res = await getProjectRepoLinks(projectBranch, {
        gitRefBranch: repository.gitRepository.defaultBranch,
        gitRefRepositoryId: repository.gitRepository.id,
      });
      setLinks((prev) => {
        const newState = { ...prev };
        res.data.forEach((item) => {
          const { sourceGitRef } = item;
          newState[sourceGitRef.repositoryId] = {
            ...(newState[sourceGitRef.repositoryId] || {}),
            [sourceGitRef.path]: item,
          };
        });
        return newState;
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleOpenEntity = (entity: IEntity) => {
    onTabOpen({
      _id: entity.entityId,
      type: entity.type,
      key: entity.key,
      sourceType: ProjectSourceType.ENTITY,
      originBranch: entity.projectBranch,
    });
  };

  const handleUpdateLink = (id: string, value) => {
    return updateProjectRepoLink(projectBranch, id, value);
  };

  const handleCreateLink = (value, targetFile) => {
    return createProjectRepoLink(projectBranch, {
      sourceGitRef: {
        path: targetFile.path,
        branch: targetFile.gitDefaultBranch,
        repositoryId: targetFile.gitRepositoryId,
        repositoryType: targetFile.gitRepositoryType,
        ...(targetFile.objectType === ProjectLinkObjectType.GitFile
          ? { contentType: targetFile.sourceType }
          : {}),
      },
      sourceObjectType: targetFile.objectType,
      archived: false,
      ...value,
    });
  };

  const handleLinkEntities = (sourceObjectId, targetObjectId) => {
    return createProjectRepoLink(projectBranch, {
      sourceObjectType: ProjectLinkObjectType.Entity,
      targetObjectType: ProjectLinkObjectType.Entity,
      sourceObject: sourceObjectId,
      targetObject: targetObjectId,
    });
  };

  const onLinkChange = async (entity: IEntity, sourceFile: any = null) => {
    const targetObject = target || sourceFile;
    if (!entity || !targetObject) {
      return;
    }

    try {
      if (targetObject.objectType === ProjectLinkObjectType.Entity) {
        await handleLinkEntities(targetObject.id, entity.entityId);
      } else {
        const path = targetObject.path;
        const repoId = targetObject.gitRepositoryId;
        const body = {
          targetObject: entity.entityId,
          targetObjectType: ProjectLinkObjectType.Entity,
        };

        const isFile =
          targetObject.objectType === ProjectLinkObjectType.GitFile;
        const editing = isFile
          ? getNestedProperty<IProjectLink>(links, [repoId, path])
          : getNestedProperty<IProjectLink>(repoLinks, [repoId]);

        const res = await (editing
          ? handleUpdateLink(editing.projectLinkId, body)
          : handleCreateLink(body, targetObject));

        if (isFile) {
          setLinks((prev) => ({
            ...prev,
            [repoId]: { ...(prev[repoId] || {}), [path]: res },
          }));
        } else {
          setRepoLinks((prev) => ({ ...prev, [repoId]: res }));
        }
      }
      if (!sourceFile) {
        modalDisclosure.onClose();
        if (target.openEntity !== false) {
          setTimeout(() => {
            handleOpenEntity(entity);
          }, 50);
        }
      }
    } catch (error) {
      message.handleError(error);
    }
  };

  useEffect(() => {
    setLinks({});
    getRepoLinks(projectBranch);
  }, [projectBranch]);

  return (
    <ProjectLinksContext.Provider
      value={{
        links,
        repoLinks,
        getLinks,
        setTarget,
        onLinkChange,
        openLinksModal,
      }}
    >
      {children}
      <LinkEntityModal
        target={target}
        disclosure={modalDisclosure}
        onChange={onLinkChange}
        onClose={() => {
          setTarget(null);
        }}
      />
    </ProjectLinksContext.Provider>
  );
};

export const ProjectLinksContext = createContext<any>(null);

export function useEntitiesLinks() {
  const context = useContext(ProjectLinksContext);
  if (context === null) {
    throw new Error(
      "useEntitiesLinks must be used within ProjectLinksProvider"
    );
  }
  return context;
}
