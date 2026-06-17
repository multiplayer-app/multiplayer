import {
  Text,
  Box,
  Badge,
  Flex,
  Stack,
  Divider,
  Spinner,
  Collapse,
  useColorMode,
  Code,
  Tooltip,
  Link,
} from "@chakra-ui/react";
import {
  EditIcon,
  TimeIcon,
  WarningIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";
import Editor, { DiffEditor } from "@monaco-editor/react";
import { type ToolRendererProps } from "@multiplayer-app/ai-agent-react";
import { getLanguageByExtension } from "shared/components/Editors/CodeEditor/CodeEditor.helpers";
import CopyToClipboard from "shared/components/CopyToClipboard";
import { Copy } from "lucide-react";
export { ToolCard, type ToolCardProps } from "./ToolCard";

export type ToolRendererComponent = (
  props: ToolRendererProps
) => JSX.Element | null;

export const extensionFromPath = (filePath: string): string => {
  const dot = filePath.lastIndexOf(".");
  return dot > -1 ? filePath.slice(dot + 1) : "";
};

export const lineCount = (text: string): number =>
  text ? text.split("\n").length : 1;

export const MAX_EDITOR_HEIGHT = 250;
export const editorHeight = (
  text: string,
  max = MAX_EDITOR_HEIGHT,
  lineH = 18
): number => Math.min(Math.max(lineCount(text) * lineH + 16, 60), max);

export const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "succeeded":
      return <CheckCircleIcon boxSize={3} color="m.green" />;
    case "running":
      return <Spinner size="xs" color="m.blue" speed="0.8s" />;
    case "pending":
      return <TimeIcon boxSize={3} color="neutral" />;
    case "failed":
      return <WarningIcon boxSize={3} color="m.red" />;
    default:
      return null;
  }
};

export const filenameFromPath = (p: string): string => {
  const slash = p.lastIndexOf("/");
  return slash > -1 ? p.slice(slash + 1) : p;
};

export const dirFromPath = (p: string): string => {
  const slash = p.lastIndexOf("/");
  return slash > -1 ? p.slice(0, slash + 1) : "";
};

export const editorOptions: any = {
  readOnly: true,
  domReadOnly: true,
  minimap: { enabled: false },
  lineNumbers: "on",
  scrollBeyondLastLine: false,
  folding: false,
  fontSize: 12,
  automaticLayout: true,
  renderLineHighlight: "none",
  overviewRulerLanes: 0,
  scrollbar: {
    vertical: "auto",
    horizontal: "auto",
    alwaysConsumeMouseWheel: false,
  },
};

export const stripReadOutput = (text: string): string =>
  text
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "")
    .replace(/^[ \t]*\d+→/gm, "")
    .trimEnd();

export const diffEditorOptions: any = {
  readOnly: true,
  domReadOnly: true,
  minimap: { enabled: false },
  lineNumbers: "on",
  scrollBeyondLastLine: false,
  folding: false,
  fontSize: 12,
  automaticLayout: true,
  renderLineHighlight: "none",
  overviewRulerLanes: 0,
  renderOverviewRuler: false,
  renderSideBySide: true,
  scrollbar: {
    vertical: "auto",
    horizontal: "auto",
    alwaysConsumeMouseWheel: false,
  },
};

export {
  Box,
  Badge,
  Collapse,
  Copy,
  CopyToClipboard,
  DiffEditor,
  Divider,
  Editor,
  EditIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Flex,
  Spinner,
  Stack,
  Text,
  Tooltip,
  Link,
  Code,
  useColorMode,
  getLanguageByExtension,
};
