import { Key } from "ts-key-enum";
import { Layer } from "@pixi/layers";
import { Observable } from "lib0/observable";
import { VisualizationType } from "@multiplayer/types";
import { Container, DisplayObject, IPoint } from "pixi.js";

import { throttle } from "shared/utils";
import { ClientState, IComponentNodeData } from "shared/models/interfaces";
import { YjsSocketIOProvider } from "integrations/YjsSocketIOProvider";

import Edge from "../Edge";
import NewEdge from "../NewEdge";
import Cursors from "../Cursors";
import GroupNode from "../GroupNode";
import Selection from "../Selection";
import ComponentNode from "../ComponentNode";
import { NodesContainer } from "../Containers";
import { ConnectionPoint } from "../ConnectionPoints";

import { DiagramEvents, ToolType } from "../../types";
import { DiagramProvider } from "../../services";
import { CURSOR_POINTER_THROTTLE } from "../../configs";
import { isCtrlKeyPressed, isMiddleButton } from "../../helpers";

class Stage extends Observable<DiagramEvents> {
  timeout;
  container: Container;
  pressedKeys = new Set<Key>();
  provider: YjsSocketIOProvider;

  newEdge: NewEdge;
  cursors: Cursors;
  selection: Selection;

  // Layers
  baseLayer: Layer;
  frontLayer: Layer;
  // Containers
  overlayContainer: Container;
  instancesContainer: Container;

  edgesContainer: Container;
  nodesContainer: NodesContainer;

  get isCtrlKeyPressed(): boolean {
    return this.pressedKeys.has(Key.Control) || this.pressedKeys.has(Key.Meta);
  }

  get isSpaceKeyPressed(): boolean {
    return this.pressedKeys.has(" " as Key);
  }

  _groups: Map<string, GroupNode> = new Map();
  public get groups(): Map<string, GroupNode> {
    return this._groups;
  }
  public set groups(v: Map<string, GroupNode>) {
    this._groups = v;
  }

  _nodes: Map<string, ComponentNode> = new Map();
  public get nodes(): Map<string, ComponentNode> {
    return this._nodes;
  }
  public set nodes(v: Map<string, ComponentNode>) {
    this._nodes = v;
  }

  _edges: Map<string, Edge> = new Map();
  public get edges(): Map<string, Edge> {
    return this._edges;
  }
  public set edges(v: Map<string, Edge>) {
    this._edges = v;
  }

  constructor() {
    super();
    this.container = new Container();
    this.container.name = "Stage";
    this.container.sortableChildren = true;
    this.container.pivot.set(0, 0);
    this.newEdge = new NewEdge();
    this.selection = new Selection();

    this.overlayContainer = new Container();
    this.overlayContainer.name = "OverlayContainer";

    this.instancesContainer = new Container();
    this.instancesContainer.name = "InstancesContainer";
    this.instancesContainer.sortableChildren = true;

    this.nodesContainer = new NodesContainer();
    this.nodesContainer.name = "NodesContainer";
    this.edgesContainer = new Container();
    this.edgesContainer.name = "EdgesContainer";

    this.edgesContainer.sortableChildren = true;

    this.baseLayer = new Layer();
    this.frontLayer = new Layer();
    this.instancesContainer.addChild(
      this.baseLayer as unknown as DisplayObject
    );
    this.instancesContainer.addChild(
      this.edgesContainer as unknown as DisplayObject
    );
    this.instancesContainer.addChild(
      this.nodesContainer as unknown as DisplayObject
    );
    this.instancesContainer.addChild(
      this.frontLayer as unknown as DisplayObject
    );
    this.container.addChild(
      this.instancesContainer as unknown as DisplayObject
    );
    this.container.addChild(this.overlayContainer as unknown as DisplayObject);

    this.newEdge.appendTo(this.overlayContainer);
    this.selection.appendTo(this.overlayContainer);

    this.addListeners();
  }

  addGroup(group: GroupNode): void {
    this.groups.set(group.id, group);
    this.nodesContainer.addChild(group as unknown as DisplayObject);
  }

  removeGroup(group: GroupNode): void {
    group.destroy();
    group.removeFromParent();
    this.groups.delete(group.id);
  }

  updateNode(data: IComponentNodeData, fromHistory): void {
    const instance = this.nodes.get(data.id);
    if (!instance) {
      console.log("NO INSTANCE !!!", data, this.nodes);
      return;
    }

    const oldGroupId = instance.groupId;
    if (oldGroupId !== data.groupId) {
      const oldGroup = this.groups.get(oldGroupId);
      const newGroup = this.groups.get(data.groupId);
      instance.removeFromParent();
      instance.update(data); // Update the instance data

      if (oldGroup) {
        oldGroup.removeChildNode(instance); // Remove node from old group
      }

      if (newGroup) {
        newGroup.addChildNode(instance);
      } else {
        instance.groupId = null;
        instance.groupNode = null;
        instance.appendTo(this.nodesContainer);
      }
    } else {
      instance.update(data); // Update the instance data
    }
  }

  addNode(node: ComponentNode): void {
    this.nodes.set(node.id, node);
    const group = this.groups.get(node.groupId);
    if (group) {
      group.addChildNode(node as unknown as DisplayObject);
    } else {
      this.nodesContainer.addChild(node as unknown as DisplayObject);
    }
  }

  removeNode(node: ComponentNode): void {
    node.destroy();
    node.removeFromParent();
    if (node.groupNode) {
      node.groupNode.removeChildNode(node);
    }
    this.nodes.delete(node.id);
  }

  addEdge(edge: Edge): void {
    this.edges.set(edge.id, edge);
    this.edgesContainer.addChild(edge as unknown as DisplayObject);
  }

  removeEdge(edge: Edge): void {
    edge.destroy();
    edge.removeFromParent();
    this.edges.delete(edge.id);
  }

  removeNodes(): void {
    this.nodes.clear();
    this.nodesContainer.removeChildren();
  }

  removeEdges(): void {
    this.edges.clear();
    this.edgesContainer.removeChildren();
  }

  removeGroups(): void {
    this.groups.clear();
  }

  cleanup(): void {
    this.removeNodes();
    this.removeEdges();
    this.removeGroups();
  }

  setupPresence(): void {
    this.provider = DiagramProvider.provider;
    if (!this.provider) return;
    this.cursors = new Cursors();
    this.overlayContainer.addChild(
      this.cursors.container as unknown as DisplayObject
    );
    this.provider.awareness.on("change", this.onAwarenessChange);
  }

  createNewEdge(source: ComponentNode, e, direction?) {
    if (this.newEdge.isStarted) return;
    const { global } = e.data;
    const point = DiagramProvider.getViewportPoint(global);
    this.newEdge.start(source, direction, point);
  }

  updateNewEdge(target: ComponentNode, direction) {
    if (!this.newEdge.isStarted) return;
    this.newEdge.setTarget(target, direction);
  }

  private onAwarenessChange = (_, origin: string): void => {
    if (origin === "local") return;
    const { awareness, entityId } = this.provider;
    const states = awareness.getStates();
    const cursors = new Map();
    const focusElements = new Map();

    states.forEach((state: ClientState, key: number) => {
      if (
        state &&
        state.user &&
        state.entityId === entityId &&
        state.viewId === DiagramProvider.viewId &&
        state.visualizationType === VisualizationType.DIAGRAM
      ) {
        if (state.pointer) {
          cursors.set(state.user._id, state);
        }
        if (state.focusedElement) {
          if (!focusElements.has(state.focusedElement)) {
            focusElements.set(state.focusedElement, []);
          }
          focusElements.get(state.focusedElement).push(state);
        }
      }
    });
    this.cursors.update(cursors);
    this.nodes.forEach((node) => {
      node.updatePresence(focusElements.get(node.id));
    });
  };

  private onPointerDown = (e): void => {
    const { originalEvent, global } = e.data;
    if (
      isMiddleButton(originalEvent) ||
      this.isSpaceKeyPressed ||
      DiagramProvider.editor.currentTool === ToolType.HAND) {
      return;
    }
    const point = DiagramProvider.getViewportPoint(global);
    const isMultiselect = isCtrlKeyPressed(e);

    this.selection.start(point, isMultiselect);
  };

  private onPointerUp = (e): void => {
    this.selection.end();
    this.newEdge.end(e);
    this.removeDocumentListeners();
  };

  private onPointerMove = (e): void => {
    const { global } = e.data;
    const point = DiagramProvider.getViewportPoint(global);
    this.selection.update(point, e);
    this.newEdge.update(point);
    this.updateAwareness(point);
  };

  private onDocumentPointer = (e: PointerEvent): void => {
    const point = DiagramProvider.toViewportPoint(e);
    this.selection.update(point, e);
    this.newEdge.update(point);
  };

  private onPointerEnter = (e): void => {
    this.removeDocumentListeners();
  };

  private onPointerLeave = (e): void => {
    if (this.selection.isStarted || this.newEdge.isStarted) {
      this.addDocumentListeners();
    }
    this.updateAwareness(null);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    this.pressedKeys.add(e.key as Key);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.pressedKeys.delete(e.key as Key);
  };

  private onSelectionDone = (points, isMultiselect) => {
    DiagramProvider.selectInstancesByPoint(points, isMultiselect);
  };

  private onEdgeCreationDone = ({
    source,
    sourcePosition,
    targetPoint,
    targetObject,
  }) => {
    const target =
      targetObject instanceof ConnectionPoint
        ? targetObject.parentNode
        : Array.from(this.nodes.values()).find((node) =>
          node.hasPoint(targetPoint)
        );
    if (target) {
      DiagramProvider.editor.emit(DiagramEvents.create_edge, [
        {
          source,
          sourcePosition,
          target,
          targetPosition: targetObject.direction,
        },
      ]);
    }
  };

  private addListeners(): void {
    this.container.on("keyup", this.onKeyUp);
    this.container.on("keydown", this.onKeyDown);
    this.container.on("pointerup", this.onPointerUp);
    this.container.on("pointerdown", this.onPointerDown);
    this.container.on("pointermove", this.onPointerMove);
    this.container.on("pointerenter", this.onPointerEnter);
    this.container.on("pointerleave", this.onPointerLeave);

    this.selection.on(DiagramEvents.selection_end, this.onSelectionDone);
    this.newEdge.on(DiagramEvents.edge_creation_end, this.onEdgeCreationDone);
  }

  private addDocumentListeners(): void {
    document.addEventListener("pointerup", this.onPointerUp);
    document.addEventListener("pointermove", this.onDocumentPointer);
  }

  private removeDocumentListeners(): void {
    document.removeEventListener("pointerup", this.onPointerUp);
    document.removeEventListener("pointermove", this.onDocumentPointer);
  }

  private updateAwareness(point: IPoint | null) {
    if (!this.provider) return;
    if (!point) {
      this.provider.awareness.setLocalStateField("pointer", null);
    } else {
      throttle(() => {
        this.provider.awareness.setLocalStateField("pointer", point);
      }, CURSOR_POINTER_THROTTLE);
    }
  }

  destroy() {
    super.destroy();
    this.container.destroy();
    this.removeDocumentListeners();
  }
}

export default Stage;
