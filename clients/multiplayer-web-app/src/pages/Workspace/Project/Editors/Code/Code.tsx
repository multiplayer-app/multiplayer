import CodeToolbar from "./CodeToolbar";
import CodeEditorPanel from "./CodeEditorPanel";

import { CodeProps } from "shared/models/interfaces";
import GitRefToolbar from "shared/components/GitRefToolbar";
import { SourceProvider } from "shared/providers/SourceContext";
import { ThreadsProvider } from "shared/providers/ThreadsContext";
import {
  FullScreenContentContainer,
  FullScreenProvider,
} from "shared/providers/FullScreenContext";
import { RefetchProvider } from "shared/providers/RefetchContext";

const Code = ({ doc, readonly, provider, initialData }: CodeProps) => {
  return (
    <SourceProvider>
      <RefetchProvider>
        <ThreadsProvider
          branchId={provider.branchId}
          objectId={provider.entityId}
        >
          <FullScreenProvider
            direction="column"
            flex="1"
            minH="0"
            bg="bg.primary"
          >
            <CodeToolbar doc={doc} />
            <GitRefToolbar />
            <FullScreenContentContainer
              flex="1"
              minH="0"
              overflow="auto"
              position="relative"
            >
              <CodeEditorPanel
                doc={doc}
                readonly={readonly}
                provider={provider}
                initialData={initialData}
              />
            </FullScreenContentContainer>
          </FullScreenProvider>
        </ThreadsProvider>
      </RefetchProvider>
    </SourceProvider>
  );
};

export default Code;
