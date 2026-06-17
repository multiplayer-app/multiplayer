import { useMemo } from "react";
import { Route, Routes, Navigate, useParams } from "react-router-dom";
import { Button, Flex, Text } from "@chakra-ui/react";

import LazyContent, { lazyModule } from "shared/components/LazyContent";
import CategoryIcon from "shared/components/CategoryIcon";
import { projectSourceTypeMap } from "shared/configs/project";

import { EntityCategories, ProjectSourceType } from "shared/models/enums";

import Layout from "./Layout";

import { DEFAULT_PROJECT_SOURCE_TAB } from "shared/navigation/defaultProjectPath";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import Issues from "./Issues";
import Users from "./Users";
import { FeatureFlag } from "@multiplayer/types";
import CheckFeature from "shared/components/CheckFeature";
import { useSharedGeneralModals } from "shared/providers/GeneralModalsContext";

// const Root = lazyModule(() => import("./Root"));
const Flows = lazyModule(() => import("./Flows"));
const Agents = lazyModule(() => import("./Agents"));
const Debugger = lazyModule(() => import("./Debugger"));
const SystemCatalog = lazyModule(() => import("./SystemCatalog"));
const FilePreview = lazyModule(() => import("./Editors/FilePreview"));
const EntityDashboard = lazyModule(() => import("./EntityDashboard"));
const ProjectSettings = lazyModule(() => import("./Settings"));

interface FeatureAccessFallbackProps {
  sourceType: ProjectSourceType;
}

const ProjectRoutes = () => {
  const params = useParams();
  const isSettingsRoute = params["*"]?.startsWith(ProjectSourceType.SETTINGS);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DefaultRoute />} />
        {isSettingsRoute ? (
          <Route
            path={`${ProjectSourceType.SETTINGS}/*`}
            element={<LazyContent element={<ProjectSettings />} />}
          />
        ) : (
          <Route path={":sourceType/:type?/:path?"} element={<SourceRoute />} />
        )}
      </Route>
    </Routes>
  );
};

const SourceRoute = () => {
  const { sourceType } = useParams();
  const sourceContent = useMemo(() => {
    switch (sourceType) {
      case ProjectSourceType.ENTITY:
        return <LazyContent element={<EntityDashboard />} />;
      case ProjectSourceType.FLOWS:
        return (
          <CheckFeature
            feature={FeatureFlag.FLOWS}
            fallbackElement={
              <FeatureAccessFallback sourceType={ProjectSourceType.FLOWS} />
            }
          >
            <LazyContent element={<Flows />} />
          </CheckFeature>
        );
      case ProjectSourceType.ISSUES:
        return <LazyContent element={<Issues />} />;
      case ProjectSourceType.END_USERS:
        return (
          <CheckFeature
            feature={FeatureFlag.END_USERS}
            fallbackElement={
              <FeatureAccessFallback sourceType={ProjectSourceType.END_USERS} />
            }
          >
            <LazyContent element={<Users />} />
          </CheckFeature>
        );
      case ProjectSourceType.DEBUGGER:
        return <LazyContent element={<Debugger />} />;
      case ProjectSourceType.AGENTS:
        return <LazyContent element={<Agents />} />;
      case ProjectSourceType.FILE:
      case ProjectSourceType.REPOSITORY:
        return <LazyContent element={<FilePreview />} />;
      case ProjectSourceType.RADAR:
        return <LazyContent element={<SystemCatalog />} />;
      default:
        return <DefaultRoute />;
    }
  }, [sourceType]);

  return (
    <Routes>
      <Route index element={sourceContent} />
      <Route path=":type/:path?" element={sourceContent} />
      <Route path="*" element={<DefaultRoute />} />
    </Routes>
  );
};

const DefaultRoute = () => {
  const { isPublic } = useWorkspace();
  const { workspaceId, projectId, branchId } = useParams();

  return (
    <Navigate
      replace
      to={`${
        isPublic ? "/public" : ""
      }/project/${workspaceId}/${projectId}/${branchId}/${DEFAULT_PROJECT_SOURCE_TAB}`}
    />
  );
};

const FeatureAccessFallback = ({ sourceType }: FeatureAccessFallbackProps) => {
  const { openContactModal } = useSharedGeneralModals();
  const iconName =
    sourceType === ProjectSourceType.REPOSITORY
      ? EntityCategories.REPOSITORY
      : projectSourceTypeMap[sourceType] || sourceType;

  return (
    <Flex
      flex="1"
      minH="0"
      px="8"
      py="10"
      gap="3"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      textAlign="center"
    >
      <CategoryIcon boxSize="14" name={iconName} />
      <Text fontSize="lg" fontWeight="semibold">
        Access required
      </Text>
      <Text color="muted" maxW="560px">
        You do not have access to this feature. To request access, contact
        support.
      </Text>
      <Button onClick={openContactModal}>Contact support</Button>
    </Flex>
  );
};

export default ProjectRoutes;
