import { forwardRef } from "react";
import { EntityType } from "@multiplayer/types";
import { OpenAPIV3_1 } from "openapi-types";
import { useDisclosure } from "@chakra-ui/react";

import { IEditorProps } from "shared/models/interfaces";
import { ApisProvider, useApis } from "shared/providers/ApisContext";
import GitRefToolbar from "shared/components/GitRefToolbar";
import { useYDoc } from "shared/hooks/useYDoc";
import {
  FullScreenContentContainer,
  FullScreenProvider,
} from "shared/providers/FullScreenContext";
import ApiPropertiesDrawer from "pages/Workspace/Project/Editors/Apis/ApiPropertiesDrawer";
import EntityThreadsDrawer from "shared/components/EntityThreadsDrawer";
import ApiViews from "./ApiViews";
import ApiToolbar from "./ApiToolbar";
import ApiViewsDrawer from "./ApiViewsDrawer";
import { ThreadsProvider } from "shared/providers/ThreadsContext";
import { useVersion } from "shared/providers/VersionContext";
import { RefetchProvider } from "shared/providers/RefetchContext";

interface IApisProps extends IEditorProps {
  radarData?: OpenAPIV3_1.Document | null;
  onSelectionChange?: (payload: any) => void;
}

const Apis = forwardRef(
  (
    {
      doc: yDoc,
      clients,
      provider,
      readonly,
      radarData,
      initialData,
      onSelectionChange,
    }: IApisProps,
    ref
  ) => {
    const doc = useYDoc(EntityType.API, yDoc, initialData);
    const entityThreadsDisclosure = useDisclosure();
    const { currentBranchId } = useVersion();

    return (
      <ApisProvider
        doc={doc}
        ref={ref}
        clients={clients}
        readonly={readonly}
        provider={provider}
        radarData={radarData}
        initialData={initialData}
        onSelectionChange={onSelectionChange}
      >
        <FullScreenProvider direction="column" flex="1" minH="0">
          <RefetchProvider>
            <ThreadsProvider
              branchId={currentBranchId}
              objectId={provider.entityId}
            >
              <ApiToolbar entityThreadsDisclosure={entityThreadsDisclosure} />
              <GitRefToolbar />
              <FullScreenContentContainer
                flex="1"
                minH="0"
                minW="0"
                overflowX="auto"
              >
                <ApiViewsDrawer />
                <ApiViews />
                <ApiProperties />
                {entityThreadsDisclosure.isOpen && (
                  <EntityThreadsDrawer
                    onClose={entityThreadsDisclosure.onClose}
                    entityType={EntityType.API}
                  />
                )}
              </FullScreenContentContainer>
            </ThreadsProvider>
          </RefetchProvider>
        </FullScreenProvider>
      </ApisProvider>
    );
  }
);

const ApiProperties = ({}) => {
  const { apiPropertiesDrawerDisclosure } = useApis();
  return apiPropertiesDrawerDisclosure.isOpen ? <ApiPropertiesDrawer /> : null;
};

export default Apis;
