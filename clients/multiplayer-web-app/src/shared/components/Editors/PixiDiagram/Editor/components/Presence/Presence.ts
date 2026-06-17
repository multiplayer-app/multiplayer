import { Container, Graphics, Sprite, Texture, DisplayObject } from "pixi.js";
import {
  getUserInitials,
  getClientUserName,
} from "shared/helpers/general.helpers";
import { ClientState } from "shared/models/interfaces";
import { getTextColor } from "../../helpers";
import Text from "../Text";

export default class Presence extends Container {
  constructor() {
    super();
  }

  update(states: ClientState[] = []) {
    this.removeChildren();
    states.forEach((state, index) => {
      const avatar = new Avatar(state);
      avatar.x = index * 5;
      this.addChild(avatar as unknown as DisplayObject);
    });
  }

  appendTo(parent: Container) {
    parent.addChild(this as unknown as DisplayObject);
  }
}

class Avatar extends Container {
  constructor(state: ClientState, size: number = 24) {
    super();
    const border = new Graphics();
    const borderW = 2;
    const halfSize = size / 2;
    const { color, iconUrl } = state.user;
    const name = getClientUserName(state.user);

    border.beginFill(color);
    border.lineStyle(borderW, color);
    border.drawCircle(halfSize, halfSize, halfSize);
    border.endFill();

    this.addChild(border as unknown as DisplayObject);

    if (iconUrl) {
      const mask = new Graphics();
      const maskSize = halfSize - 1;
      mask.beginFill(0x000000);
      mask.drawCircle(maskSize, maskSize, maskSize);
      mask.endFill();
      mask.x = 1;
      mask.y = 1;
      this.addChild(mask as unknown as DisplayObject);

      const texture = Texture.from(iconUrl);
      const avatarImage = new Sprite(texture);
      avatarImage.width = size;
      avatarImage.height = size;
      avatarImage.x = 0;
      avatarImage.y = 0;
      avatarImage.mask = mask;
      this.addChild(avatarImage as unknown as DisplayObject);
    } else {
      const initials = new Text(getUserInitials(name), {
        fill: getTextColor(color),
        fontSize: 10,
      });
      initials.anchor.set(0.5);
      initials.x = halfSize;
      initials.y = halfSize;
      this.addChild(initials as unknown as DisplayObject);
    }
  }
}
