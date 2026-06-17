import { Tooltip, Box } from "@chakra-ui/react";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ProjectSourceType } from "shared/models/enums";
import { decodeFilePath, truncateUrlPath } from "shared/utils";

interface RepositoryBreadcrumbItemProps {
  type: string;
  path: string;
  sourceType: ProjectSourceType;
}

const RepositoryBreadcrumbItem = ({ path }: RepositoryBreadcrumbItemProps) => {
  const { state } = useLocation();
  const [, , filePath] = useMemo(() => {
    return decodeFilePath(path);
  }, [path]);

  const fullPath = useMemo(() => {
    if (state?.repositoryOwner && state?.repositoryName) {
      return `${state.repositoryOwner}/${state.repositoryName}/${filePath}`;
    }
    return filePath;
  }, [filePath, state]);

  const truncatedPath = useMemo(
    () => truncateUrlPath(fullPath, 90),
    [truncateUrlPath, fullPath]
  );

  return (
    <Tooltip label={fullPath} isDisabled={fullPath === truncatedPath}>
      <Box as="span">{truncatedPath}</Box>
    </Tooltip>
  );
};

export default RepositoryBreadcrumbItem;
