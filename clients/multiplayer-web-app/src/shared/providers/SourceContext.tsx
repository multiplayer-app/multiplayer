import { createContext, MutableRefObject, useContext, useRef } from "react";
import { useDisclosure, UseDisclosureReturn } from "@chakra-ui/react";
import { CodeEditorRef } from "shared/components/Editors/CodeEditor";

interface ISourceStateContext {
  entityThreadsDisclosure: UseDisclosureReturn;
  editorRef: MutableRefObject<any>;
}

export const SourceProvider = ({ children }) => {
  const entityThreadsDisclosure = useDisclosure();
  const editorRef = useRef<CodeEditorRef>(null);

  return (
    <SourceContext.Provider
      value={{
        entityThreadsDisclosure,
        editorRef,
      }}
    >
      {children}
    </SourceContext.Provider>
  );
};

export const SourceContext = createContext<ISourceStateContext | null>(null);

export function useSource() {
  const context = useContext(SourceContext);
  if (context === null) {
    throw new Error("useSource must be used within SourceProvider");
  }
  return context;
}
