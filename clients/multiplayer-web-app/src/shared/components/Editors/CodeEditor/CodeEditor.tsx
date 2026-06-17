import {
  useRef,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useEffect,
} from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  CloseButton,
  useColorMode,
} from "@chakra-ui/react";
import { editor } from "monaco-editor";

import Editor from "@monaco-editor/react";
import { IEditorProps } from "shared/models/interfaces";
import {
  getEditorHandlers,
  getLanguageByExtension,
  updateRemoteSelectionStyles,
} from "./CodeEditor.helpers";

import "./CodeEditor.scss";
import { MonacoBinding } from "integrations/YMonaco";
import WrapResizeObserver from "integrations/ResizeObserver";

// Temporary fix ResizeObserver loop error
WrapResizeObserver();

const CodeEditor = forwardRef((props: CodeEditorProps, ref) => {
  const monacoRef = useRef<any>();
  const { colorMode } = useColorMode();
  const bindingRef = useRef<MonacoBinding>();
  const editorRef = useRef<editor.IStandaloneCodeEditor>();
  const [isMounted, setIsMounted] = useState(false);
  const [showFileEditErrorAlert, setShowFileEditErrorAlert] = useState(false);

  const loadData = useCallback(() => {
    const { doc, provider } = props;
    if (doc) {
      if (bindingRef.current) {
        bindingRef.current.destroy();
      }

      bindingRef.current = new MonacoBinding(
        doc.getText("text"),
        editorRef.current?.getModel(),
        new Set([editorRef.current]),
        provider?.awareness
      );

      provider?.awareness.on("update", () =>
        updateRemoteSelectionStyles(provider.awareness)
      );

      if (props.readonly && typeof props.readonly === "string") {
        editorRef.current?.onDidAttemptReadOnlyEdit(() => {
          setShowFileEditErrorAlert(true);
        });
      }
    }
  }, [props.doc, props.provider]);

  useEffect(() => {
    if (isMounted) {
      loadData();
    }
  }, [isMounted, loadData]);

  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: any
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsMounted(true);
    props.onMount && props.onMount(editor, monaco);
  };

  const handleEditorChange = (value) => {
    props.onChange && props.onChange(value);
  };

  const language = useMemo(() => {
    return getLanguageByExtension(props.extension);
  }, [props.extension]);

  const onAlertClose = () => {
    setShowFileEditErrorAlert(false);
  };

  useImperativeHandle(ref, () => getEditorHandlers(editorRef.current));
  const monacoTheme = colorMode === "dark" ? "vs-dark" : "light";

  return (
    <Box
      flex="1"
      minH="0"
      overflow="hidden"
      minW="calc(100% - 450px)"
      className="code-wrapper"
    >
      <Editor
        width="100%"
        height="100%"
        keepCurrentModel={false}
        defaultLanguage={language}
        theme={monacoTheme}
        defaultValue={props.initialData}
        options={{
          automaticLayout: true,
          readOnly: !!props.readonly,
          scrollbar: {
            alwaysConsumeMouseWheel: true,
          },
          ...(props.options || {}),
        }}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
      />
      {showFileEditErrorAlert && (
        <Alert
          status="error"
          position="absolute"
          bottom="3"
          left="3"
          maxW="512px"
        >
          <AlertIcon />
          <Box>
            <AlertDescription>
              You cannot edit a linked source file in the main branch. Try
              creating a new feature branch to be able to edit the file.
            </AlertDescription>
          </Box>
          <CloseButton
            alignSelf="flex-start"
            position="relative"
            right={-1}
            top={-1}
            onClick={onAlertClose}
          />
        </Alert>
      )}
      {/*{props.allowComments && isMounted && (
        <CodeEditorComments
          editor={editorRef.current}
          monaco={monacoRef.current}
        />
      )}*/}
    </Box>
  );
});

export type CodeEditorType = editor.IStandaloneCodeEditor;
export type CodeEditorOptionsType = editor.IStandaloneEditorConstructionOptions;

export interface CodeEditorRef {
  find: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  undo: () => void;
  redo: () => void;
  formatDocument: () => void;
  getValue: () => string;
  revealLine: (line: number) => void;
  revealLineInCenter: (line: number) => void;
}

export interface CodeEditorProps
  extends Omit<IEditorProps<string>, "readonly"> {
  extension?: string;
  readonly?: boolean | string;
  options?: CodeEditorOptionsType;
  onMount?: (editor: CodeEditorType, monaco: any) => void;
}

export default CodeEditor;
