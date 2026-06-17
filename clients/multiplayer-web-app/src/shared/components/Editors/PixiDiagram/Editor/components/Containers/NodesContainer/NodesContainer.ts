import { Container } from "pixi.js";
import { COLUMN_GAP, ROW_GAP } from "../../../configs";

class NodesContainer extends Container {
  rowGap = ROW_GAP;
  colGap = COLUMN_GAP;
  constructor() {
    super();
    this.sortableChildren = true;
  }
}

export default NodesContainer;
