import { Box, Flex, Icon, Image, Text, Tooltip } from "@chakra-ui/react";
import { useLocation, useParams } from "react-router-dom";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { SearchCircleIcon, ClipboardCopyIcon, BranchIcon } from "shared/icons";
import CodeEditor, {
  CodeEditorRef,
} from "shared/components/Editors/CodeEditor";
import PageLoading from "shared/components/PageLoading";
import useMessage from "shared/hooks/useMessage";
import { getFileContents } from "shared/services/git.service";
import { decodeFilePath, truncateUrlPath } from "shared/utils";
import Toolbar, { ToolbarButton } from "shared/components/Toolbar";
import { GitSourceType } from "shared/models/enums";
import { IFileContentRes } from "shared/models/interfaces";
import { FullScreenProvider } from "shared/providers/FullScreenContext";
import FullScreenToggleButton from "shared/components/FullScreenToggleButton";

const FilePreview = () => {
  const { path, projectId } = useParams();
  const { state } = useLocation();
  const message = useMessage();
  const editorRef = useRef<CodeEditorRef>();
  const [data, setData] = useState<IFileContentRes>(null);
  const [loading, setLoading] = useState(true);
  const [repositoryId, branch, filePath] = useMemo(() => {
    return decodeFilePath(path);
  }, [path]);

  const fullPath = useMemo(() => {
    if (state?.repositoryOwner && state?.repositoryName) {
      return `${state.repositoryOwner}/${state.repositoryName}/${filePath}`;
    }
    return filePath;
  }, [filePath, state]);

  const truncatedPath = useMemo(
    () => truncateUrlPath(fullPath, 300),
    [truncateUrlPath, fullPath]
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getFileContents(
          projectId,
          repositoryId,
          filePath,
          branch
        );
        setData(res);
      } catch (error) {
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, filePath, repositoryId, branch]);

  const onCopyPath = (e) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(fullPath);
      message.success("Path successfully copied!");
    } catch (error) {
      message.handleError({ message: "Something went wrong!" });
    }
  };

  return (
    <FullScreenProvider h="full" direction="column">
      <Toolbar
        leftContent={
          branch && (
            <Flex
              alignItems="center"
              gap="2"
              onClick={(e) => e.stopPropagation()}
            >
              <Icon boxSize="4" as={BranchIcon} />
              <Text color="muted">{branch}</Text>
            </Flex>
          )
        }
        rightContent={
          <>
            <FullScreenToggleButton />
            <ToolbarButton
              icon={<SearchCircleIcon />}
              onClick={() => editorRef.current.find()}
              label="Search"
            />
          </>
        }
      />
      <Flex
        direction="column"
        flex="1"
        minH="0"
        overflow="auto"
        position="relative"
      >
        {loading ? (
          <PageLoading />
        ) : (
          data && (
            <>
              {truncatedPath && (
                <Flex
                  py={2}
                  px={4}
                  gap="2"
                  alignItems="center"
                  borderBottom="1px solid #0000000F"
                >
                  <Tooltip
                    label={fullPath}
                    isDisabled={fullPath === truncatedPath}
                    placement="top"
                  >
                    <Text
                      whiteSpace="nowrap"
                      color="muted"
                      fontWeight="500"
                      fontSize="xs"
                    >
                      {truncatedPath}
                    </Text>
                  </Tooltip>
                  <Tooltip label="Copy path">
                    <Icon
                      cursor="pointer"
                      boxSize="4"
                      onClick={onCopyPath}
                      as={ClipboardCopyIcon}
                    />
                  </Tooltip>
                </Flex>
              )}
              <FilePreviewComponent
                contents={data.contents}
                extension={data.extension}
                sourceType={data.sourceType}
                ref={editorRef}
              />
            </>
          )
        )}
      </Flex>
    </FullScreenProvider>
  );
};

const FilePreviewComponent = forwardRef((props: IFileContentRes, ref) => {
  switch (props.sourceType) {
    case GitSourceType.CODE:
      return (
        <CodeEditor
          readonly
          ref={ref}
          extension={props.extension}
          initialData={props.contents}
        />
      );

    case GitSourceType.IMAGE:
      return (
        <Flex w="full" h="full">
          <Image
            m="auto"
            maxW="90%"
            maxH="90%"
            display="block"
            src={props.contents}
          />
        </Flex>
      );
    case GitSourceType.VIDEO:
      return (
        <Flex w="full" h="full">
          <Box
            m="auto"
            as="video"
            maxW="90%"
            maxH="90%"
            display="block"
            src={props.contents}
          />
        </Flex>
      );
    default:
      return null;
  }
});

export default FilePreview;
