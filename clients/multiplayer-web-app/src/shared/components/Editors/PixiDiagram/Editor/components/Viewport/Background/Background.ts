import { Graphics } from "pixi.js";
import { getDiagramTheme } from "../../../theme";

class Background extends Graphics {
  constructor({ dotSize = 1, gridSize = 24 }: { dotSize?: number; gridSize?: number } = {}) {
    super();
    this.drawGrid(gridSize, dotSize);
  }

  drawGrid(gridSize: number, dotSize: number) {
    const { background } = getDiagramTheme();
    this.clear();
    this.beginFill(background.cellColor, background.cellAlpha)
      .drawRect(0, 0, gridSize, gridSize)
      .endFill();
    this.beginFill(background.dotColor).drawCircle(0, 0, dotSize).endFill();
  }
}
export default Background;
