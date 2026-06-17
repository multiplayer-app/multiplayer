import { Stack } from "@chakra-ui/react";
import Content from "pages/Workspace/Project/Settings/SettingsLayout/Content";

import AccessSection from "./AccessSection";
import PublicAccessSection from "./PublicAccessSection";
import { useProjectSettings } from "../ProjectSettingsContext";

const AccessTab = () => {
  const { workspaceId, projectId, project, onUpdate } = useProjectSettings();

  return (
    <Content title="Access">
      <Stack spacing="0" gap={{ base: "5", md: "6" }}>
        <AccessSection
          workspaceId={workspaceId}
          projectId={projectId}
          project={project}
          onUpdate={onUpdate}
        />
        <PublicAccessSection
          workspaceId={workspaceId}
          projectId={projectId}
          project={project}
          onUpdate={onUpdate}
        />
      </Stack>
    </Content>
  );
};

export default AccessTab;
