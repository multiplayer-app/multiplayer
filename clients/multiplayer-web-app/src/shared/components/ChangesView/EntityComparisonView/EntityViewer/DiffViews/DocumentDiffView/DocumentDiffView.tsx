import DocumentEditor from "shared/components/Editors/DocumentEditor";
import { Blocknote } from "@multiplayer/types";
import { useEffect } from "react";

interface DocumentDiffViewProps {
  content: Blocknote.BlockElement;
  patch: any;
}

const DocumentDiffView = ({ content, patch }: DocumentDiffViewProps) => {
  useEffect(() => {
    // console.log(patch);
  }, [patch]);

  return <DocumentEditor readonly initialData={content} />;
};

export default DocumentDiffView;
