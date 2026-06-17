import { SVGScene } from "@pixi-essentials/svg";
import { Container, DisplayObject } from "pixi.js";
import { ICON_SIZE } from "../../configs";

// Icons
import ArrowVectorIcon from "assets/icons/arrow-vector-white.svg";

const icons = {
  arrowVector: ArrowVectorIcon,
};

type IconType = "arrowVector";

class Icon extends Container {
  constructor(private icon: IconType, private size = ICON_SIZE) {
    super();
    this.renderIcon();
  }

  async renderIcon() {
    const icon = await SVGScene.from(icons[this.icon]);
    icon.width = this.size;
    icon.height = this.size;
    this.addChild(icon) as unknown as DisplayObject;
  }
}

export default Icon;
