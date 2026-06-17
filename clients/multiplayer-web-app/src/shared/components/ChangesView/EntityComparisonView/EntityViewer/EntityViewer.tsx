import { Text } from "@chakra-ui/react";

import { EntityType } from "@multiplayer/types";

import LazyContent, { lazyModule } from "shared/components/LazyContent";
import PageLoading from "shared/components/PageLoading";

import { Endpoint, EntityStateStatus } from "shared/models/enums";
import { EntityState } from "shared/models/interfaces";

// const SketchEditor = lazyModule(
//   () => import("shared/components/Editors/SketchEditor")
// );
const ExcalidrawEditor = lazyModule(
  () => import("shared/components/Editors/ExcalidrawEditor")
);
const DocumentEditor = lazyModule(
  () => import("shared/components/Editors/DocumentEditor")
);
const CodeDiffEditor = lazyModule(
  () => import("shared/components/Editors/CodeEditor/CodeDiffEditor")
);

const BaseDiffView = lazyModule(() => import("./DiffViews/BaseDiffView"));

interface EntityViewerProps {
  state: EntityState;
  endpoint: Endpoint;
  entityId: string;
  entityName: string;
  entityType: EntityType;
}

const EntityViewer = ({
  state,
  endpoint,
  entityId,
  entityType,
}: EntityViewerProps) => {
  if (
    state.status === EntityStateStatus.WAITING ||
    state.status === EntityStateStatus.FETCHING
  ) {
    return <PageLoading />;
  }

  if (!state[endpoint]?.content) {
    return (
      <Text color="red.500" textAlign="center" m="auto">
        Unable to fetch entity content!
      </Text>
    );
  }

  switch (entityType) {
    case EntityType.PLATFORM:
    case EntityType.ENVIRONMENT:
    case EntityType.PLATFORM_COMPONENT:
      return (
        <LazyContent
          element={
            <BaseDiffView
              endpoint={endpoint}
              entityId={entityId}
              conflicts={state.conflicts}
              groups={state.changesForPreview.groups}
              changes={state.changesForPreview[endpoint]}
            />
          }
        />
      );
    case EntityType.NOTEBOOK:
      return (
        <LazyContent
          element={
            <DocumentEditor
              readonly={true}
              initialData={state[endpoint].content}
            />
          }
        />
      );
    case EntityType.EXCALIDRAW:
      return (
        <LazyContent
          element={
            <ExcalidrawEditor
              readonly={true}
              commentMode={false}
              data={state[endpoint].content}
            />
          }
        />
      );
    case EntityType.FILE:
    case EntityType.API:
      return (
        <LazyContent
          element={
            <CodeDiffEditor
              initialData={state.initialContent.contents || ""}
              currentData={state[endpoint].content.contents || ""}
              extension={state[endpoint].content.extension || ""}
            />
          }
        />
      );

    default:
      return (
        <Text color="muted" textAlign="center" m="auto">
          Unsupported Entity Type
        </Text>
      );
  }
};

export default EntityViewer;
