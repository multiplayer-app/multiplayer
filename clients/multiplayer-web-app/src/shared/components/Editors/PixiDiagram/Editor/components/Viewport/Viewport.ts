import { IViewportOptions, Viewport as PixiViewport } from "pixi-viewport";
import {
  Point,
  IPoint,
  Container,
  IPointData,
  TilingSprite,
  DisplayObject,
} from "pixi.js";
import Stage from "../Stage";
import Background from "./Background";
import { isValidViewportState, roundDecimal } from "../../helpers";
import { GRID_SIZE, MAX_ZOOM, MIN_ZOOM } from "../../configs";
import { ToolType } from "../../types";

class Viewport {
  public container: PixiViewport;
  public backgroundSprite: TilingSprite;
  private currentTool: ToolType = ToolType.SELECT;
  private isDarkMode: boolean = false;

  public get scaled(): number {
    return this.container?.transform?.scale?.x || 1;
  }

  public get center(): Point {
    return this.container.center;
  }

  public setCurrentTool(tool: ToolType) {
    this.currentTool = tool;
    this.updateDragMode();
  }

  constructor(
    private options: IViewportOptions,
    private renderer,
    private stage: Stage
  ) {
    this.container = new PixiViewport(options);
    this.container.name = "PixiViewport";
    this.renderer.on("resize", this.resize);
    this.container
      .on("added", this.drawBackground)
      .on("pointerup", this.onPointerUp)
      .on("pointerdown", this.onPointerDown)
      .on("pointermove", this.onPointerMove)
      .on("pointerenter", this.onPointerEnter)
      .on("pointerleave", this.onPointerLeave);

    document.addEventListener("keyup", this.onKeyUp);
    document.addEventListener("keydown", this.onKeyDown);

    this.container
      .drag({
        clampWheel: false,
        mouseButtons: "middle-right",
      })
      .wheel({
        lineHeight: 5,
        wheelZoom: false,
        trackpadPinch: true,
      })
      .decelerate({
        friction: 0.8,
      })
      .clampZoom({
        minScale: MIN_ZOOM,
        maxScale: MAX_ZOOM,
      })
      .pinch({});

    this.container.addChild(stage.container as unknown as DisplayObject);
  }

  drawBackground = (parent: Container): void => {
    this.backgroundSprite = new TilingSprite(
      this.renderer.generateTexture(
        new Background({ dotSize: 1, gridSize: GRID_SIZE })
      ),
      this.options.screenWidth,
      this.options.screenHeight
    );
    this.backgroundSprite.zIndex = -1;

    parent.addChild(this.backgroundSprite as unknown as DisplayObject);

    this.container.on("moved", () => {
      this.updateBackground();
    });
  };

  setColorMode = (isDark: boolean): void => {
    if (this.isDarkMode === isDark) return;
    this.isDarkMode = isDark;
    if (!this.backgroundSprite) return;
    this.backgroundSprite.texture = this.renderer.generateTexture(
      new Background({ dotSize: 1, gridSize: GRID_SIZE })
    );
    this.updateBackground();
  };

  globalPoint(point: IPoint): IPointData {
    const global = this.container.toGlobal(point);
    return {
      x: global.x,
      y: global.y,
    };
  }

  viewportSize(): {
    width: number;
    height: number;
    screenWidth: number;
    screenHeight: number;
  } {
    return {
      width: this.container.worldWidth,
      height: this.container.worldHeight,
      screenWidth: this.container.screenWidth,
      screenHeight: this.container.screenHeight,
    };
  }

  screenToViewportPoint = (event: MouseEvent): IPoint => {
    const { pageX, pageY } = event;
    const { top, left } = this.renderer.view.getBoundingClientRect();
    const worldPoint = this.container.toWorld({
      x: pageX - left,
      y: pageY - top,
    });
    const calibration = 1 / this.container.scaled;

    worldPoint.x = roundDecimal(worldPoint.x - calibration);
    worldPoint.y = roundDecimal(worldPoint.y - calibration);

    return worldPoint;
  };

  viewportPoint = (point: IPoint): IPoint => {
    const worldPoint = this.container.toWorld(point);
    const calibration = 1 / this.container.scaled;

    worldPoint.x = roundDecimal(worldPoint.x - calibration);
    worldPoint.y = roundDecimal(worldPoint.y - calibration);
    return worldPoint;
  };

  viewportScale = (): number => {
    return this.container.scaled;
  };

  destroy = () => {
    this.container.destroy();
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
  };

  setViewport = (state: { x: number; y: number; scale: number }) => {
    if (
      !isValidViewportState(state) ||
      !this.container?.transform ||
      this.container.destroyed
    )
      return;
    const { x, y, scale } = state;
    const c = this.container.center;
    this.container.moveCenter(c.x - x, c.y - y);
    this.container.setZoom(scale);
    this.updateBackground();
  };

  setCorner = ({ x, y, scale }: { x: number; y: number; scale: number }) => {
    const c = this.container;
    this.container.moveCorner(c.x + x, c.y + y);
    this.container.setZoom(scale);
    this.updateBackground();
  };

  resetZoom = (keepZoom = false) => {
    requestAnimationFrame(() => {
      if (!this.container.destroyed) {
        const prevZoom = this.container.scaled;
        const zoom = keepZoom ? prevZoom : 1;
        this.container.fitWidth();
        this.container.setZoom(zoom);

        const offset = 50;
        const bounds = this.stage.container.getBounds();

        const cX = (bounds.x - offset - this.container.x) / zoom;
        const cY = (bounds.y - offset - this.container.y) / zoom;

        this.container.moveCorner(cX, cY);
        if (!keepZoom) {
          this.triggerMoveAndZoom();
        }
      }
    });
  };

  getFitZoom(offset = 0): number {
    const wh = this.container.worldHeight;
    const ww = this.container.worldWidth;
    const bounds = this.stage.container.getBounds();
    return Math.min(
      Math.min(
        ww / (bounds.width + offset * 2),
        wh / (bounds.height + offset * 2)
      ),
      1
    );
  }

  zoomToFit = (): void => {
    if (this.container.destroyed) return;
    const offset = 50;
    this.container.fitWidth();
    const zoom = this.getFitZoom(offset);
    this.container.setZoom(zoom);

    const bounds = this.stage.container.getBounds();
    const wh = this.container.worldHeight;
    const ww = this.container.worldWidth;
    const wd = (ww - bounds.width - offset * 2) / 2;
    const hd = (wh - bounds.height - offset * 2) / 2;

    const cX = (bounds.x - this.container.x - wd) / zoom - offset;
    const cY = (bounds.y - this.container.y - hd) / zoom - offset;

    this.container.moveCorner(cX, cY);
    this.triggerMoveAndZoom();
  };

  setZoom = (scale: number): void => {
    this.container.setZoom(scale);
    this.triggerMoveAndZoom();
  };

  zoomIn = (): void => {
    this.container.setZoom(this.container.scaled + 0.1);
    this.triggerMoveAndZoom();
  };

  zoomOut = (): void => {
    this.container.setZoom(this.container.scaled - 0.1);
    this.triggerMoveAndZoom();
  };

  private triggerMoveAndZoom = (): void => {
    this.container.emit("moved", { viewport: this.container, type: "wheel" });
    this.container.emit("zoomed", { viewport: this.container, type: "wheel" });
  };

  private onPointerUp = (e): void => {
    this.stage.container.emit("pointerup", e);
    if (this.currentTool === ToolType.HAND) {
      this.renderer.view.style.cursor = "grab";
    } else if (!this.stage.isSpaceKeyPressed) {
      this.renderer.view.style.cursor = "initial";
    }
  };

  private onPointerDown = (e): void => {
    this.stage.container.emit("pointerdown", e);
    if (this.currentTool === ToolType.HAND) {
      this.renderer.view.style.cursor = "grabbing";
    } else if (e.button) {
      this.renderer.view.style.cursor = "grab";
    }
  };

  private onPointerMove = (e): void => {
    this.stage.container.emit("pointermove", e);
  };

  private onPointerEnter = (e): void => {
    this.stage.container.emit("pointerenter", e);
    if (this.currentTool === ToolType.HAND) {
      this.renderer.view.style.cursor = "grab";
    }
  };

  private onPointerLeave = (e): void => {
    this.stage.container.emit("pointerleave", e);
  };

  private onKeyDown = (e): void => {
    if (e.repeat) return;
    this.stage.container.emit("keydown", e);
    this.updateDragMode();
  };

  private onKeyUp = (e): void => {
    this.stage.container.emit("keyup", e);
    this.updateDragMode();
  };

  private resize = (width: number, height: number) => {
    this.container.resize(width, height, width, height);
    this.backgroundSprite.width = width;
    this.backgroundSprite.height = height;
  };

  private updateDragMode(): void {
    if (this.currentTool === ToolType.HAND || this.stage.isSpaceKeyPressed) {
      this.renderer.view.style.cursor = "grab";
      this.stage.container.eventMode = "none";
      this.stage.container.interactiveChildren = false;
      this.container.drag({ clampWheel: false, mouseButtons: "all" });
    } else {
      this.renderer.view.style.cursor = "initial";
      this.stage.container.eventMode = "static";
      this.stage.container.interactiveChildren = true;
      this.container.drag({ clampWheel: false, mouseButtons: "middle-right" });
    }
  }

  private updateBackground(): void {
    const { scaled, x, y } = this.container;
    this.backgroundSprite.tileScale.set(scaled, scaled);
    this.backgroundSprite.tilePosition.set(x, y);
  }
}

export default Viewport;
