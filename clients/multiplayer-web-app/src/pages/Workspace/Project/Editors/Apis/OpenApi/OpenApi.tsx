import { Flex } from "@chakra-ui/react";

import Details from "./Details";
import Explorer from "./Explorer";
import { IEditorProps } from "shared/models/interfaces";
import { OpenApiProvider } from "shared/providers/OpenApiContext";

interface OpenApiProps extends IEditorProps {
  isSplitView?: boolean;
}

const OpenApi = ({ readonly, isSplitView }: OpenApiProps) => {
  return (
    <OpenApiProvider>
      <Flex flex="1" minH="0">
        <Explorer readonly={readonly} isSplitView={isSplitView} />
        <Details isSplitView={isSplitView} />
      </Flex>
    </OpenApiProvider>
  );
};

export default OpenApi;
