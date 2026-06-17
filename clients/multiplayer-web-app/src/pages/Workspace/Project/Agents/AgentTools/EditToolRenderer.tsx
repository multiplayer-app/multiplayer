import { useEffect, useRef } from "react";
import {
  Box,
  ToolCard,
  lineCount,
  DiffEditor,
  useColorMode,
  editorHeight,
  filenameFromPath,
  diffEditorOptions,
  extensionFromPath,
  getLanguageByExtension,
} from "./common";
import type { ToolRendererComponent } from "./common";

export const EditToolRenderer: ToolRendererComponent = ({ call }) => {
  const filePath = (call.input?.file_path as string) ?? "";
  const oldString = (call.input?.old_string as string) ?? "";
  const newString = (call.input?.new_string as string) ?? "";

  return (
    <ToolCard
      hasBody
      collapsible
      status={call.status}
      kindLabel="Edit"
      name={filePath}
      nameProcessor={filenameFromPath}
    >
      <MonacoDiffEditor
        oldString={oldString}
        newString={newString}
        filePath={filePath}
      />
    </ToolCard>
  );
};
const MonacoDiffEditor = ({
  oldString,
  newString,
  filePath,
}: {
  oldString: string;
  newString: string;
  filePath: string;
}) => {
  const { colorMode } = useColorMode();
  const editorRef = useRef<any>(null);

  const language = getLanguageByExtension(extensionFromPath(filePath));

  const monacoTheme = colorMode === "dark" ? "vs-dark" : "light";

  const longerSide =
    lineCount(oldString) >= lineCount(newString) ? oldString : newString;
  const height = editorHeight(longerSide);

  useEffect(() => {
    return () => {
      editorRef.current?.setModel(null);
      editorRef.current?.dispose();
    };
  }, []);

  return (
    <Box h={`${height}px`}>
      <DiffEditor
        height="100%"
        language={language}
        original={oldString}
        keepCurrentOriginalModel={true}
        keepCurrentModifiedModel={true}
        modified={newString}
        options={diffEditorOptions}
        theme={monacoTheme}
      />
    </Box>
  );
};
