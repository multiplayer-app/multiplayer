import { Stack } from "@chakra-ui/react";
import { IntegrationTypeEnum } from "@multiplayer/types";
import Content from "pages/Workspace/Project/Settings/SettingsLayout/Content";

import IntegrationKeysSection from "./IntegrationKeysSection";

const ApiKeysTab = () => (
  <Content
    title="API keys"
    description="API keys authenticate the Multiplayer CLI when OAuth is not available or not preferred."
    maxW="1100"
  >
    <Stack spacing="0" gap={{ base: "6", md: "8" }}>
      <IntegrationKeysSection type={IntegrationTypeEnum.API_KEY} />
    </Stack>
  </Content>
);

export default ApiKeysTab;
