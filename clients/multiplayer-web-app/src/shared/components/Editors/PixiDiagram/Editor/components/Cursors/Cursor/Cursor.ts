import { Graphics, Container, BLEND_MODES, DisplayObject } from "pixi.js";
import { ClientState } from "shared/models/interfaces";
import { animatePosition } from "../../../utils/animations";
import Text from "../../Text";
import { getTextColor } from "../../../helpers";

export class Cursor {
  public container: Container;

  constructor(private state: ClientState, scale: number) {
    this.container = new Container();
    this.container.scale.set(1 / scale);
    this.render();
  }

  update(newState: ClientState, scale: number) {
    this.container.scale.set(1 / scale);
    animatePosition(this.container.position, newState.pointer, 400, false);
  }

  destroy() {
    this.container.removeFromParent();
  }

  render() {
    const { color, username } = this.state.user;
    const arrow = new Graphics();
    arrow.beginFill(color, 1);
    arrow.lineStyle(1, "white", 1, 1);
    arrow.moveTo(0, 0);
    arrow.lineTo(18, 7);
    arrow.lineTo(10, 10);
    arrow.lineTo(7, 18);
    arrow.lineTo(0, 0);
    arrow.endFill();

    const textContainer = new Container();
    textContainer.x = 20;
    textContainer.y = 20;
    const text = new Text(username, { fill: getTextColor(color) });
    text.anchor.set(0, 0.5);
    text.x = 8;
    text.y = (text.height + 8) / 2;
    text.blendMode = BLEND_MODES.DIFFERENCE;

    const rect = new Graphics();
    rect.beginFill(color, 1);
    rect.drawRoundedRect(0, 0, text.width + 16, text.height + 8, 20);
    rect.endFill();

    textContainer.addChild(rect as unknown as DisplayObject);
    textContainer.addChild(text as unknown as DisplayObject);
    this.container.addChild(arrow as unknown as DisplayObject);
    this.container.addChild(textContainer as unknown as DisplayObject);
    this.container.position.set(this.state.pointer.x, this.state.pointer.y);
  }
}
