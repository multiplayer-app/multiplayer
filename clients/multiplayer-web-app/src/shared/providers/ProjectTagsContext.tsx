import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  GitRefTagType,
  IGitRefTag,
  IGitRepository,
  ITag,
} from "@multiplayer/types";
import { useDisclosure } from "@chakra-ui/react";
import {
  createProjectRepoTag,
  getRepositoryTags,
  updateProjectRepoTag,
} from "shared/services/version.service";
import { useVersion } from "./VersionContext";
import useMessage from "shared/hooks/useMessage";
import { getNestedProperty } from "shared/utils";
import { fetchAllData } from "shared/helpers/api.helpers";
import { IProjectTagProps } from "shared/models/interfaces";
import TagEntityModal from "shared/components/TagEntityModal";

export const ProjectTagsProvider = ({
  children,
  objectId,
}: {
  children: ReactNode;
  objectId?: string;
}) => {
  const message = useMessage();
  const modalDisclosure = useDisclosure();
  const { currentBranchId: projectBranch } = useVersion();

  const [target, setTarget] = useState<IProjectTagProps>(null);
  const [repoTags, setRepoTags] = useState<Record<string, any>>({});
  const [tags, setFileTags] = useState<Record<string, Record<string, any>>>({});

  const getRepoTags = useCallback(async (projectBranch) => {
    try {
      const data = await fetchAllData<IGitRefTag>(
        getRepositoryTags.bind(null, projectBranch)
      );
      setRepoTags(
        data.reduce((acc, item) => {
          acc[item.gitRef.repositoryId] = item;
          return acc;
        }, {})
      );
    } catch (error) {
      console.log(error);
    }
  }, []);

  const getFileTags = async (repository: IGitRepository) => {
    if (tags[repository._id]) return;
    try {
      const { data } = await getRepositoryTags(projectBranch, {
        gitRefBranch: repository.gitRepository.defaultBranch,
        gitRefRepositoryId: repository.gitRepository.id,
      });

      setFileTags((prev) => {
        const newState = { ...prev };
        data.forEach((item) => {
          newState[item.gitRef.repositoryId] = {
            ...(newState[item.gitRef.repositoryId] || {}),
            [item.gitRef.path]: item,
          };
        });
        return newState;
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleCreateTag = (value) => {
    return createProjectRepoTag(projectBranch, {
      type: target.type,
      gitRef: target.gitRepositoryId
        ? {
            path: target.path,
            branch: target.gitDefaultBranch,
            repositoryId: target.gitRepositoryId,
            repositoryType: target.gitRepositoryType,
            repositoryName: target.name,
            repositoryOwner: target.gitRepositoryOwner,
          }
        : undefined,
      ...value,
    });
  };

  const handleUpdateTag = (gitRefTagId: string, value) => {
    return updateProjectRepoTag(projectBranch, gitRefTagId, value);
  };

  const updateState = (target, editing, value) => {
    const { gitRepositoryId, type, path } = target;
    switch (type) {
      case GitRefTagType.GIT_FILE:
        setFileTags((prev) => ({
          ...prev,
          [gitRepositoryId]: {
            ...prev[gitRepositoryId],
            [path]: { ...editing, tags: value },
          },
        }));
        break;
      case GitRefTagType.GIT_REPOSITORY:
        setRepoTags((prev) => ({
          ...prev,
          [gitRepositoryId]: { ...prev[gitRepositoryId], tags: value },
        }));
        break;
      default:
        break;
    }
  };

  const addState = (target, value) => {
    const { gitRepositoryId, type, path } = target;
    switch (type) {
      case GitRefTagType.GIT_FILE:
        setFileTags((prev) => ({
          ...prev,
          [gitRepositoryId]: {
            ...(prev[gitRepositoryId] || {}),
            [path]: value,
          },
        }));
        break;
      case GitRefTagType.GIT_REPOSITORY:
        setRepoTags((prev) => ({ ...prev, [gitRepositoryId]: value }));
        break;
      default:
        break;
    }
  };

  const getEditingObject = (target) => {
    const { gitRepositoryId, type, path } = target;
    if (type === GitRefTagType.GIT_FILE) {
      return getNestedProperty<IGitRefTag>(tags, [gitRepositoryId, path]);
    } else {
      return getNestedProperty<IGitRefTag>(repoTags, [gitRepositoryId]);
    }
  };

  const onTagsChanged = async (value: ITag[]) => {
    if (!target) return;
    const mappedTags = value.map((t) =>
      typeof t === "string" ? { value: t } : t
    );
    try {
      const body = {
        tags: mappedTags,
        systemTags: [],
        archived: false,
      };
      const editing = getEditingObject(target);
      if (editing) {
        await handleUpdateTag(editing.gitRefTagId, body);
        updateState(target, editing, mappedTags);
      } else {
        const res = await handleCreateTag({ ...body, objectId });
        addState(target, res);
      }
    } catch (error) {
      message.handleError(error);
    }
  };

  const openTagModal = (t) => {
    setTarget(t);
    modalDisclosure.onOpen();
  };

  const targetTags = useMemo(() => {
    if (!target) return [];
    const { gitRepositoryId, path } = target;
    switch (target.type) {
      case GitRefTagType.GIT_FILE:
        return getNestedProperty(tags, [gitRepositoryId, path, "tags"], []);
      case GitRefTagType.GIT_REPOSITORY:
        return getNestedProperty(repoTags, [gitRepositoryId, "tags"], []);
      default:
        return [];
    }
  }, [tags, repoTags, target]);

  useEffect(() => {
    setFileTags({});
    setRepoTags({});

    getRepoTags(projectBranch);
  }, [projectBranch, getRepoTags]);

  return (
    <ProjectTagsContext.Provider
      value={{
        tags,
        repoTags,
        setTarget,
        getFileTags,
        openTagModal,
        onTagsChanged,
      }}
    >
      {children}
      <TagEntityModal
        target={target}
        tags={targetTags}
        disclosure={modalDisclosure}
        onChange={onTagsChanged}
        onClose={() => setTarget(null)}
      />
    </ProjectTagsContext.Provider>
  );
};

export const ProjectTagsContext = createContext<any>(null);

export function useEntitiesTags() {
  const context = useContext(ProjectTagsContext);
  if (context === null) {
    throw new Error("useEntitiesTags must be used within ProjectTagsProvider");
  }
  return context;
}
