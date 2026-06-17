import { Text } from "pixi.js";
import { ShapeInfo } from "kld-intersections";
import { COMPONENT_BASE_STYLES, COMPONENT_XRAY_STYLES, RATIO } from "./configs";
import { BaseNodeType, ViewportState } from "./types";
import { ChangesViewMode } from "shared/models/enums";
import { PlatformComponentColors } from "@multiplayer/types";
import GroupNode from "./components/GroupNode";
import { Y } from "@multiplayer/entity";
import { getDiagramTheme, registerCacheClear } from "./theme";

export function truncateText(text, maxWidth, style) {
  const pixiText = new Text(text, style);

  if (pixiText.width > maxWidth) {
    let truncatedText = text;
    pixiText.text = truncatedText + "...";

    while (pixiText.width > maxWidth && truncatedText.length > 0) {
      truncatedText = truncatedText.slice(0, -1);
      pixiText.text = truncatedText + "...";
    }

    return pixiText.text;
  } else {
    return text;
  }
}

export function getTextValue(text, maxWidth, textStyle): string {
  return maxWidth ? truncateText(text, maxWidth * RATIO, textStyle) : text;
}

export const isCtrlKeyPressed = (e: any): boolean => {
  return e.metaKey || e.ctrlKey;
};

export const roundDecimal = (value: number): number => {
  return Math.round(value * 100) / 100;
};

export const isMiddleButton = (event: MouseEvent): boolean => {
  return event.button === 1;
};

export function isInside(a, b): boolean {
  return (
    a.args[0].x < b.args[0].x &&
    a.args[0].y < b.args[0].y &&
    a.args[1].x > b.args[1].x &&
    a.args[1].y > b.args[1].y
  );
}

export function polygonPointsToPath(points) {
  if (!points || points.length === 0 || points.length % 2 !== 0) return "";
  let path = `M${points[0]},${points[1]}`;

  for (let i = 2; i < points.length; i += 2) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (isNaN(p1) || isNaN(p2)) continue;
    path += ` L${p1},${p2}`;
  }

  path += " Z";

  return path;
}

export function boundsToShape(
  points,
  type: "rectangle" | "path" = "rectangle",
  offset: number = 0
) {
  if (type === "rectangle") {
    return ShapeInfo.rectangle({
      top: points.y - offset,
      left: points.x - offset,
      size: [
        (points.width || 0) + offset * 2,
        (points.height || 0) + offset * 2,
      ],
    });
  } else {
    return ShapeInfo.path(polygonPointsToPath(points));
  }
}

export function getTextColor(backgroundColor) {
  const color =
    backgroundColor.charAt(0) === "#"
      ? backgroundColor.substring(1, 7)
      : backgroundColor;
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 186 ? "#000000" : "#FFFFFF";
}

export function isValidViewportState(state: ViewportState): boolean {
  if (!state || typeof state !== "object" || Object.keys(state).length === 0) {
    return false;
  }

  const keysToCheck = ["x", "y", "scale"];

  return keysToCheck.every(
    (key) => typeof state[key] === "number" && !Number.isNaN(state[key])
  );
}

export function getNodeCenter(node): [number, number] {
  const { width, height } = node.rect.getBounds();
  return [node.x + width / 2, node.y + height / 2];
}

const memoizedColorsCache = new Map();

export function clearColorSetCache(): void {
  memoizedColorsCache.clear();
}

registerCacheClear(clearColorSetCache);

export function getColorSet(
  viewMode: ChangesViewMode,
  metadataColor: string,
  type: BaseNodeType,
  isSelected: boolean
): { fill: string; textColor: string; stroke: string } {
  const cacheKey = `${viewMode}-${metadataColor}-${type}-${isSelected}`;

  if (memoizedColorsCache.has(cacheKey)) {
    return memoizedColorsCache.get(cacheKey);
  }

  const colorSet =
    viewMode === ChangesViewMode.XRAY
      ? COMPONENT_XRAY_STYLES
      : PlatformComponentColors[metadataColor] || COMPONENT_BASE_STYLES[type];

  const [fill, stroke, selected, textColor = getDiagramTheme().text.primary] = colorSet;
  const result = { fill, textColor, stroke: isSelected ? selected : stroke };

  memoizedColorsCache.set(cacheKey, result);

  return result;
}
export function isDroppableInstance(target): boolean {
  return !(target.groupId || target instanceof GroupNode);
}

export function isIgnorableTransaction(transaction: Y.Transaction): boolean {
  const { origin } = transaction;
  return origin === "ignore" || origin instanceof Y.UndoManager;
}
