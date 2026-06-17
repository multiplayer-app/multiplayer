import { EdgeDirection } from "@multiplayer/types";
import { Graphics, DisplayObject, Container } from "pixi.js";

import Icon from "../../Icon";
import { animateScale } from "../../../utils/animations";
import { NonDraggableContainer } from "../../Containers";
import { COMPONENT_WIDTH, COMPONENT_HEIGHT } from "../../../configs";
import { getDiagramTheme } from "../../../theme";

class ConnectionPoint extends NonDraggableContainer {
  icon: Icon;
  dot: Container;
  direction: EdgeDirection;
  parentNode;

  constructor(public options: { direction: EdgeDirection; parentNode }) {
    super();
    const size = 40;
    const halfSize = size / 2;
    const dot = new Graphics();
    const square = new Graphics();
    this.zIndex = 22;
    this.cursor = "pointer";
    this.eventMode = "static";
    this.direction = options.direction;
    this.parentNode = options.parentNode;
    this.pivot.set(halfSize, halfSize);
    this.icon = new Icon("arrowVector", 4);
    this.icon.pivot.set(2, 2);
    this.icon.x = 4;
    this.icon.y = 4;
    this.icon.alpha = 0;

    square.beginFill("#ffffff", 0.01);
    square.drawRect(0, 0, size, size);
    square.endFill();

    const { connectionPoint } = getDiagramTheme();
    dot.beginFill(connectionPoint.dotColor);
    dot.drawCircle(4, 4, 4);
    dot.endFill();

    this.dot = new Container();
    this.dot.x = halfSize;
    this.dot.y = halfSize;
    this.dot.pivot.set(4, 4);

    this.dot.addChild(dot as unknown as DisplayObject);
    this.dot.addChild(this.icon as unknown as DisplayObject);

    this.addChild(square as unknown as DisplayObject);
    this.addChild(this.dot as unknown as DisplayObject);

    switch (options.direction) {
      case EdgeDirection.top:
        this.x = COMPONENT_WIDTH / 2;
        this.y = -halfSize;
        this.icon.rotation = -Math.PI / 2;
        break;
      case EdgeDirection.right:
        this.x = COMPONENT_WIDTH + halfSize;
        this.y = COMPONENT_HEIGHT / 2;
        break;
      case EdgeDirection.bottom:
        this.x = COMPONENT_WIDTH / 2;
        this.y = COMPONENT_HEIGHT + halfSize;
        this.icon.rotation = Math.PI / 2;
        break;
      case EdgeDirection.left:
        this.x = -halfSize;
        this.y = COMPONENT_HEIGHT / 2;
        this.icon.rotation = Math.PI;
        break;
      default:
        break;
    }

    this.on("mouseenter", this.onMouseOver.bind(this));
    this.on("mouseleave", this.onMouseLeave.bind(this));
  }

  onMouseOver(e) {
    if (e.pressure) return;
    this.icon.alpha = 1;
    animateScale(this.dot, 3);
  }

  onMouseLeave() {
    this.icon.alpha = 0;
    animateScale(this.dot, 1);
  }

  appendTo(parent: Container) {
    parent.addChild(this as unknown as DisplayObject);
  }
}

export default ConnectionPoint;
