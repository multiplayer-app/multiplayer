import { useMemo, useRef } from "react";
import { Box } from "@chakra-ui/react";
import { ScrollSyncPane } from "react-scroll-sync";
import { DiffEditor, DiffOnMount } from "@monaco-editor/react";
import { getLanguageByExtension } from "./CodeEditor.helpers";

import "./CodeEditor.scss";

const CodeDiffEditor = (props: CodeDiffEditorProps) => {
  const containerRef = useRef<HTMLDivElement>();

  const language = useMemo(() => {
    return getLanguageByExtension(props.extension);
  }, [props.extension]);

  return (
    <Box
      className="code-wrapper"
      h="full"
      flex="1"
      minW="0"
      minH="0"
      overflow="hidden"
      ref={containerRef}
    >
      <DiffEditor
        height="100%"
        options={{ readOnly: true, renderSideBySide: false }}
        original={props.initialData}
        modified={props.currentData}
        originalLanguage={language}
        modifiedLanguage={language}
        onMount={props.onMount}
      />
    </Box>
  );
};

export interface CodeDiffEditorProps {
  extension?: string;
  initialData: string;
  currentData: string;
  onMount?: DiffOnMount;
}

export default CodeDiffEditor;
