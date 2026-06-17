import { EntityType } from "@multiplayer/types";
import { CodeProps } from "shared/models/interfaces";
import CodeEditor from "shared/components/Editors/CodeEditor";
import EntityThreadsDrawer from "shared/components/EntityThreadsDrawer";
import { useSource } from "shared/providers/SourceContext";

const CodeEditorPanel = ({
  doc,
  readonly,
  provider,
  initialData,
}: CodeProps) => {
  const { entityThreadsDisclosure, editorRef } = useSource();
  const { extension } = doc.getMap("metadata").toJSON();

  return (
    <>
      <CodeEditor
        doc={doc}
        readonly={readonly}
        provider={provider}
        initialData={initialData}
        extension={extension}
        ref={editorRef}
      />

      {entityThreadsDisclosure.isOpen ? (
        <EntityThreadsDrawer
          onClose={entityThreadsDisclosure.onClose}
          entityType={EntityType.FILE}
        />
      ) : null}
    </>
  );
};

export default CodeEditorPanel;
