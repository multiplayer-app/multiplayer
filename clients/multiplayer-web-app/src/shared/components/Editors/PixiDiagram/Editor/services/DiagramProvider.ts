import { Shape } from "kld-intersections";
import { Observable } from "lib0/observable";
import { IPoint, Point, Renderer } from "pixi.js";
import {
  NodeState,
  DEFAULT_LAYOUT,
  EdgeDirection,
  PlatformLayout,
  PlatformLayoutMode,
  PlatformLayoutDirection,
} from "@multiplayer/types";

import { areSetsEqual } from "shared/utils";
import { ChangesViewMode, SystemViewTypes } from "shared/models/enums";
import { YjsSocketIOProvider } from "integrations/YjsSocketIOProvider";

import type Edge from "../components/Edge";
import type Stage from "../components/Stage";
import type Viewport from "../components/Viewport";
import type Selection from "../components/Selection";
import type GroupNode from "../components/GroupNode";
import type ComponentNode from "../components/ComponentNode";
import type { PlatformDiagram } from "../Platform";

import { NodesContainer } from "../components";
import { DiagramEvents, PlatformNode } from "../types";
import { boundsToShape, isDroppableInstance } from "../helpers";
import { calculateAutoLayout } from "../utils/auto-layout";
import {
  LAYOUT_SPACINGS,
  COMPONENT_WIDTH,
  COMPONENT_HEIGHT,
  ACTUAL_GRID_SIZE,
} from "../configs";

class DiagramProvider extends Observable<DiagramEvents> {
  editor: PlatformDiagram;
  public maxTextureSize: number = 4096;
  draggingNodes = new Set();
  _groupsDimensions = new Map<string, string>();

  private _viewMode: ChangesViewMode = ChangesViewMode.NONE;
  public get viewMode(): ChangesViewMode {
    return this._viewMode;
  }
  public set viewMode(v: ChangesViewMode) {
    this._viewMode = v;
  }

  private _isDynamicView: boolean;
  public get isDynamicView(): boolean {
    return this._isDynamicView;
  }
  public set isDynamicView(v: boolean) {
    this._isDynamicView = v;
  }

  get isReadonlyView(): boolean {
    return this._isDynamicView || this.viewMode !== ChangesViewMode.NONE;
  }

  private _viewId: string = SystemViewTypes.ALL;
  public get viewId(): string {
    return this._viewId;
  }
  public set viewId(v: string) {
    this._viewId = v;
    this.provider?.awareness.setLocalStateField("viewId", v);
  }

  public selectedEdges: Set<Edge> = new Set();
  public selectedGroups: Set<GroupNode> = new Set();
  public selectedComponents: Set<ComponentNode> = new Set();

  private _provider: YjsSocketIOProvider;
  public get provider(): YjsSocketIOProvider {
    return this._provider;
  }

  public set provider(v: YjsSocketIOProvider) {
    this._provider = v;
    this._provider?.awareness.setLocalStateField("viewId", this.viewId);
  }

  private _stage: Stage;
  public get stage(): Stage {
    return this._stage;
  }

  public set stage(v: Stage) {
    this._stage = v;
  }

  private _renderer: Renderer;
  public set renderer(v: Renderer) {
    this._renderer = v;
    this.maxTextureSize =
      this.renderer?.gl.getParameter(this.renderer.gl.MAX_TEXTURE_SIZE) || 4096;
  }
  public get renderer(): Renderer {
    return this._renderer;
  }

  private _viewport: Viewport;
  public set viewport(v: Viewport) {
    this._viewport = v;
  }
  public get viewport(): Viewport {
    return this._viewport;
  }

  public get nodes(): Map<string, ComponentNode> {
    return this._stage.nodes;
  }

  public get edges(): Map<string, Edge> {
    return this._stage.edges;
  }

  public get groups(): Map<string, GroupNode> {
    return this._stage.groups;
  }

  public get selection(): Selection {
    return this._stage.selection;
  }

  private _readonly: boolean;
  public set readonly(v: boolean) {
    this._readonly = v;
  }
  public get readonly(): boolean {
    return this._readonly || this.isReadonlyView;
  }

  private _enabled: boolean;
  public set enabled(v: boolean) {
    this._enabled = v;
    this.updateEventMode();
  }
  public get enabled(): boolean {
    return this._enabled;
  }

  private _snapGrid: boolean = true;
  public set snapGrid(v: boolean) {
    this._snapGrid = v;
  }
  public get snapGrid(): boolean {
    return this._snapGrid;
  }

  private _layout: PlatformLayout = DEFAULT_LAYOUT;
  public set layout(v: Partial<PlatformLayout>) {
    this._layout = { ...this._layout, ...v };
  }
  public get layout(): PlatformLayout {
    return this._layout;
  }

  public get isEditable(): boolean {
    return this.enabled && !this.readonly;
  }

  public get isAutoLayout(): boolean {
    return this._layout.mode === PlatformLayoutMode.AUTO;
  }

  constructor() {
    super();
    this.on(DiagramEvents.dragging, this.moveSelectedNodes.bind(this));
  }

  init(editor) {
    this.cleanup();
    this.editor = editor;
    this.enabled = true;
    this.stage = editor.stage;
    this.viewport = editor.viewport;
    this.renderer = editor.renderer;
    this.layout = editor.options.layout;
    this.provider = editor.options.provider;
    this.readonly = editor.options.readonly;

    this.stage.setupPresence();
  }

  addNode(target: ComponentNode, direction: EdgeDirection) {
    this.editor.emit(DiagramEvents.add_node, [target, direction]);
  }

  openNode<T>(node: T): void {
    this.editor.emit(DiagramEvents.open_node, [node]);
  }

  selectNode<T>(node: T, isMultiselect: boolean): void {
    this.selectInstances([node], isMultiselect);
  }

  selectNodeById(id: string, isMultiselect: boolean): void {
    const node = this.nodes.get(id);
    this.selectInstances([node], isMultiselect);
  }

  selectEdge(edge: Edge, isMultiselect: boolean): void {
    this.selectInstances([edge], isMultiselect);
  }

  deselectNode(node, isMultiselect: boolean): void {
    this.deselectInstances([node], isMultiselect);
  }

  deselectNodeById(id: string, isMultiselect: boolean): void {
    const node = this.nodes.get(id);
    this.deselectInstances([node], isMultiselect);
  }

  deselectEdge(edge: Edge, isMultiselect?): void {
    this.deselectInstances([edge], isMultiselect);
  }

  selectInstances(instances, isMultiselect?): void {
    if (!isMultiselect) {
      this.deselectAllInstances(false);
    }
    instances.forEach((instance) => {
      instance.isSelected = true;
    });

    this.updateSelectedInstances();
    this.updateHighlightedInstances();
  }

  deselectInstances(instances, isMultiselect?): void {
    if (!isMultiselect) {
      this.deselectAllInstances(false);
    } else {
      instances.forEach((instance) => {
        instance.isSelected = false;
      });
    }
    this.updateSelectedInstances();
    this.updateHighlightedInstances();
  }

  selectAllInstances(): void {
    this.nodes.forEach((node) => {
      if (node.isSelectable) {
        node.isSelected = true;
      }
    });
    this.edges.forEach((edge) => {
      edge.isSelected = true;
    });

    this.groups.forEach((group) => {
      group.isSelected = true;
    });

    this.updateSelectedInstances();
    this.updateHighlightedInstances();
  }

  deselectAllInstances(emit = true): void {
    this.nodes.forEach((node) => {
      node.isHighlighted = true;
      node.isSelected = false;
    });
    this.edges.forEach((edge) => {
      edge.isHighlighted = true;
      edge.isSelected = false;
    });

    this.groups.forEach((group) => {
      group.isHighlighted = true;
      group.isSelected = false;
    });
    if (emit) {
      this.clearSelections(emit);
    }
  }

  clearSelections(emit = true): void {
    this.selectedEdges.clear();
    this.selectedComponents.clear();
    this.selectedGroups.clear();
    if (emit) {
      this.editor.emit(DiagramEvents.selection_done, [[], [], []]);
    }
  }

  updateHighlightedInstances(): void {
    const selectedObjectsSize =
      this.selectedGroups.size + this.selectedComponents.size;
    const isSelected = selectedObjectsSize >= 1;

    for (const group of this.groups.values()) {
      const hasSelectedChild =
        !group.isCollapsed &&
        Array.from(group.childNodes).some((n) => n.isSelected);

      group.isHighlighted = group.isSelected || hasSelectedChild || !isSelected;
    }

    for (const node of this.nodes.values()) {
      const isInHighlightedGroup = node.groupNode?.isSelected || false;
      node.isHighlighted =
        node.isSelected || isInHighlightedGroup || !isSelected;
    }

    if (isSelected) {
      for (const edge of this.edges.values()) {
        edge.isHighlighted = edge.isSelected;
        if (edge.isHighlighted) {
          edge.source.isHighlighted = true;
          edge.target.isHighlighted = true;

          if (edge.source.groupNode) {
            edge.source.groupNode.isHighlighted = true;
          }
          if (edge.target.groupNode) {
            edge.target.groupNode.isHighlighted = true;
          }
        }
      }
    } else {
      for (const edge of this.edges.values()) {
        edge.isHighlighted = true;
      }
    }
  }

  updateSelectedInstances(): void {
    const nodes = Array.from(this.nodes.values()).filter((n) => n.isSelected);
    const edges = Array.from(this.edges.values()).filter((e) => e.isSelected);
    const groups = Array.from(this.groups.values()).filter((e) => e.isSelected);

    const newSelectedComponents = new Set(nodes);
    const newSelectedEdges = new Set(edges);
    const newSelectedGroups = new Set(groups);

    const hasSelectionChanged =
      !areSetsEqual(this.selectedComponents, newSelectedComponents) ||
      !areSetsEqual(this.selectedEdges, newSelectedEdges) ||
      !areSetsEqual(this.selectedGroups, newSelectedGroups);

    if (hasSelectionChanged) {
      this.selectedComponents = newSelectedComponents;
      this.selectedEdges = newSelectedEdges;
      this.selectedGroups = newSelectedGroups;

      this.editor.emit(DiagramEvents.selection_done, [
        nodes.map((n) => n.id),
        groups.map((e) => e.id),
        edges.map((e) => e.id),
      ]);
    }
  }

  selectInstancesByPoint(points, isMultiselect): void {
    const selectionShape = boundsToShape(points);
    const instances = [];

    this.nodes.forEach((node) => {
      if (
        !(isMultiselect && node.isSelected) &&
        node.isIntersects(selectionShape)
      ) {
        instances.push(node);
      }
    });

    this.groups.forEach((node) => {
      if (
        !(isMultiselect && node.isSelected) &&
        node.isIntersects(selectionShape)
      ) {
        instances.push(node);
      }
    });

    this.edges.forEach((edge) => {
      if (
        !(isMultiselect && edge.isSelected) &&
        edge.isIntersects(selectionShape)
      ) {
        instances.push(edge);
      }
    });

    this.selectInstances(instances, isMultiselect);
  }

  findAndUpdateGroup(e, target): void {
    if (!e || e.defaultPrevented) {
      return;
    }
    const point = this.toViewportPoint(e);

    const group = Array.from(this.groups.values()).find((g) =>
      g.hasPoint(point)
    );

    const diff = { x: 0, y: 0 };

    if (group) {
      if (target.parent !== group.nodesContainer) {
        diff.x = target.x - point.x;
        diff.y = target.y - point.y;
        const newPos = {
          x: point.x - group.x - group.nodesContainer.x + diff.x,
          y: point.y - group.y - group.nodesContainer.y + diff.y,
        };

        target.position.set(newPos.x, newPos.y);
        target.appendTo(group.nodesContainer);
      }
    } else {
      if (target.parent !== this.stage.nodesContainer) {
        diff.x = target.x - point.x;
        diff.y = target.y - point.y;
        const newPos = {
          x: point.x,
          y: point.y,
        };
        target.position.set(newPos.x, newPos.y);
        target.appendTo(this.stage.nodesContainer);
      }
    }
  }

  getDropTargetGroup(e, target): GroupNode | null {
    if (!isDroppableInstance(target)) return;
    const point = this.toViewportPoint(e);
    const group = Array.from(this.groups.values()).find(
      (g) => g !== target && target.groupId !== g.id && g.hasPoint(point)
    );
    return group;
  }

  moveNodesToTheGroup(targetNode, groupNode: GroupNode) {
    const newPosition: NodeState = {
      x: targetNode.x - groupNode.x - 16,
      y: targetNode.y - groupNode.y - 60,
    };
    if (targetNode.isSelected) {
      // Move all selected items to the group
      const positions = [];
      const components = [];
      Array.from(this.selectedComponents).forEach((node, index) => {
        components.push(node.id);
        positions.push({
          x: newPosition.x,
          y:
            newPosition.y +
            node.getLocalBounds().height +
            groupNode.nodesContainer.rowGap,
        });
      });
      this.editor.addComponentToGroup(groupNode.id, components, positions);
    } else {
      this.editor.addComponentToGroup(
        groupNode.id,
        [targetNode.id],
        [newPosition]
      );
    }
    this.deselectAllInstances(true);
  }

  moveSelectedNodes(e, target): void {
    if (!e || e.defaultPrevented || !e.preventDefault) {
      return;
    }
    const totalSize = this.selectedComponents.size + this.selectedGroups.size;
    if (target.isSelected && totalSize > 1) {
      // Prevent Default to avoid triggering move event infinitely
      e.preventDefault();
      this.selectedComponents.forEach((node) => {
        if (
          node !== target &&
          node.groupNode !== target &&
          !node.groupNode?.isSelected
        )
          node.move(e);
      });

      this.selectedGroups.forEach((node) => {
        if (node !== target && target.groupNode !== node) node.move(e);
      });
    }
  }

  handleDragEnd(event: PointerEvent, target): void {
    const targetGroup = this.getDropTargetGroup(event, target);
    if (target.isSelected) {
      this.selectedComponents.forEach((node) => {
        node.dragEnd();
      });
      this.selectedGroups.forEach((node) => {
        node.dragEnd();
      });

      if (targetGroup) {
        this.moveNodesToTheGroup(target, targetGroup);
      } else {
        if (this.isAutoLayout || target.groupId) {
          this.rearrangeNodesOnDragEnd(target);
        } else {
          this.selectedComponents.forEach((node) => {
            node.moveToSnapGrid();
          });
          this.selectedGroups.forEach((node) => {
            node.moveToSnapGrid();
          });
        }
      }
    } else {
      target.dragEnd();
      if (targetGroup) {
        this.moveNodesToTheGroup(target, targetGroup);
      } else {
        if (this.isAutoLayout || target.groupId) {
          this.rearrangeNodesOnDragEnd(target);
        } else {
          target.moveToSnapGrid();
        }
      }
    }
  }

  getViewportPoint(point: IPoint): IPoint {
    return this.viewport.viewportPoint(point) || point;
  }

  toViewportPoint(event: MouseEvent): IPoint {
    return this.viewport.screenToViewportPoint(event);
  }

  getNearbyPosition(
    parentNode: ComponentNode | null,
    parentGroup: GroupNode | null,
    direction: EdgeDirection,
    nodesCount: number,
    refComponent?: ComponentNode
  ): Point {
    const { COLUMN_GAP: colGap, ROW_GAP: rowGap } =
      LAYOUT_SPACINGS[this.layout.direction];
    const grid = ACTUAL_GRID_SIZE;

    let baseX = 0;
    let baseY = 0;

    if (refComponent) {
      const refBounds = refComponent.getRealBounds(false);

      switch (direction) {
        case EdgeDirection.right:
          baseX = refBounds.x + refBounds.width + colGap;
          baseY = refBounds.y;
          break;
        case EdgeDirection.left:
          baseX = refBounds.x - COMPONENT_WIDTH - colGap;
          baseY = refBounds.y;
          break;
        case EdgeDirection.top:
          baseX = refBounds.x;
          baseY = refBounds.y - COMPONENT_HEIGHT - rowGap;
          break;
        case EdgeDirection.bottom:
        default:
          baseX = refBounds.x;
          baseY = refBounds.y + refBounds.height + rowGap;
          break;
      }

      baseX = Math.round(baseX / grid) * grid;
      baseY = Math.round(baseY / grid) * grid;

      return this.findEmptySpot(baseX, baseY, nodesCount);
    }

    if (parentNode) {
      const bounds = parentNode.getRealBounds(false);

      switch (direction) {
        case EdgeDirection.right:
          baseX = bounds.x + bounds.width + colGap;
          baseY = bounds.y;
          break;
        case EdgeDirection.left:
          baseX = bounds.x - COMPONENT_WIDTH - colGap;
          baseY = bounds.y;
          break;
        case EdgeDirection.top:
          baseX = bounds.x;
          baseY = bounds.y - COMPONENT_HEIGHT - rowGap;
          break;
        case EdgeDirection.bottom:
        default:
          baseX = bounds.x;
          baseY = bounds.y + bounds.height + rowGap;
          break;
      }

      if (parentGroup) {
        baseX -= parentGroup.x + parentGroup.nodesContainer.x;
        baseY -= parentGroup.y + parentGroup.nodesContainer.y;
      }

      baseX = Math.round(baseX / grid) * grid;
      baseY = Math.round(baseY / grid) * grid;

      return this.findEmptySpot(baseX, baseY, nodesCount);
    }

    if (parentGroup) {
      baseX = parentGroup.x + parentGroup.width + colGap;
      baseY = parentGroup.y;

      baseX = Math.round(baseX / grid) * grid;
      baseY = Math.round(baseY / grid) * grid;
      console.log(baseX, baseY);

      return this.findEmptySpot(baseX, baseY, nodesCount);
    }

    // if (this.isAutoLayout) {
    const { direction: layoutDirection } = this.layout;
    const nodes = this.stage.nodesContainer.children as PlatformNode[];

    if (layoutDirection === PlatformLayoutDirection.HORIZONTAL) {
      const minX = 0;
      const maxYInFirstColumn = Math.max(
        0,
        ...nodes
          .filter((node) => node.x === minX)
          .map((node) => node.y + node.getRealBounds().height)
      );

      baseX = minX;
      baseY = maxYInFirstColumn + rowGap;
    } else {
      const minY = 0;
      const maxXInFirstRow = Math.max(
        0,
        ...nodes
          .filter((node) => node.y === minY)
          .map((node) => {
            return node.x + node.getRealBounds().width;
          })
      );

      baseX = maxXInFirstRow + colGap;
      baseY = minY;
    }

    baseX = Math.round(baseX / grid) * grid;
    baseY = Math.round(baseY / grid) * grid;
    const spot = this.findEmptySpot(baseX, baseY, nodesCount);

    return spot;
    // }

    // const center = this.viewport.center;

    // baseX = Math.round(center.x / grid) * grid;
    // baseY = Math.round(center.y / grid) * grid;

    // return this.findEmptySpot(baseX, baseY, nodesCount);
  }

  findEmptySpot(x: number, y: number, nodesCount: number) {
    const { COLUMN_GAP, ROW_GAP } = LAYOUT_SPACINGS[this.layout.direction];
    const grid = ACTUAL_GRID_SIZE;
    let width = COMPONENT_WIDTH;
    let height = COMPONENT_HEIGHT;
    let newX = x;
    let newY = y;

    if (this.layout.direction === PlatformLayoutDirection.HORIZONTAL) {
      height = COMPONENT_HEIGHT * nodesCount + (nodesCount - 1) * ROW_GAP;
      newY = y + grid;
    } else {
      width = COMPONENT_WIDTH * nodesCount + (nodesCount - 1) * COLUMN_GAP;
      newX = x + grid;
    }

    const selectionShape = boundsToShape({
      x: x - grid,
      y: y - grid,
      width: width + grid,
      height: height + grid,
    });

    if (this.hasNonIntersectingNode(selectionShape)) {
      return new Point(x, y);
    }

    return this.findEmptySpot.call(this, newX, newY, nodesCount);
  }

  hasNonIntersectingNode(shape: Shape, offset: number = 0) {
    return !this.stage.nodesContainer.children.some((node) => {
      return (node as PlatformNode).isIntersects(shape, offset);
    });
  }

  updateEventMode() {
    if (!this.viewport) return;
    if (this.enabled) {
      this.viewport.container.eventMode = "static";
    } else {
      this.viewport.container.eventMode = "none";
    }
  }

  cleanup(): void {
    this.selectedComponents = new Set();
    this.selectedEdges = new Set();
    this.selectedGroups = new Set();

    this.stage?.cleanup();
  }

  isGroupDimensionChanged(node: GroupNode) {
    const { width, height } = node.getLocalBounds();
    const newD = `${width}x${height}`;
    const prevD = this._groupsDimensions.get(node.id);
    this._groupsDimensions.set(node.id, newD);

    return newD !== prevD;
  }

  rearrangeNodesOnMove(node): void {
    const container = node.parent;
    if (container instanceof NodesContainer) {
      const isInGroup = !!node.groupNode;
      calculateAutoLayout(
        node.parent,
        this.stage.edgesContainer,
        this.editor.yDocManager,
        {
          sync: true,
          animate: true,
          snapGrig: !isInGroup,
          layout: this.layout,
        }
      );
    }
  }

  async rearrangeNodesOnDragEnd(node): Promise<void> {
    const container = node.parent;
    if (container instanceof NodesContainer) {
      const isInGroup = !!node.groupNode;
      await calculateAutoLayout(
        container,
        this.stage.edgesContainer,
        this.editor.yDocManager,
        {
          animate: true,
          layout: this.layout,
          sync: this.isEditable,
          snapGrig: !isInGroup,
        }
      );
      if (
        node.groupId &&
        node.groupNode &&
        this.isAutoLayout &&
        this.isGroupDimensionChanged(node.groupNode)
      ) {
        this.rearrangeNodesOnDragEnd(node.groupNode);
      }
    }
  }

  async updateContainerLayout(
    container: NodesContainer,
    animate: boolean,
    isGroupContainer: boolean
  ): Promise<void> {
    if (container instanceof NodesContainer) {
      await calculateAutoLayout(
        container,
        this.stage.edgesContainer,
        this.editor.yDocManager,
        {
          animate,
          sync: this.isEditable,
          layout: this.layout,
          snapGrig: !isGroupContainer,
        }
      );
    }
  }

  moveNearbyNodes(target: GroupNode, deltaX, deltaY) {
    // TODO: Nice to have feature. Implement later :D
  }

  cacheAsBitmap(value: boolean, node: any) {
    if (!node) return;
    if (value) {
      const bounds = node.getLocalBounds();
      node.cacheAsBitmap =
        bounds.width <= this.maxTextureSize &&
        bounds.height <= this.maxTextureSize;
    } else {
      node.cacheAsBitmap = false;
    }
  }
}

let diagramProvider = new DiagramProvider();

export const resetDiagramProvider = () => {
  diagramProvider = new DiagramProvider();
};

export default diagramProvider;
