import { Platform } from "@multiplayer/types";
import { IEditorProps } from "shared/models/interfaces";
import { PlatformDiagramView, usePlatformDiagram } from "../PixiDiagram";
import { forwardRef, useImperativeHandle } from "react";

interface PlatformEditorProps extends IEditorProps<Platform> {
  keepViewportState?: boolean;
}

export interface PlatformEditorRef {
  zoomToFit: () => void;
}

const PlatformEditor = forwardRef(
  (
    {
      doc,
      readonly,
      provider,
      initialData,
      keepViewportState,
    }: PlatformEditorProps,
    ref: React.Ref<PlatformEditorRef>
  ) => {
    const editor = usePlatformDiagram({
      doc,
      provider,
      readonly,
      initialData,
    });

    useImperativeHandle(
      ref,
      () => ({
        zoomToFit: () => {
          editor?.instance?.viewport?.zoomToFit();
        },
      }),
      [editor]
    );

    return (
      <PlatformDiagramView
        editor={editor}
        readonly={readonly}
        keepViewportState={keepViewportState}
      />
    );
  }
);

export default PlatformEditor;
