import {
  ComponentType,
  EntityCommitChangeType,
  PlatformLayoutDirection,
} from "@multiplayer/types";
import { IS_VSCODE } from "vscode/VsCodeContext";



export const SYNC_THROTTLING = 200;
export const CAPTURE_TIMEOUT = 600;
export const RATIO = window.devicePixelRatio;
export const IS_PROD = process.env.NODE_ENV === "production";
export const POWER_PREFERENCE = IS_PROD && !IS_VSCODE ? "high-performance" : "low-power";
export const DEBUG = !IS_PROD;
export const FONT_PATH = `${process.env.PUBLIC_URL}/assets/fonts/bitmap`;
export const ICON_PATH = `${process.env.PUBLIC_URL}/assets/icons/platform`;

export const ICON_SIZE = 20;

export const GRID_SIZE = 26;
export const MAX_ZOOM = 2;
export const MIN_ZOOM = 0.25;
export const ACTUAL_GRID_SIZE = GRID_SIZE + 1;
export const ROW_GAP = ACTUAL_GRID_SIZE * 2;
export const GROUP_ROW_GAP = ACTUAL_GRID_SIZE * 2;
export const COLUMN_GAP = ACTUAL_GRID_SIZE * 5;
export const GROUP_COLUMN_GAP = ACTUAL_GRID_SIZE * 3;
export const ROW_HEIGHT = ACTUAL_GRID_SIZE * 4;
export const COLUMN_WIDTH = ACTUAL_GRID_SIZE * 12;

export const LAYOUT_SPACINGS = {
  [PlatformLayoutDirection.HORIZONTAL]: {
    ROW_GAP: ACTUAL_GRID_SIZE * 2,
    COLUMN_GAP: ACTUAL_GRID_SIZE * 5,
    GROUP_ROW_GAP: ACTUAL_GRID_SIZE * 2,
    GROUP_COLUMN_GAP: ACTUAL_GRID_SIZE * 3,
  },
  [PlatformLayoutDirection.VERTICAL]: {
    ROW_GAP: ACTUAL_GRID_SIZE * 4,
    COLUMN_GAP: ACTUAL_GRID_SIZE * 2,
    GROUP_ROW_GAP: ACTUAL_GRID_SIZE * 3,
    GROUP_COLUMN_GAP: ACTUAL_GRID_SIZE * 2,
  },
};

export const COMPONENT_GAP = 13.5;
export const GROUP_INFO_HEIGHT = 28;
export const COMPONENT_RADIUS = 16;
export const COMPONENT_WIDTH = ACTUAL_GRID_SIZE * 7;
export const COMPONENT_HEIGHT = ACTUAL_GRID_SIZE * 2;
export const COMPONENT_ICON_SIZE = 24;
export const DEFAULT_ZOOM = { x: 50, y: 50, scale: 1, isDefault: true };
export const CURSOR_POINTER_THROTTLE = 50;

export const COMPONENT_XRAY_STYLES = ["white", "#CBD5E0", "#CBD5E0"];

export const COMPONENT_BASE_STYLES = {
  group: ["#EDF2F7", "#CBD5E0", "#718096"],
  [ComponentType.GENERIC]: ["#EBF8FF", "#C7D2FE", "#2329d6"],
  [ComponentType.SERVICE]: ["#C6F6D5", "#9AE6B4", "#38A169"],
  [ComponentType.PLATFORM]: ["#FAF5FF", "#D6BCFA", "#805AD5"],
  [ComponentType.CLIENT]: ["#2D3748", "#718096", "#171923", "#EDF2F7"],
};

export const INSTANCE_CHANGES_STYLES = {
  [EntityCommitChangeType.CREATE]: {
    stroke: "#18DE97",
  },
  [EntityCommitChangeType.UPDATE]: {
    stroke: "#0069FF",
  },
  [EntityCommitChangeType.DELETE]: {
    stroke: "#E74C3C",
  },
};

export const COMPONENT_ICON_BY_TYPE = {
  group: `${ICON_PATH}/group.svg`,
  radar: `${ICON_PATH}/radar.svg`,
  [ComponentType.CLIENT]: `${ICON_PATH}/client.png`,
  [ComponentType.GENERIC]: `${ICON_PATH}/generic.png`,
  [ComponentType.SERVICE]: `${ICON_PATH}/service.png`,
  [ComponentType.PLATFORM]: `${ICON_PATH}/platform.png`,
};
