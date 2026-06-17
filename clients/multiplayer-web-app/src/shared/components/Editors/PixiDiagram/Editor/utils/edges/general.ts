import { PlatformLayoutDirection, EdgeDirection } from "@multiplayer/types";

export function getEdgeCenter({
  sourceX,
  sourceY,
  targetX,
  targetY,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}): [number, number, number, number] {
  const xOffset = Math.abs(targetX - sourceX) / 2;
  const centerX = targetX < sourceX ? targetX + xOffset : targetX - xOffset;

  const yOffset = Math.abs(targetY - sourceY) / 2;
  const centerY = targetY < sourceY ? targetY + yOffset : targetY - yOffset;

  return [centerX, centerY, xOffset, yOffset];
}

export function getDefaultEdgePosition(
  end: "source" | "target",
  dir: PlatformLayoutDirection
) {
  return dir === PlatformLayoutDirection.HORIZONTAL
    ? end === "source"
      ? EdgeDirection.right
      : EdgeDirection.left
    : end === "source"
    ? EdgeDirection.bottom
    : EdgeDirection.top;
}
