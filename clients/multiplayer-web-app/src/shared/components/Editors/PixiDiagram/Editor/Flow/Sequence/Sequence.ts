import { Container, DisplayObject } from "pixi.js";
import Graphics from "../../components/Graphics";
import Text from "../../components/Text";
import { getNodeCenter } from "../../helpers";
import { getDiagramTheme } from "../../theme";

class Sequence extends Container {
  arrowLine: Graphics = new Graphics();

  constructor(data, source, target) {
    super();
    // this.cullable = true;
    const y = 60 + Number(data.spanId) * 60;
    const [sourceX] = getNodeCenter(source);
    const [targetX] = getNodeCenter(target);
    const x1 = Math.min(sourceX, targetX) + 10;
    const x2 = Math.max(sourceX, targetX) - 10;
    const distance = Math.max(x2 - x1, 0);
    const centerX = x1 + distance / 2;
    const direction = sourceX > targetX ? "l" : "r";

    const { sequence } = getDiagramTheme();
    const text = new Text(data.name, {
      fontSize: 12,
      fill: sequence.textFill,
      fontWeight: 500,
      ...(distance ? { maxWidth: distance - 30 } : {}),
    });
    const textBackground = new Graphics();

    text.anchor.set(0.5, 0.55);
    text.position.set(centerX, y);
    const padding = 8;
    const bgHeight = 30;
    const bgWidth = text.width + padding * 2;
    const bgX = centerX - text.width / 2 - padding;
    const bgY = y - bgHeight / 2;
    const shadowOffset = 5;

    textBackground.lineStyle(0);
    textBackground.beginFill(sequence.bgFill, 1);
    textBackground.drawRoundedRect(
      bgX - shadowOffset,
      bgY - shadowOffset,
      bgWidth + shadowOffset * 2,
      bgHeight + shadowOffset * 2,
      8
    );
    textBackground.endFill();
    textBackground.lineStyle(1, sequence.bgStroke, 1);
    textBackground.beginFill(sequence.bgFill);
    textBackground.drawRoundedRect(bgX, bgY, bgWidth, bgHeight, 8);
    textBackground.pivot.set(0.5, 0.5);

    this.arrowLine.lineStyle(3, sequence.arrowStroke, 1);
    this.arrowLine.moveTo(x1, y);
    this.arrowLine.lineTo(x2, y);
    if (distance) {
      this.drawArrow(direction === "l" ? x1 : x2, y, direction);
    }
    this.addChild(this.arrowLine as unknown as DisplayObject);
    this.addChild(textBackground as unknown as DisplayObject);

    this.addChild(text as unknown as DisplayObject);
  }

  drawText() {}

  drawArrow(tX: number, tY: number, dir: "l" | "r") {
    this.arrowLine.moveTo(tX, tY);
    if (dir === "l") {
      this.arrowLine.lineTo(tX + 10, tY - 10);
      this.arrowLine.moveTo(tX, tY);
      this.arrowLine.lineTo(tX + 10, tY + 10);
    } else {
      this.arrowLine.lineTo(tX - 10, tY - 10);
      this.arrowLine.moveTo(tX, tY);
      this.arrowLine.lineTo(tX - 10, tY + 10);
    }
  }

  appendTo(parent: Container) {
    parent.addChild(this as unknown as DisplayObject);
    setTimeout(() => {
      this.cacheAsBitmap = true;
    }, 100);
  }
}

export default Sequence;
