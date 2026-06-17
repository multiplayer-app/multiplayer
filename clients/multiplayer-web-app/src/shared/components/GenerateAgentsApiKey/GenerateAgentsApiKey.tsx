import { BoxProps } from "@chakra-ui/react";
import { IntegrationTypeEnum } from "@multiplayer/types";
import GenerateIntegrationKey from "shared/components/GenerateIntegrationKey";

const GenerateAgentsApiKey = ({
  searchable = true,
  allowMultiple = true,
  defaultKey = "agents-cli-key",
  props = {},
}: {
  searchable?: boolean;
  allowMultiple?: boolean;
  defaultKey?: string;
  props?: BoxProps;
}) => (
  <GenerateIntegrationKey
    props={props}
    searchable={searchable}
    defaultKey={defaultKey}
    allowMultiple={allowMultiple}
    integrationType={IntegrationTypeEnum.API_KEY}
  />
);

export default GenerateAgentsApiKey;
