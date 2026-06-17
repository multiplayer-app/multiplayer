import * as Y from "yjs";
import debounce from "lodash.debounce";
import { EntityConverter } from "@multiplayer/entity";
import {
  Platform,
  EntityType,
  EdgePosition,
  EdgeDirection,
  PlatformLayout,
  PlatformMetadata,
  VisualizationType,
  PlatformLayoutMode,
  NodeState,
} from "@multiplayer/types";

import { newEdge } from "shared/helpers/diagram.helpers";
import { EntityWithMeta } from "shared/models/interfaces";
import { isInputElement } from "shared/utils";
import { ChangesViewMode, SystemViewTypes } from "shared/models/enums";

import {
  getOffsetPoint,
  getClipboardData,
  getPlatformEdges,
  getPlatformGroups,
  createPlatformNodes,
  getPlatformComponents,
} from "../utils/getPlatformInstances";
import { IDataDiff, DiagramEvents, EditorOptions } from "../types";

import Application from "../Application";
import YDocManager from "../YDocManager";

import Edge from "../components/Edge";
import GroupNode from "../components/GroupNode";
import ComponentNode from "../components/ComponentNode";

import { DiagramProvider, resetDiagramProvider } from "../services";
import { getPlatformDiff } from "../utils/getPlatformDiff";
import { calculateAutoLayout } from "../utils/auto-layout";
import { isIgnorableTransaction } from "../helpers";
import { getDefaultEdgePosition } from "../utils/edges/general";
import { getCombinedGraphLayout, GraphNode } from "../utils/visualizations";

class PlatformDiagram extends Application {
  doc: Y.Doc;
  dataDiff: IDataDiff;
  yDocManager: YDocManager;
  markAsDeleted: boolean = true;

  private preselected: Set<string> = new Set();

  private _platformComponents: Map<string, EntityWithMeta> = null;
  public get platformComponents(): Map<string, EntityWithMeta> {
    return this._platformComponents;
  }
  public set platformComponents(v: Map<string, EntityWithMeta>) {
    this._platformComponents = v;
    this.syncChangesDebounce(false);
  }

  private _baseContent: Platform = null;
  public get baseContent(): Platform {
    return this._baseContent;
  }
  public set baseContent(v: Platform) {
    if (this._baseContent === v) return;
    this._baseContent = v;
    this.syncChangesDebounce(true);
  }

  public get currentViewId(): string {
    return this.yDocManager.currentViewId;
  }

  public set currentViewId(v: string) {
    this.yDocManager.currentViewId = v;
    this.resetViewport = true;
    DiagramProvider.viewId = v;
    DiagramProvider.isDynamicView = this.yDocManager.isDynamicView;
  }

  public get viewMode(): ChangesViewMode {
    return DiagramProvider.viewMode;
  }

  public set viewMode(v: ChangesViewMode) {
    if (DiagramProvider.viewMode === v) return;
    DiagramProvider.viewMode = v;
    this.syncChangesDebounce(false);
  }

  public get layout(): PlatformLayout {
    return DiagramProvider.layout;
  }
  public get selectedComponents(): Set<ComponentNode> {
    return DiagramProvider.selectedComponents;
  }
  public get selectedGroups(): Set<GroupNode> {
    return DiagramProvider.selectedGroups;
  }
  public get selectedEdges(): Set<Edge> {
    return DiagramProvider.selectedEdges;
  }

  public get edgesRefs(): Map<string, Edge> {
    return this.stage.edges;
  }
  public get componentsRefs(): Map<string, ComponentNode> {
    return this.stage.nodes;
  }
  public get groupsRefs(): Map<string, GroupNode> {
    return this.stage.groups;
  }

  constructor(options: EditorOptions = {}) {
    super(options);

    this.initEditor();
  }

  selectComponent(id: string, isMultiselect: boolean) {
    DiagramProvider.selectNodeById(id, isMultiselect);
  }

  deselectComponent(id: string, isMultiselect: boolean) {
    DiagramProvider.deselectNodeById(id, isMultiselect);
  }

  setLayout = (layout: Partial<PlatformLayout>) => {
    const newLayout = { ...this.yDocManager.metadata.layout, ...layout };
    this.yDocManager.setMetadataProp("layout", newLayout);
  };

  forceLayout = async () => {
    await calculateAutoLayout(
      this.stage.nodesContainer,
      this.stage.edgesContainer,
      this.yDocManager,
      {
        sync: true,
        layout: {
          ...this.layout,
          mode: PlatformLayoutMode.MANUAL,
        },
      }
    );
    this.syncEdges();
    this.resetViewportOnAutoLayout();
  };

  private switchLayout = async (oldLayout) => {
    const promises = [];
    const { nodesContainer, edgesContainer } = this.stage;

    nodesContainer.children.forEach((g) => {
      if (g instanceof GroupNode && !g.isCollapsed) {
        promises.push(
          calculateAutoLayout(g.nodesContainer, null, this.yDocManager, {
            sync: true,
            layout: this.layout,
            oldLayout,
          })
        );
      }
    });

    await Promise.all(promises);
    await calculateAutoLayout(
      nodesContainer,
      edgesContainer,
      this.yDocManager,
      { sync: true, layout: this.layout, oldLayout }
    );
    this.syncEdges();
    this.resetViewportOnAutoLayout();
  };

  setCurrentViewId = (viewId: string) => {
    if (!viewId || this.currentViewId === viewId) return;

    // Unobserve previous position listener
    this.yDocManager.unobserve(
      this.yDocManager.states$,
      this.syncObserverHandler
    );

    this.currentViewId = viewId;

    this.yDocManager.observe(
      this.yDocManager.states$,
      this.syncObserverHandler
    );

    this.renderNodes(true);
  };

  setBaseContent = (baseContent: Platform) => {
    this.baseContent = baseContent;
  };

  setViewMode = (mode: ChangesViewMode) => {
    this.viewMode = mode;
  };

  setDeletionMode = (markAsDeleted: boolean) => {
    this.markAsDeleted = markAsDeleted;
  };

  setPlatformComponents = (platformComponents: Map<string, EntityWithMeta>) => {
    this.platformComponents = platformComponents;
  };

  cleanupMissingEntityComponents = (missingEntityIds: Set<string>) => {
    this.yDocManager.transact(() => {
      this.yDocManager.components$.forEach((c) => {
        if (missingEntityIds.has(c.linkedTo)) {
          this.yDocManager.cleanupComponentData(c.id, false);
        }
      });
    }, "ignore");
  };

  selectAll = (): void => {
    DiagramProvider.selectAllInstances();
  };

  deselectAll = (): void => {
    DiagramProvider.deselectAllInstances();
  };

  addComponentToGroup(
    groupId: string,
    components: string[],
    states: NodeState[]
  ): void {
    this.yDocManager.addComponentToGroup(groupId, components, states);
  }

  createGroup = (): void => {
    const components = Array.from(this.selectedComponents).map((c) => c.id);
    const group = this.yDocManager.createGroup(
      components,
      this.viewport.center
    );
    this.preselected.add(group.id);
    DiagramProvider.deselectAllInstances();
  };

  groupSelection = (): void => {
    if (!this.selectedComponents.size) return;
    this.createGroup();
  };

  ungroupSelection = (): void => {
    if (!this.selectedComponents.size) return;
    const states = {};
    const components = [];

    this.selectedComponents.forEach((c) => {
      components.push(c.id);
      const group = c.groupNode;
      if (group) {
        states[c.id] = {
          x: group.x,
          y: c.y + group.y + group.getLocalBounds().bottom,
        };
      }
    });

    this.yDocManager.removeFromGroup(components, states);
    DiagramProvider.deselectAllInstances();
  };

  removeSelection = (): void => {
    this.yDocManager.transact(() => {
      const selectedNodeIds = new Set(
        Array.from(this.selectedComponents).map((c) => c.id)
      );
      if (this.yDocManager.isSystemView) {
        this.selectedEdges.forEach((edge) => {
          this.yDocManager.removeEdge(edge.id);
        });
        this.selectedComponents.forEach((node) => {
          this.yDocManager.cleanupComponentData(node.id);
        });
        this.selectedGroups.forEach((group) => {
          const groupComponents = Object.values(
            this.yDocManager.components
          ).filter((component) => component.groupId === group.id);
          const allComponentsSelected = groupComponents.every((component) =>
            selectedNodeIds.has(component.id)
          );
          if (this.selectedComponents.size === 0 || allComponentsSelected) {
            this.yDocManager.cleanupGroupData(group.id);
          }
        });
      } else {
        this.selectedGroups.forEach((group) => {
          const childNodes = Array.from(group.childNodes);
          const isAllSelected = childNodes.every((n) => n.isSelected);
          if (this.selectedComponents.size === 0 || isAllSelected) {
            this.yDocManager.removeGroupFromView(group.id);
            childNodes.forEach((node) => {
              this.yDocManager.removeComponentFromView(node.id);
            });
          }
        });

        this.selectedComponents.forEach((node) => {
          this.yDocManager.removeComponentFromView(node.id);
        });
      }
      DiagramProvider.deselectAllInstances();
    });
  };

  copySelection = (): void => {
    if (!this.selectedComponents.size && !this.selectedGroups.size) {
      navigator.clipboard.writeText("");
      return;
    }

    const nodes = [];
    const groups = [];

    Array.from(this.selectedGroups).forEach((group) => {
      groups.push(group.toJson());
      const children = Array.from(group.childNodes);
      if (!children.every((n) => this.selectedComponents.has(n))) {
        nodes.push(...children.map((n) => n.toJson()));
      }
    });

    Array.from(this.selectedComponents).forEach((node) => {
      if (node.groupNode && !this.selectedGroups.has(node.groupNode)) {
        groups.push(node.groupNode.toJson());
      }
      nodes.push(node.toJson());
    });

    const edges = Array.from(this.selectedEdges)
      .filter(
        (edge) =>
          nodes.some((n) => edge.source.id === n.id) ||
          nodes.some((n) => edge.target.id === n.id)
      )
      .map((instance) => instance.toJson());

    navigator.clipboard.writeText(JSON.stringify({ edges, nodes, groups }));
  };

  cutSelection = (): void => {
    if (!this.enabled || this.readonly) return;
    this.copySelection();
    const sideEdges = Array.from(this.selectedEdges).filter(
      (edge) =>
        !(
          this.selectedComponents.has(edge.source) &&
          this.selectedComponents.has(edge.target)
        )
    );
    DiagramProvider.deselectInstances(sideEdges, true);
    this.removeSelection();
  };

  onPaste = (e: ClipboardEvent): void => {
    if (
      !this.yDocManager.isSystemView ||
      !this.enabled ||
      this.readonly ||
      isInputElement(e.target)
    ) {
      return;
    }

    this.preselected.clear();
    try {
      const { components, edges, groups } = getClipboardData(
        e,
        this.platformComponents,
        this.yDocManager
      );

      this.yDocManager.transact(() => {
        groups.forEach((group) => {
          this.preselected.add(group.id);
          this.yDocManager.addGroup(group);
          this.yDocManager.addState(group.id, group.state);
        });
        components.forEach((node) => {
          this.preselected.add(node.id);
          this.yDocManager.addComponent(node);
          this.yDocManager.addState(node.id, node.state);
        });
        edges.forEach((edge) => {
          this.preselected.add(edge.id);
          this.yDocManager.addEdge(edge);
        });
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  addComponents = (
    ids: string[],
    sourceRef?: {
      id: string;
      direction: EdgeDirection;
      shouldConnectToParent: boolean;
    }
  ): void => {
    if (this.readonly) return;
    this.yDocManager.transact(() => {
      this.preselected.clear();
      if (this.yDocManager.isSystemView) {
        const direction = sourceRef?.direction || EdgeDirection.right;
        const refComponent = this.getRefComponent(sourceRef || {});
        const parentGroup = this.getParentGroup(refComponent);
        const position = DiagramProvider.getNearbyPosition(
          refComponent,
          parentGroup,
          direction,
          ids.length
        );

        const componentNodes = createPlatformNodes(
          ids,
          this.platformComponents,
          parentGroup,
          position,
          direction,
          this.layout.direction
        );

        componentNodes.forEach((node) => {
          this.preselected.add(node.id);
          this.yDocManager.addComponent(node);
          this.yDocManager.addState(node.id, node.state);

          if (refComponent) {
            const edge = newEdge({ source: refComponent.id, target: node.id });
            this.yDocManager.addEdge(edge);
          }
        });
      } else {
        this.addComponentsToView(ids);
      }
    });
  };

  private addComponentsToView(ids: string[]) {
    this.yDocManager.transact(() => {
      ids.forEach((id) => {
        const allViews = this.yDocManager.allView$;
        const component = this.yDocManager.components$.get(id);

        if (!component) return;

        const states = allViews
          .get("visualizations")
          .get(VisualizationType.DIAGRAM);

        const groupState = states.get(component.groupId)?.toJSON();
        const componentState = states.has(id)
          ? states.get(id).toJSON()
          : { x: 0, y: 0 };
        const existingState = this.yDocManager.states$.has(id);

        if (component && !existingState) {
          this.preselected.add(id);
          this.yDocManager.addComponentToView(id, componentState);
          if (groupState) {
            this.yDocManager.addGroupToView(component.groupId, groupState);
          }
        }
      });
    });
  }

  addEdge = ({
    source,
    sourcePosition,
    target,
    targetPosition,
  }: {
    source: ComponentNode;
    sourcePosition: EdgePosition;
    target: ComponentNode;
    targetPosition: EdgePosition;
  }) => {
    if (!this.enabled || this.readonly) return;

    const edge = newEdge({
      source: source.id,
      sourcePosition:
        sourcePosition ||
        getDefaultEdgePosition("source", this.layout.direction),
      target: target.id,
      targetPosition:
        targetPosition ||
        getDefaultEdgePosition("target", this.layout.direction),
    });
    if (!this.edgesRefs.has(edge.id) && source !== target) {
      this.yDocManager.addEdge(edge);
    }
  };

  restoreDeletedNode = (node) => {
    this.yDocManager.transact(() => {
      const nodeJson = node.toJson();
      this.yDocManager.addComponent(nodeJson);
      this.yDocManager.addState(nodeJson.id, nodeJson.state);
      if (node.groupNode && node.groupNode.isDeleted) {
        const { state, ...data } = node.groupNode.toJson();
        this.yDocManager.addGroup(data);
        this.yDocManager.addState(data.id, state);
      }
      this.edgesRefs.forEach((edge) => {
        if (
          edge.isDeleted &&
          edge.isConnectedWith(node) &&
          ((edge.source.isDeleted && !edge.target.isDeleted) ||
            (!edge.source.isDeleted && edge.target.isDeleted))
        ) {
          this.yDocManager.addEdge(edge.toJson());
        }
      });
    });
  };

  getRefComponent = (sourceRef): ComponentNode => {
    const component = this.componentsRefs.get(sourceRef.id);
    if (component) return component;

    const singleSelectedComponent =
      this.selectedComponents.size === 1 && !this.selectedGroups.size
        ? Array.from(this.selectedComponents)[0]
        : null;

    return singleSelectedComponent;
  };

  getParentGroup = (node: ComponentNode): GroupNode => {
    if (node) {
      return this.groupsRefs.get(node.groupId);
    }

    const singleSelectedGroup =
      this.selectedGroups.size === 1 && !this.selectedComponents.size
        ? Array.from(this.selectedGroups)[0]
        : null;

    return singleSelectedGroup;
  };

  destroy() {
    super.destroy();
    this.yDocManager?.destroy();
  }

  private initEditor = (): void => {
    resetDiagramProvider();
    this.doc = this.getDoc();
    this.yDocManager = new YDocManager(
      this.doc,
      this.options.currentViewId,
      this.options.undoManager?.instance.current
    );
    this.yDocManager.runVersionMigration();
    // ObserveDeep only for only UndoManager Transactions
    this.yDocManager.observeDeep(
      this.yDocManager.data$,
      this.dataObserverHandler
    );

    this.yDocManager.observe(
      this.yDocManager.views$,
      this.viewsObserverHandler
    );

    this.yDocManager.observe(this.yDocManager.edges$, this.syncObserverHandler);
    this.yDocManager.observe(
      this.yDocManager.groups$,
      this.syncObserverHandler
    );

    this.yDocManager.observe(
      this.yDocManager.metadata$,
      this.metadataObserverHandler
    );

    this.yDocManager.observe(
      this.yDocManager.states$,
      this.syncObserverHandler
    );

    this.yDocManager.observe(
      this.yDocManager.components$,
      this.syncObserverHandler
    );

    DiagramProvider.layout = {
      ...this.yDocManager.metadata.layout,
    };

    this.addEventListeners();
  };

  private renderNodes = (cleanup): void => {
    if (cleanup) {
      this.cleanup();
    }
    this.syncChangesDebounce(true);
  };

  private recalculateAutoLayoutDebounce = debounce((isLocal: boolean) => {
    this.recalculateAutoLayout(isLocal);
  }, 100);

  private recalculateAutoLayout = async (isLocal: boolean) => {
    if (!isLocal || document.hidden) return;
    const promises = [];
    const params = { sync: !this.readonly, animate: true, layout: this.layout };
    const { nodesContainer, edgesContainer } = this.stage;

    nodesContainer.children.forEach((g) => {
      if (g instanceof GroupNode && !g.isCollapsed) {
        promises.push(
          calculateAutoLayout(g.nodesContainer, null, this.yDocManager, params)
        );
      }
    });

    await Promise.all(promises);
    if (!DiagramProvider.isAutoLayout) return;
    await calculateAutoLayout(
      nodesContainer,
      edgesContainer,
      this.yDocManager,
      params
    );
  };

  private syncChanges = (isLocal: boolean, origin?) => {
    const fromHistory = origin instanceof Y.UndoManager;

    this.calcDiffPatch();
    this.syncGroups();
    this.syncComponents(fromHistory);
    this.syncEdges();
    this.doSelection();

    // TODO: Update layout drawing and calculation
    if (!fromHistory) {
      this.recalculateAutoLayout(isLocal);
    } else {
      this.stage.groups.forEach((g) => {
        g.updateRect();
      });
    }

    DiagramProvider.updateSelectedInstances();

    requestAnimationFrame(() => {
      this.updateViewport();
    });
  };

  private syncChangesDebounce = debounce((isLocal: boolean, origin?) => {
    this.syncChanges(isLocal, origin);
  }, 200);

  private syncGroups = (): void => {
    const groupsRefs = new Map();
    const groups = getPlatformGroups(this.yDocManager, this.dataDiff.groups);

    groups.forEach((group) => {
      let instance = this.groupsRefs.get(group.id);
      if (instance) {
        instance.update(group);
      } else {
        instance = new GroupNode(group, this.yDocManager);
        this.stage.addGroup(instance);
      }
      groupsRefs.set(group.id, instance);
    });

    this.groupsRefs.forEach((node, id) => {
      if (!groupsRefs.has(id) && node) {
        this.stage.removeGroup(node);
      }
    });
  };

  private syncComponents = (fromHistory: boolean): void => {
    const componentsRefs = new Map();
    const { components, missingStates, missingEntities } =
      getPlatformComponents(
        this.yDocManager,
        this.dataDiff.nodes,
        this.platformComponents
      );

    components.forEach((node) => {
      let instance = this.componentsRefs.get(node.id);
      if (instance) {
        this.stage.updateNode(node, fromHistory);
      } else {
        instance = new ComponentNode(node, this.yDocManager);

        this.stage.addNode(instance);
      }
      componentsRefs.set(node.id, instance);
    });

    if (missingStates.length) {

      this.yDocManager.transact(() => {
        let offset = getOffsetPoint(components);
        const edges = Object.values(this.yDocManager.edges$.toJSON());
        const nodes = Array.from(componentsRefs.values()).map(
          (node) => new GraphNode(node)
        );
        const treeLayout = getCombinedGraphLayout(
          {
            offsetX: offset.x,
            offsetY: offset.y,
            rowGap: this.stage.nodesContainer.rowGap,
            colGap: this.stage.nodesContainer.colGap,
            direction: this.layout.direction,
            align: this.layout.align,
          },
          nodes,
          edges
        );
        const isAll = components.length === missingStates.length;

        missingStates.forEach((componentId) => {
          const state = treeLayout.nodes.get(componentId);
          const x = state.x;
          const y = state.y;
          const freeState =
            isAll
              ? state
              : DiagramProvider.findEmptySpot(x, y, 1);

          this.yDocManager.updateState(componentId, {
            x: freeState.x,
            y: freeState.y,
          });
          const instance = componentsRefs.get(componentId);
          if (instance) {
            instance.state$ = this.yDocManager.states$.get(componentId);
          }
        });

        this.resetViewport = true;
      }, "ignore");
    }

    this.componentsRefs.forEach((node, id) => {
      if (!componentsRefs.has(id) && node) {
        this.stage.removeNode(node);
      }
    });

    if (this.readonly) return;

    if (missingEntities.length) {
      this.emit(DiagramEvents.check_entities, [missingEntities]);
    }
  };

  private syncEdges = (): void => {
    const edgeRefs = new Map<string, Edge>();
    const edges = getPlatformEdges(this.yDocManager, this.dataDiff.edges);

    edges.forEach((edge) => {
      let instance = this.edgesRefs.get(edge.id);
      const source = this.componentsRefs.get(edge.source);
      const target = this.componentsRefs.get(edge.target);
      if (!source || !target) return;
      if (instance) {
        instance.update(edge);
      } else {
        const data = { ...edge, source, target };
        instance = new Edge(data);
        this.stage.addEdge(instance);
      }
      edgeRefs.set(edge.id, instance);
    });

    this.edgesRefs.forEach((edge, id) => {
      if (!edgeRefs.has(id) && edge) this.stage.removeEdge(edge);
    });
  };

  private addEventListeners = (): void => {
    this.on(DiagramEvents.create_edge, this.addEdge);
    this.on(DiagramEvents.theme_change, this.onThemeChange);
  };

  private onThemeChange = (): void => {
    this.stage.nodes.forEach((node) => node.renderNode());
    this.stage.groups.forEach((group) => {
      group.renderNode();
      group.updateRect();
    });
    this.stage.edges.forEach((edge) => edge.renderEdge());
  };

  private dataObserverHandler = (_: Y.YMapEvent<any>, tr) => {
    if (tr.origin instanceof Y.UndoManager) {
      this.syncChanges(tr.local, tr.origin);
    }
  };

  private syncObserverHandler = (_: Y.YMapEvent<any>, tr: Y.Transaction) => {
    if (isIgnorableTransaction(tr)) return;
    const { origin, local } = tr;
    this.syncChangesDebounce(local, origin);
  };

  private viewsObserverHandler = (_: Y.YMapEvent<any>, tr: Y.Transaction) => {
    if (isIgnorableTransaction(tr)) return;
    if (!this.yDocManager.views$.get(this.currentViewId)) {
      this.cleanup();
      this.setCurrentViewId(SystemViewTypes.ALL);
    } else {
      this.syncChangesDebounce(tr.local, tr.origin);
    }
  };

  private metadataObserverHandler = (event: Y.YMapEvent<PlatformMetadata>) => {
    if (event.changes.keys.has("layout")) {
      const { layout } = event.target.toJSON() as PlatformMetadata;
      const { oldValue } = event.changes.keys.get("layout");
      DiagramProvider.layout = layout;

      const isModeChange =
        oldValue &&
        oldValue.mode !== layout.mode &&
        layout.mode === PlatformLayoutMode.MANUAL;

      if (event.transaction.local && !isModeChange) {
        this.switchLayout(oldValue);
      }
    }
  };

  private resetViewportOnAutoLayout() {
    this.viewport.resetZoom(true);
  }

  private getDoc = () => {
    return (
      this.options.doc ||
      EntityConverter.convertDataToYDoc(
        EntityType.PLATFORM,
        this.options.initialData
      )
    );
  };

  private doSelection = (): void => {
    if (this.preselected.size) {
      DiagramProvider.selectInstances(
        [...this.componentsRefs.values(), ...this.groupsRefs.values()].filter(
          (node) => this.preselected.has(node.id)
        )
      );
      this.preselected.clear();
    }
  };

  private cleanup = (): void => {
    DiagramProvider.cleanup();
  };

  private calcDiffPatch = () => {
    this.dataDiff = getPlatformDiff(this.baseContent, this.yDocManager.data);
  };
}

export default PlatformDiagram;
