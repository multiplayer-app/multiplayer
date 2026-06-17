import { Stack } from "@chakra-ui/react";
import { IntegrationTypeEnum } from "@multiplayer/types";
import Content from "pages/Workspace/Project/Settings/SettingsLayout/Content";

import IntegrationKeysSection from "../ApiKeys/IntegrationKeysSection";

const OtelKeysTab = () => (
  <Content
    title="Session Recorder"
    description="Generate an API key to set up Multiplayer Session Recorder to your backend and frontend services. We recommend passing your API key(s) as an environment variable and not storing it in your repository."
  >
    <Stack spacing="0" gap={{ base: "6", md: "8" }}>
      <IntegrationKeysSection type={IntegrationTypeEnum.OTEL} />
    </Stack>
  </Content>
);

export default OtelKeysTab;
