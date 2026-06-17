import { Container, DisplayObject, Graphics } from "pixi.js";
import { INSTANCE_CHANGES_STYLES } from "../../configs";
import { EntityCommitChangeType } from "@multiplayer/types";

export default class ChangeTypeRect {
  rect: Graphics;

  constructor(
    private changeType: EntityCommitChangeType,
    private width: number,
    private height: number,
    private radius: number
  ) {
    this.render();
  }

  render() {
    if (!this.changeType) return this.destroy();

    const styles = INSTANCE_CHANGES_STYLES[this.changeType];
    this.rect = new Graphics();
    this.rect.lineStyle(6, styles.stroke, 1, 1);
    this.rect.drawRoundedRect(
      1,
      1,
      this.width - 3,
      this.height - 3,
      this.radius
    );
  }

  appendTo(parent: Container) {
    parent.addChild(this.rect as unknown as DisplayObject);
  }

  destroy() {
    this.rect?.removeFromParent();
  }
}
