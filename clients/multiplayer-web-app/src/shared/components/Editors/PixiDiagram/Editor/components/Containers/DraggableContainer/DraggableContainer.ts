import * as Y from "yjs";
import throttle from "lodash.throttle";
import { NodeState, Position } from "@multiplayer/types";
import { FederatedPointerEvent } from "pixi.js";

import { DiagramProvider } from "../../../services";
import { animatePosition } from "../../../utils/animations";
import { ACTUAL_GRID_SIZE, SYNC_THROTTLING } from "../../../configs";

import SelectableContainer from "../SelectableContainer";

import type GroupNode from "../../GroupNode";
import type YDocManager from "../../../YDocManager";
import { sanitizeNumber } from "../../../utils";
import debounce from "lodash.debounce";

let INITIAL_Z = 10;
class DraggableContainer<T> extends SelectableContainer {
  groupId: string;
  groupNode: GroupNode;

  private _moveTimeout: any;
  private _dragEnabled: boolean;
  private _dragStart: boolean = false;
  private _previousCursor: string;
  _dragging: boolean = false;

  public get dragging(): boolean {
    return this._dragging;
  }
  public set dragging(v: boolean) {
    if (v !== this._dragging) {
      this._dragging = v;
      this.parentLayer = v ? DiagramProvider.stage.frontLayer : null;
      this.onDragStateChange(v);
    }
  }
  // Drag start property
  public get dragStart(): boolean {
    return this._dragStart;
  }

  public set dragStart(v: boolean) {
    if (v !== this._dragStart) {
      this._dragStart = v;
      this.onDragStateChange(v);
      // TODO: move to event manager
      window.dispatchEvent(new Event("pixi-tooltip-hide"));
    }
  }

  // Drag enabled property
  get dragEnabled(): boolean {
    return this._dragEnabled;
  }
  set dragEnabled(v: boolean) {
    this._dragEnabled = v;
  }

  // Snap to grid property
  get snapGrid(): boolean {
    return DiagramProvider.snapGrid;
  }

  // Position observable
  private _state$: Y.Map<any>;
  get state$(): Y.Map<any> {
    return this._state$ || null;
  }

  set state$(v: Y.Map<any>) {
    this._state$ = v;
    if (this.state$) {
      this.state$.observe(this.stateObserver);
      this.state = {
        x: this.state$.get("x"),
        y: this.state$.get("y"),
      };
    }
  }

  get state() {
    return {
      x: this.position.x,
      y: this.position.y,
    };
  }

  set state(v) {
    this.position.set(sanitizeNumber(v.x), sanitizeNumber(v.y));
  }

  constructor(
    private options: {
      id: string;
      state: NodeState;
      yManager?: YDocManager;
    }
  ) {
    super();
    this.eventMode = "static";
    this.dragEnabled = DiagramProvider.isEditable && !DiagramProvider.readonly;
    this.state$ = options.yManager?.states$?.get(options.id) || null;

    // Initialize position
    this.state = { x: options.state?.x, y: options.state?.y };
    // Attach event listeners
    this.on("pointerdown", this.onDragStart);
  }

  onDragStart = (event: FederatedPointerEvent): void => {
    event.stopPropagation();
    this.stopCapturing();
    if (!this.dragEnabled || event.button || DiagramProvider.readonly) return;

    this.dragStart = true;
    this.zIndex = INITIAL_Z += 1;
    this._previousCursor = this.cursor;
    this.cursor = "grabbing";
    document.addEventListener("pointerup", this.onDragEnd);
    document.addEventListener("pointermove", this.onDragMove);
    this.emit("drag-start", null);
  };

  move = (event: PointerEvent): void => {
    if (!this.dragEnabled) return;

    const scaled = DiagramProvider.viewport.scaled;
    this.dragging = true;

    const newState = {
      x: this.state.x + event.movementX / scaled,
      y: this.state.y + event.movementY / scaled,
    };

    if (newState.x !== this.state.x || newState.y !== this.state.y) {
      this.state = newState;
      this.emit("updated", event);
      this.syncStateThrottle(newState);
    }
  };

  dragEnd = () => {
    this.dragging = false;
    this.dragStart = false;
  };

  onDragMove = (event: PointerEvent): void => {
    if (this.dragStart) {
      this.move(event);
      DiagramProvider.moveSelectedNodes(event, this);
      this.onMoveStoppedDebounce(event, this);
    }
  };

  onDragEnd = async (event: PointerEvent): Promise<void> => {
    clearTimeout(this._moveTimeout);
    this.syncStateThrottle.cancel();
    this.cursor = this._previousCursor ?? "default";
    this.zIndex = INITIAL_Z += 1;
    document.removeEventListener("pointerup", this.onDragEnd);
    document.removeEventListener("pointermove", this.onDragMove);
    this.releaseCapturing();
    this.dragStart = false;
    if (!this.dragging) return;
    DiagramProvider.handleDragEnd(event, this);
  };

  moveTo = (newState: Position) => {
    this.syncState(newState);
    animatePosition(this.position, newState, 200, true, () => {
      this.emit("updated");
    });
  };

  moveBy = (deltaX: number, deltaY: number) => {
    const newState = { x: this.x + deltaX, y: this.y + deltaY };
    this.moveTo(newState);
  };

  moveToSnapGrid() {
    const { x, y } = this.state;
    const roundedPos = {
      x: this.getRoundedGridPoint(x),
      y: this.getRoundedGridPoint(y),
    };

    this.syncStateThrottle(roundedPos);

    animatePosition(this.position, roundedPos, 100, true, () => {
      this.emit("updated");
    });
  }

  syncState(newState: Partial<NodeState>): void {
    if (this.destroyed || !this.options.yManager || !this.state$) {
      return;
    }

    const currentState = this.state$.toJSON();
    const hasChanges = Object.entries(newState).some(
      ([key, value]) => currentState[key] !== value
    );

    if (hasChanges) {
      this.options.yManager.transact(() => {
        Object.entries(newState).forEach(([key, value]) =>
          this.state$.set(key, value)
        );
      });
    }
  }

  onDragStateChange(state: boolean): void {
    // Placeholder for handling drag state changes
  }

  destroy() {
    this.off("pointerdown", this.onDragStart);
    this.state$?.unobserve(this.stateObserver);
    document.removeEventListener("pointerup", this.onDragEnd);
    document.removeEventListener("pointermove", this.onDragMove);

    super.destroy();
  }

  private stateObserver = (_, tr): void => {
    if (!this.state$ || tr.local) {
      return;
    }
    const newState = this.state$.toJSON();
    animatePosition(this.position, newState, SYNC_THROTTLING, true, () => {
      this.emit("updated", origin);
    });
  };

  private getRoundedGridPoint(c: number): number {
    return Math.round(c / ACTUAL_GRID_SIZE) * ACTUAL_GRID_SIZE;
  }

  private stopCapturing(): void {
    if (this.options.yManager?.undoManager) {
      this.options.yManager.undoManager.stopCapturing();
      this.options.yManager.undoManager.captureTimeout = Infinity;
    }
  }

  private releaseCapturing(): void {
    if (this.options.yManager?.undoManager) {
      this.options.yManager.undoManager.captureTimeout = 500;
    }
  }

  private syncStateThrottle = throttle((newState) => {
    this.syncState(newState);
  }, SYNC_THROTTLING);

  private onMoveStoppedDebounce = debounce(
    (event: PointerEvent, originalTarget: any) => {
      if (
        (!this.groupId && !DiagramProvider.isAutoLayout) ||
        DiagramProvider.getDropTargetGroup(event, originalTarget)
      ) {
        return;
      }

      DiagramProvider.rearrangeNodesOnMove(this);
    },
    200
  );
}

export default DraggableContainer;
