import { Flex, useColorMode, UseDisclosureReturn } from "@chakra-ui/react";
import { BlockEditor, BlockEditorRef } from "@multiplayer/blocknote";
import { ScrollSyncPane } from "react-scroll-sync";

import DocumentComments from "./DocumentComments";
import { useDocumentEditor } from "./DocumentEditorContext";

import "@multiplayer/blocknote/dist/style.css";
import "./DocumentEditor.scss";
import { useEffect, useRef } from "react";

export interface DocumentEditorProps {
  entityThreadsDisclosure?: UseDisclosureReturn;
}
const scrollOffsets = new Map();

const DocumentEditorStateLess = ({
  entityThreadsDisclosure,
}: DocumentEditorProps) => {
  const { colorMode } = useColorMode();
  const editorRef = useRef<BlockEditorRef>(null);
  const { readonly, editor, allowComments, isNotebookAreaExpanded } =
    useDocumentEditor();

  useEffect(() => {
    if (!editorRef.current) return;
    const el = editorRef.current;
    const onScroll = () => {
      const position = el.getScrollPosition();
      scrollOffsets.set(window.location.pathname, position.scrollTop);
    };
    el.addScrollListener(onScroll);
    const scrollOffset = scrollOffsets.get(window.location.pathname);
    if (scrollOffset) {
      el.scrollTo({ top: scrollOffset });
    }
    return () => {
      el.removeScrollListener(onScroll);
    };
  }, [editor, editorRef]);

  return (
    <ScrollSyncPane>
      <Flex
        flex="1"
        w="full"
        h="full"
        fontSize="16px"
        overflow="visible"
        id="doc-editor-wrapper"
        className={`editor-wrapper${readonly ? " readonly" : ""} ${
          isNotebookAreaExpanded ? "editor-expanded" : ""
        }`}
      >
        <BlockEditor ref={editorRef} editor={editor} theme={colorMode}>
          {allowComments && editor && (
            <DocumentComments
              editor={editor}
              entityThreadsDisclosure={entityThreadsDisclosure}
            />
          )}
        </BlockEditor>
      </Flex>
    </ScrollSyncPane>
  );
};

export default DocumentEditorStateLess;
