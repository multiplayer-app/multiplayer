import { Container, DisplayObject, Graphics } from "pixi.js";

import Text from "../Text";
import { COMPONENT_RADIUS } from "../../configs";
import { getDiagramTheme } from "../../theme";

class EmptyBox extends Container {
  constructor(private options, private _text: string) {
    super();
    this.renderNode();
  }

  clear() {
    this.removeChildren();
  }

  renderNode() {
    this.renderRect();
    this.renderText();
  }

  appendTo(parent: Container) {
    parent.addChild(this as unknown as DisplayObject);
  }

  private renderText(): void {
    const { emptyBox } = getDiagramTheme();
    const text = new Text(this._text, {
      wordWrap: true,
      fontSize: 12,
      align: "center",
      fill: emptyBox.textColor,
      whiteSpace: "normal",
      wordWrapWidth: this.options.width - 20,
    });

    text.alpha = 0.95;
    text.anchor.set(0.5, 0.5);
    text.position.set(this.options.width / 2, this.options.height / 2);
    this.addChild(text as unknown as DisplayObject);
  }

  private renderRect(): void {
    const { emptyBox } = getDiagramTheme();
    const { width, height, radius = COMPONENT_RADIUS } = this.options;
    const rect = new Graphics();
    rect.clear();
    rect.removeFromParent();
    rect.beginFill(emptyBox.bgColor, 0.01);
    rect.lineStyle(1, emptyBox.borderColor, 0.1, 0);
    rect.drawRoundedRect(0, 0, width, height, radius);
    this.addChild(rect as unknown as DisplayObject);

    const maskRect = rect.clone();
    this.addChild(maskRect as unknown as DisplayObject);

    const stripes = new Graphics();
    const stripeColor = emptyBox.stripeColor;
    const stripeAlpha = 0.1;
    const stripeWidth = 0.5;
    const stripeGap = 12;
    const angle = Math.PI / 4; // 45 degrees

    for (
      let i = -this.options.height;
      i < this.options.width + this.options.height;
      i += stripeGap
    ) {
      stripes.lineStyle(stripeWidth, stripeColor, stripeAlpha);
      stripes.moveTo(i, 0);
      stripes.lineTo(
        i + this.options.height * Math.tan(angle),
        this.options.height
      );
    }
    stripes.mask = rect;
    this.addChild(stripes as unknown as DisplayObject);
  }
}

export default EmptyBox;
