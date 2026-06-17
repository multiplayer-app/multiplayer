import {
  Text as PixiText,
  TextStyle,
  ITextStyle,
  Container,
  DisplayObject,
  FederatedPointerEvent,
} from "pixi.js";
import { getTextValue } from "../../helpers";
import { RATIO } from "../../configs";

class Text extends PixiText {
  originalText: string;
  truncatedText: string;
  tooltipEnabled: boolean;

  constructor(
    text: string,
    styles: Partial<
      ITextStyle & {
        width: number;
        maxWidth: number;
        fontWeight: any;
        fontSize: number;
      }
    > = {}
  ) {
    const { maxWidth, fontSize, wordWrapWidth, ...rest } = styles;
    const textStyle = new TextStyle({
      fontWeight: "500",
      fontFamily: "Inter",
      ...rest,
      fontSize: (fontSize || 14) * RATIO,
      ...(wordWrapWidth ? { wordWrapWidth: wordWrapWidth * RATIO } : {}),
    });

    const truncated = maxWidth ? getTextValue(text, maxWidth, textStyle) : text;

    super(truncated, textStyle);

    this.originalText = text;
    this.truncatedText = truncated;
    this.tooltipEnabled = truncated !== text;

    this.anchor.set(0, 0.5);
    this.scale.set(1 / RATIO);

    this.on("added", () => {
      this.cacheAsBitmap = true;
    });

    if (this.tooltipEnabled) {
      this.eventMode = "static";
      this.cursor = "pointer";
      this.on("pointerover", this.handleTooltipShow);
      this.on("pointerout", this.handleTooltipHide);
    }
  }

  handleTooltipShow = (e: FederatedPointerEvent) => {
    if (e.pressure > 0) {
      return;
    }
    const global = this.getGlobalPosition();
    const bounds = this.getBounds();

    window.dispatchEvent(
      new CustomEvent("pixi-tooltip-show", {
        detail: {
          text: this.originalText,
          x: global.x + bounds.width / 2,
          y: global.y,
          width: bounds.width,
        },
      })
    );
  };

  handleTooltipHide = () => {
    window.dispatchEvent(new Event("pixi-tooltip-hide"));
  };

  appendTo(parent: Container) {
    parent.addChild(this as unknown as DisplayObject);
  }
}

export default Text;
