import {
  Ticker,
  settings,
  Renderer,
  Container,
  UPDATE_PRIORITY,
} from "pixi.js";
import debounce from "lodash.debounce";
import { Stage as PixiStage } from "@pixi/layers";

import { Observable } from "lib0/observable";

import { DiagramEvents, EditorOptions, ToolType, ViewportState } from "./types";

import { DiagramProvider } from "./services";
import { isValidViewportState } from "./helpers";
import { DEBUG, POWER_PREFERENCE } from "./configs";
import { setDiagramTheme } from "./theme";

import Stage from "./components/Stage";
import Viewport from "./components/Viewport";

settings.RESOLUTION = window.devicePixelRatio;

class Application extends Observable<DiagramEvents> {
  ticker: Ticker;
  renderer: Renderer;
  stage: Stage;
  viewport: Viewport;
  world: Container<any>;
  container: HTMLElement;
  viewportState: ViewportState;
  resetViewport: boolean = true;
  private _currentTool: ToolType = ToolType.SELECT;

  private resizeObserver$: ResizeObserver;

  public get enabled(): boolean {
    return DiagramProvider.enabled;
  }

  public get readonly(): boolean {
    return DiagramProvider.readonly;
  }

  public set readonly(v: boolean) {
    DiagramProvider.readonly = v;
  }

  get screen() {
    return this.renderer.screen;
  }

  public get currentTool(): ToolType {
    return this._currentTool;
  }

  constructor(public options: EditorOptions = {}) {
    super();
    this.stage = new Stage();
    this.world = new PixiStage();
    this.world.name = "World";
    this.renderer = new Renderer({
      antialias: true,
      autoDensity: true,
      backgroundAlpha: 0,
      width: 0,
      height: 0,
      powerPreference: POWER_PREFERENCE,
    });

    this.viewport = new Viewport(
      {
        worldWidth: this.screen.width,
        worldHeight: this.screen.height,
        screenWidth: this.screen.width,
        screenHeight: this.screen.height,
        events: this.renderer.events,
        disableOnContextMenu: true,
      },
      this.renderer,
      this.stage
    );
    this.world.sortableChildren = true;
    this.world.addChild(this.viewport.container);
    DiagramProvider.init(this);
    this.addEventEmitters();
  }


  init(container: HTMLElement) {
    this.container = container;
    this.ticker = new Ticker();
    this.ticker.add(this.render.bind(this), UPDATE_PRIORITY.LOW);
    this.ticker.start();
    this.ticker.speed = 0.5;
    this.container.appendChild(this.renderer.view as unknown as Node);
    this.container.addEventListener("wheel", (e) => e.preventDefault(), {
      passive: false,
    });
    this.renderer.view.addEventListener(
      "webglcontextlost",
      this._onContextLost
    );

    if (DEBUG) {
      globalThis.__PIXI_STAGE__ = this.world;
      globalThis.__PIXI_RENDERER__ = this.renderer;
    }

    this.setupResizeObserver();
    this.render();
  }

  public setRendererViewContainer(container: HTMLElement) {
    this.init(container);
  }

  public setCurrentTool(tool: ToolType) {
    this._currentTool = tool;

    // Clear selections when switching to HAND tool
    if (tool === ToolType.HAND) {
      DiagramProvider.deselectAllInstances();
    }

    // Update cursor based on tool
    if (this.container) {
      const canvas = this.renderer.view as HTMLCanvasElement;
      if (canvas) {
        if (tool === ToolType.SELECT) {
          canvas.style.cursor = 'default';
        } else if (tool === ToolType.HAND) {
          canvas.style.cursor = 'grab';
        }
      }
    }

    // Update viewport tool
    if (this.viewport) {
      this.viewport.setCurrentTool(tool);
    }

    // Emit tool change event
    this.emit(DiagramEvents.tool_change, [tool]);
  }

  public render(): void {
    this.renderer.render(this.world);
  }

  public setupResizeObserver(): void {
    this.resizeObserver$ = new ResizeObserver(
      debounce(() => {
        if (this.renderer.view) {
          const { offsetWidth, offsetHeight } = this.container;
          this.renderer.resize(offsetWidth, offsetHeight);
        }
      }, 200)
    );

    this.resizeObserver$.observe(this.container);
  }

  public setViewport(viewPort) {
    this.viewportState = viewPort;
  }

  public disable() {
    DiagramProvider.enabled = false;
    this.stage.container.eventMode = "none";
  }

  public enable() {
    DiagramProvider.enabled = true;
    this.stage.container.eventMode = "auto";
  }

  public focus(): void {
    if (this.renderer.view) {
      const canvas = this.renderer.view as HTMLCanvasElement;
      canvas.focus();
    }
  }

  public setColorMode(isDark: boolean): void {
    setDiagramTheme(isDark);
    this.viewport?.setColorMode(isDark);
    this.emit(DiagramEvents.theme_change, [isDark]);
  }

  public updateViewport(): void {
    if (isValidViewportState(this.viewportState)) {
      this.viewport.setViewport(this.viewportState);
      this.viewportState = null;
      this.resetViewport = false;
    } else if (this.resetViewport) {
      setTimeout(() => {
        this.viewport.zoomToFit();
        this.resetViewport = false;
      }, 100);
    }
  }

  private addEventEmitters(): void {
    this.viewport.container.on("moved", (e) => {
      this.emit(DiagramEvents.moved, [e, this]);
      // TODO: move to event manager
      window.dispatchEvent(new Event("pixi-tooltip-hide"));
    });

    this.viewport.container.on("moved-end", (e) => {
      this.emit(DiagramEvents.moved_end, [e, this]);
    });

    this.viewport.container.on("zoomed", (e) => {
      this.emit(DiagramEvents.zoomed, [e, this]);
    });

    this.viewport.container.on("zoomed-end", (e) => {
      this.emit(DiagramEvents.zoomed_end, [e, this]);
    });

    window.addEventListener("focus", this._onFocus);
  }

  private _onContextLost = () => {
    window.location.reload();
  };

  private _onFocus = (e) => {
    this.emit(DiagramEvents.focus, []);
  };

  public destroy(): void {
    window.removeEventListener("focus", this._onFocus);
    this.renderer.view?.removeEventListener(
      "webglcontextlost",
      this._onContextLost
    );
    this.ticker?.stop();
    this.stage?.destroy();
    this.viewport?.destroy();
    this.renderer?.destroy(true);
    this.resizeObserver$?.disconnect();
    this.emit(DiagramEvents.destroy, []);
    DiagramProvider.cleanup();
    super.destroy();
  }
}

export default Application;
