import { FunctionComponent, SVGProps } from "react";
import { EntityCommitChangeType } from "@multiplayer/types";
import { Endpoint, NodeTypes, StageStatus, SystemViewTypes } from "./enums";
import { IPresentUser, IProjectBranchChange } from "./interfaces";

export type UseHistoryState<T> = [
  T,
  (arg: any) => void,
  (arg: T) => void,
  { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean }
];

export interface NodeMethods {
  onSelect: (id: string, e: React.PointerEvent) => void;
  onConnectEnd: (id: string) => void;
  onConnectStart: (id: string) => void;
  onRestoreClick?: (id: string) => void;
  onNodeDoubleClick?: (id: string) => void;
  onAddToPlatformClick?: (
    parentId?: string,
    direction?: string,
    shouldConnectToParent?: boolean
  ) => void;
}

export interface NodeProps extends NodeMethods {
  id: string;
  type: NodeTypes;
  name: string;
  data: { [key: string]: any };
  entityId: string;
  isDragging: boolean;
  isSelected: boolean;
  isDeleted: boolean;
  isHighlighted: boolean;
  readonly: boolean;
  changeType?: EntityCommitChangeType | null;
  presentUsers?: IPresentUser[];
  dragHandleProps?: any;
}

export type ActionType = {
  type: string;
  payload?: any;
};

export type IconType = FunctionComponent<
  SVGProps<SVGSVGElement> & { title?: string }
>;

export type BranchChanges = Map<string, IProjectBranchChange>;
export type BranchState = Map<string, IProjectBranchChange>;

export type StageChunk = Record<string, { status: StageStatus }>;
export type EndpointStageState = { status: StageStatus; chunks?: StageChunk };
export type StagedChange = Record<Endpoint, EndpointStageState>;

export type ViewIdType = SystemViewTypes | string;
