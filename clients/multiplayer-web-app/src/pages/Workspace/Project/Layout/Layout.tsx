import { Link, Outlet } from "react-router-dom";
import { Button, Flex } from "@chakra-ui/react";

import ContentLayout from "./ContentLayout";
import PageLoading from "shared/components/PageLoading";
import ErrorBoundary from "shared/components/ErrorBoundary";
import { useWorkspace } from "shared/providers/WorkspaceContext";

import Header from "./Header";
import ResourceUnavailable from "pages/Workspace/Redirects/ResourceUnavailable";
import ProjectProviders from "../ProjectProviders";
import { Suspense } from "react";

const Layout = () => {
  const { workspace, isPublic } = useWorkspace();

  if (workspace.fetching) return <PageLoading />;
  if (workspace.fetched && !isPublic && !workspace.data) {
    return (
      <ResourceUnavailable
        resource="workspace"
        title="Workspace unavailable"
        description="This workspace was not found, or you do not have access to it."
      />
    );
  }

  return (
    <ProjectProviders>
      <ErrorBoundary
        ctaElement={
          <Button as={Link} to="/" replace={true}>
            Go to home
          </Button>
        }
      >
        <Flex flex="1" flexDir="column" minH="0" minW="0">
          <Header />
          <ContentLayout>
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
          </ContentLayout>
        </Flex>
      </ErrorBoundary>
    </ProjectProviders>
  );
};

export default Layout;
