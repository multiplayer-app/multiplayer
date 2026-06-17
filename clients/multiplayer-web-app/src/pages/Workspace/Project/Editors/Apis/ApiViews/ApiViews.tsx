import { ApiType } from "@multiplayer/types";
import { useRef, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import CodeEditor, {
  CodeEditorType,
} from "shared/components/Editors/CodeEditor";
import { useApis } from "shared/providers/ApisContext";
import PageLoading from "shared/components/PageLoading";
import SplitLayoutHorizontal from "shared/components/SplitLayoutHorizontal";

import OpenApi from "../OpenApi";
import { ViewModes } from "../Apis.types";
import {
  scrollToLine,
  setupSchemaValidator,
} from "shared/helpers/openApi.helpers";
import { Flex } from "@chakra-ui/react";
import { CodeEditorProps } from "shared/components/Editors/CodeEditor/CodeEditor";
import CodeDiffEditor from "shared/components/Editors/CodeEditor/CodeDiffEditor";
import { SystemViewTypes } from "shared/models/enums";

const initialWidth = ["66%", "34%"];

const ApiViews = () => {
  const {
    doc,
    version,
    viewMode,
    provider,
    readonly,
    extension,
    initialData,
    apiProvider,
    currentView,
  } = useApis();

  const [params] = useSearchParams();
  const editorRef = useRef<CodeEditorType>();
  const targetObject = useMemo(
    () => params.get("method") || params.get("schema"),
    [params]
  );
  const isDiffView = currentView === SystemViewTypes.DIFFS;

  useEffect(() => {
    if (editorRef.current && targetObject) {
      scrollToLine(editorRef.current, targetObject, extension);
    }
  }, [targetObject, extension]);

  const onEditorMount = (editor: CodeEditorType, monaco: any) => {
    editorRef.current = editor;
    if (targetObject) {
      scrollToLine(editor, targetObject, extension);
      setupSchemaValidator(monaco, extension, version);
    }
  };

  const renderOpenApi = () => {
    const isSplitView = viewMode === ViewModes.SPLIT;
    const isDesigner = viewMode === ViewModes.DESIGNER;
    const isSourceView = viewMode === ViewModes.SOURCE;

    return (
      <SplitLayoutHorizontal initialWidth={isSplitView ? initialWidth : []}>
        {isDesigner || isSplitView ? (
          <OpenApi
            readonly={readonly}
            initialData={initialData}
            isSplitView={isSplitView}
          />
        ) : null}
        {isSourceView || isSplitView ? (
          <ApiCodeEditor
            doc={doc}
            provider={provider}
            readonly={readonly}
            extension={extension}
            isDiffView={isDiffView}
            options={{ minimap: { enabled: isSourceView } }}
            onMount={onEditorMount}
          />
        ) : null}
      </SplitLayoutHorizontal>
    );
  };

  if (!viewMode) return <PageLoading />;

  switch (apiProvider) {
    case ApiType.OPENAPI:
      return renderOpenApi();
    default:
      return (
        <Flex direction="column" flex="1" minW="0">
          <ApiCodeEditor
            doc={doc}
            provider={provider}
            readonly={readonly}
            extension={extension}
            isDiffView={isDiffView}
            onMount={onEditorMount}
          />
        </Flex>
      );
  }
};

interface ApiCodeEditorProps extends CodeEditorProps {
  isDiffView: boolean;
}

const ApiCodeEditor = ({ isDiffView, ...rest }: ApiCodeEditorProps) => {
  const { baseCommitContent, doc } = useApis();
  if (!isDiffView) return <CodeEditor {...rest} />;

  const initialData = baseCommitContent ? baseCommitContent.contents : "";
  const currentData = doc.getText("text").toJSON();

  return (
    <CodeDiffEditor
      extension={rest.extension}
      initialData={initialData}
      currentData={currentData}
    />
  );
};

export default ApiViews;
