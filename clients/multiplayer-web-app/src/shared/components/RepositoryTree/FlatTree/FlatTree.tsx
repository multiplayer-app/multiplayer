import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
} from "react";
import { useParams } from "react-router-dom";
import { Box, Checkbox, Flex, Icon, Text } from "@chakra-ui/react";
import { GitRefTagType, ProjectLinkObjectType } from "@multiplayer/types";

import { ChevronDownIcon } from "shared/icons";
import { GitObjectType, ProjectSourceType } from "shared/models/enums";
import PageLoading from "shared/components/PageLoading";
import { sourceIconMap } from "shared/configs/git.configs";
import NextPageTrigger from "shared/components/NextPageTrigger";
import { getRepositoryThree } from "shared/services/git.service";
import RepoMetadata from "../RepoMetadata";
import { decodeFilePath } from "shared/utils";

const sortedTreeFiles = (data) => {
  return data.sort((a, b) => {
    if (a.type === "directory" && b.type === "file") {
      return -1;
    } else if (a.type === "file" && b.type === "directory") {
      return 1;
    } else {
      return 0;
    }
  });
};

const FlatTree = ({
  depth = 0,
  path = "/",
  gitRepository,
  projectId,
  repositoryId,
  gitDefaultBranch,
  enabledObjectType,
  hasCheckbox,
  onFileClick,
  refetchIndex,
  showRepoMetadata,
  addedLinks,
  isDarkTheme = true,
}) => {
  const [loading, setLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [params, setParams] = useState({
    page: 1,
    perPage: 40,
    ref: gitDefaultBranch,
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getRepositoryThree(
          projectId,
          repositoryId,
          path,
          params
        );
        setHasNextPage(res.data.length === params.perPage);
        if (params.page !== 1 || params.perPage !== 40) {
          setItems((prev) => [...prev, ...sortedTreeFiles(res.data)]);
        } else {
          // prevent data duplication if pagination is not changed
          setItems(sortedTreeFiles(res.data));
        }
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    };

    fetchData();
  }, [projectId, repositoryId, path, params, refetchIndex]);

  useEffect(() => {
    setParams((prev) => ({ ...prev, ref: gitDefaultBranch }));
  }, [gitDefaultBranch]);

  // TODO: Not tested yet. API Endpoint Pagination not working properly
  const onIntersect = useCallback(() => {
    setParams((prev) => ({ ...prev, page: prev.page + 1 }));
  }, []);

  return (
    <>
      {!loading &&
        items.map((item) => (
          <ListItem
            item={item}
            depth={depth}
            key={item.path}
            projectId={projectId}
            repositoryId={repositoryId}
            gitRepository={gitRepository}
            refetchIndex={refetchIndex}
            gitDefaultBranch={gitDefaultBranch}
            addedLinks={addedLinks}
            enabledObjectType={enabledObjectType}
            hasCheckbox={hasCheckbox}
            onFileClick={onFileClick}
            showRepoMetadata={showRepoMetadata}
            isDarkTheme={isDarkTheme}
          />
        ))}
      {loading ? (
        <Box
          h="40px"
          borderTop="1px"
          position="relative"
          borderColor="border.primary"
        >
          <PageLoading />
        </Box>
      ) : hasNextPage ? (
        <NextPageTrigger onIntersect={onIntersect} />
      ) : null}
    </>
  );
};

const ListItem = ({
  item,
  depth,
  projectId,
  repositoryId,
  gitDefaultBranch,
  enabledObjectType,
  gitRepository,
  refetchIndex,
  hasCheckbox,
  addedLinks,
  onFileClick,
  showRepoMetadata,
  isDarkTheme = true,
}) => {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isCurrentOpenedFile, setIsCurrentOpenedFile] = useState(false);
  const { path, sourceType, type } = useParams();
  const listItemRef = useRef<HTMLDivElement>();

  useLayoutEffect(() => {
    if (isCurrentOpenedFile && listItemRef?.current) {
      listItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }, [isCurrentOpenedFile, listItemRef]);

  const itemData = useMemo(() => {
    const { id, owner, type, name } = gitRepository;

    return {
      path: item.path,
      name: item.name,
      sourceType: item.type,
      type: GitRefTagType.GIT_FILE,
      objectType: ProjectLinkObjectType.GitFile,
      repositoryId,
      gitDefaultBranch,
      gitRepositoryId: id,
      gitRepositoryType: type,
      gitRepositoryOwner: owner,
      gitRepositoryName: name,
    };
  }, [item, repositoryId, gitRepository, gitDefaultBranch]);
  const isDir = item.type === GitObjectType.DIRECTORY;

  useEffect(() => {
    if (sourceType !== ProjectSourceType.FILE) {
      return;
    }

    const [repository, branch, filePath] = decodeFilePath(path);

    const isSamePath =
      type === gitRepository.type &&
      repository === repositoryId &&
      branch === gitDefaultBranch &&
      filePath.startsWith(item.path);

    if (isDir) {
      setExpanded(isSamePath);
    } else {
      setIsCurrentOpenedFile(item.path === filePath);
    }
  }, [path, sourceType, type, item]);

  const isAlreadyAdded = addedLinks?.find(({ sourceGitRef, sourceObject }) => {
    if (sourceGitRef) {
      return (
        sourceGitRef?.repositoryId === gitRepository?.id &&
        sourceGitRef?.repositoryName === gitRepository?.name &&
        sourceGitRef?.path === item.name
      );
    }

    const { gitRef } = sourceObject;
    return (
      gitRef?.repositoryId === gitRepository?.id &&
      gitRef?.repositoryName === gitRepository?.name &&
      gitRef?.path?.includes(item.name)
    );
  });

  return (
    <>
      <Flex
        ref={listItemRef}
        px="4"
        gap="2"
        h="40px"
        borderTop="1px"
        userSelect="none"
        cursor="pointer"
        alignItems="center"
        borderColor="border.primary"
        borderLeft={
          isCurrentOpenedFile
            ? "3px solid var(--chakra-colors-brand-500)"
            : "3px solid transparent"
        }
        background={isCurrentOpenedFile ? "bg.subtle" : "bg.primary"}
        onClick={() =>
          isDir
            ? setExpanded((prev) => !prev)
            : onFileClick &&
              onFileClick({
                ...item,
                gitRepositoryOwner: gitRepository.owner,
                gitRepositoryName: gitRepository.name,
              })
        }
        _hover={{
          backgroundColor: isCurrentOpenedFile ? "bg.subtle" : "bg.surface",
        }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <Flex
          h="5"
          gap="1"
          alignItems="center"
          ml={depth * 8 + "px"}
          w={hasCheckbox ? "10" : "5"}
        >
          {hasCheckbox && (
            <Box onClick={(e) => e.stopPropagation()}>
              <Checkbox
                display="flex"
                value={JSON.stringify(itemData)} // TODO change
                isDisabled={
                  (enabledObjectType && !enabledObjectType.has(item.type)) ||
                  isAlreadyAdded
                }
              />
            </Box>
          )}
          {isDir && (
            <Icon
              cursor="pointer"
              color="muted"
              transform={expanded ? "rotate(0)" : "rotate(-90deg)"}
              as={ChevronDownIcon}
            />
          )}
        </Flex>
        <Icon as={sourceIconMap[item.type]} />
        <Text flex="1" noOfLines={1}>
          {item.name}
        </Text>
        {showRepoMetadata && (
          <RepoMetadata
            item={itemData}
            isShown={hovered}
            updateShownState={setHovered}
          />
        )}
      </Flex>
      {item.type === "directory" && expanded && (
        <FlatTree
          path={item.path}
          depth={depth + 1}
          projectId={projectId}
          repositoryId={repositoryId}
          gitRepository={gitRepository}
          enabledObjectType={enabledObjectType}
          refetchIndex={refetchIndex}
          gitDefaultBranch={gitDefaultBranch}
          addedLinks={addedLinks}
          hasCheckbox={hasCheckbox}
          onFileClick={onFileClick}
          showRepoMetadata={showRepoMetadata}
        />
      )}
    </>
  );
};

export default FlatTree;
