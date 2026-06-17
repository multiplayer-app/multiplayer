import { Graphics, IPointData } from "pixi.js";

const memoizedResults = new Map<string, any>();

export function getNodeHitArea(w: number, h: number, k: number = 0) {
  const key = `${w}-${h}-${k}`;
  if (memoizedResults.has(key)) {
    return memoizedResults.get(key);
  }

  const w2 = w / 2;
  const h2 = h / 2;
  const k2 = k / 2;

  const hitArea = [
    { x: 0, y: 0 },
    { x: w2 - k2, y: 0 },
    { x: w2 - k2, y: -k },
    { x: w2 + k2, y: -k },
    { x: w2 + k2, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h2 - k2 },
    { x: w + k, y: h2 - k2 },
    { x: w + k, y: h2 + k2 },
    { x: w, y: h2 + k2 },
    { x: w, y: h },
    { x: w2 + k2, y: h },
    { x: w2 + k2, y: h + k },
    { x: w2 - k2, y: h + k },
    { x: w2 - k2, y: h },
    { x: 0, y: h },
    { x: 0, y: h2 + k2 },
    { x: -k, y: h2 + k2 },
    { x: -k, y: h2 - k2 },
    { x: 0, y: h2 - k2 },
    { x: 0, y: 0 },
  ];

  memoizedResults.set(key, hitArea);
  return hitArea;
}

export function drawGraphicsHitArea(
  graphics: Graphics,
  pointData: Array<IPointData>
) {
  graphics.beginFill("red");
  graphics.alpha = 0.7;
  graphics.drawPolygon(pointData);
}

export function getGroupHitArea(g: number, w: number, h: number) {
  const t = -g;
  const l = -g;
  const r = w;
  const b = h + g;

  return [
    { x: l, y: t },
    { x: r, y: t },
    { x: r, y: b },
    { x: l, y: b },
    { x: l, y: t },
  ];
}
