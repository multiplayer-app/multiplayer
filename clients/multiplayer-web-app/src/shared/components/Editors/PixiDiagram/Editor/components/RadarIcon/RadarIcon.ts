import { Assets, Container, DisplayObject, Sprite, Texture } from "pixi.js";

import { COMPONENT_ICON_BY_TYPE, COMPONENT_ICON_SIZE } from "../../configs";

class RadarIcon extends Container {
  size: number = COMPONENT_ICON_SIZE;
  private sprite: Sprite | null = null;
  constructor(size = COMPONENT_ICON_SIZE) {
    super();
    this.size = size;
  }

  private async loadTexture(): Promise<Texture> {
    try {
      return await Assets.load(COMPONENT_ICON_BY_TYPE["radar"]);
    } catch (error) {
      console.error(`Failed to load default icon for type: radar.`);
    }
  }

  async renderIcon(): Promise<void> {
    const texture = await this.loadTexture();

    if (this.sprite) {
      this.removeChild(this.sprite as unknown as DisplayObject);
    }

    this.sprite = new Sprite(texture);
    this.sprite.width = this.size;
    this.sprite.height = this.size;
    this.pivot.set(0, this.size / 2);
    this.addChild(this.sprite as unknown as DisplayObject);
  }
}

export default RadarIcon;
