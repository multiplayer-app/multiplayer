import * as Y from "yjs";
import { ApiType } from "@multiplayer/types";
import { YjsSocketIOProvider } from "integrations/YjsSocketIOProvider";

export interface ApiEditorProps {
  doc: Y.Doc;
  version: string;
  viewMode: ViewModes;
  provider: YjsSocketIOProvider;
  readonly: boolean;
  extension: string;
  initialData: any;
  apiProvider: ApiType;
}

export interface ApiEditorHandle {
  canUndo: () => boolean;
  canRedo: () => boolean;
  undo: () => void;
  redo: () => void;
}

export interface IMetadata {
  provider: ApiType;
  version: string;
  extension: string;
  defaultViewId?: string;
}

export enum ViewModes {
  SPLIT = "SPLIT",
  SOURCE = "SOURCE",
  DESIGNER = "DESIGNER",
}
