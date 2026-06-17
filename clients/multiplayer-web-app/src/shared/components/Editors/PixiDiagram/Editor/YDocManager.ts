import {
  View,
  Edge,
  Group,
  Platform,
  Component,
  PlatformMetadata,
  VisualizationType,
  NodeState,
  PlatformComponentColorEnum,
  PlatformRadarData,
} from "@multiplayer/types";
import * as Y from "yjs";
import { v4 as uuidv4 } from "uuid";

import { INode } from "shared/models/interfaces";
import { convertObjectToYMap } from "shared/helpers/yjs.helpers";
import {
  isDynamicView,
  getNewViewName,
  getNewGroupName,
  getTopLeftNodePosition,
} from "shared/helpers/diagram.helpers";

import { throttle } from "lodash";
import { SystemViewTypes } from "shared/models/enums";
import { SYNC_THROTTLING } from "./configs";
import YjsObserverManager from "./YjsObserverManager";
import { generateObjectId } from "./utils/objectId";

class YDocManager extends YjsObserverManager {
  data$: Y.Map<any>;
  views$: Y.Map<any>;
  radar$: Y.Map<any>;
  metadata$: Y.Map<any>;
  groups$: Y.Map<Group>;
  edges$: Y.Map<Y.Map<Edge>>;
  components$: Y.Map<Component>;
  observedObjects = new Map();

  private _currentViewId: string = SystemViewTypes.ALL;
  public get currentViewId(): string {
    return this._currentViewId;
  }
  public set currentViewId(v: string) {
    this._currentViewId = v;
  }

  get data(): Platform {
    return this.data$.toJSON() as Platform;
  }

  get allView$(): Y.Map<any> {
    return this.getObject(this.views$, SystemViewTypes.ALL);
  }

  get currentView$(): Y.Map<any> {
    return this.views$.has(this.actualViewId)
      ? this.getObject(this.views$, this.actualViewId)
      : this.allView$;
  }

  get states$(): Y.Map<any> {
    const visualizations$ = this.getObject(
      this.currentView$,
      "visualizations",
      new Y.Map()
    );
    const states$ = this.getObject(
      visualizations$,
      VisualizationType.DIAGRAM,
      new Y.Map()
    );
    return states$;
  }

  get states(): Record<string, NodeState> {
    return this.states$.toJSON();
  }

  get components(): Record<string, Component> {
    return this.components$.toJSON();
  }

  get edges(): Record<string, Edge> {
    return this.edges$.toJSON();
  }

  get metadata(): PlatformMetadata {
    return this.metadata$.toJSON() as PlatformMetadata;
  }

  get groups(): Record<string, Group> {
    return this.groups$.toJSON();
  }

  get radar(): PlatformRadarData {
    return this.radar$.toJSON() as PlatformRadarData;
  }

  get isDynamicView(): boolean {
    return isDynamicView(this._currentViewId);
  }

  get isSystemView(): boolean {
    return this.isDynamicView || this._currentViewId === SystemViewTypes.ALL;
  }

  get isAllView(): boolean {
    return this._currentViewId === SystemViewTypes.ALL;
  }

  get actualViewId(): string {
    return this.isSystemView ? SystemViewTypes.ALL : this._currentViewId;
  }

  constructor(
    private doc: Y.Doc,
    viewId: string = SystemViewTypes.ALL,
    public undoManager: Y.UndoManager = null
  ) {
    super();
    this.data$ = doc.getMap("object");
    this.edges$ = this.getObject(this.data$, "edges", new Y.Map());
    this.views$ = this.getObject(this.data$, "views", new Y.Map());
    this.radar$ = this.getObject(this.data$, "radar", new Y.Map());
    this.groups$ = this.getObject(this.data$, "groups", new Y.Map());
    this.metadata$ = this.getObject(this.data$, "metadata", new Y.Map());
    this.components$ = this.getObject(this.data$, "components", new Y.Map());
    this.currentViewId =
      viewId ||
      this.getObject(this.metadata$, "defaultView", SystemViewTypes.ALL);
  }

  addComponent(node: INode | Component) {
    const { id, linkedTo, detectionId, groupId } = node;
    this.components$.set(id, {
      id,
      groupId,
      detectionId,
      linkedTo,
    } as Component);
  }

  addGroup(group: Group) {
    this.groups$.set(group.id, {
      id: group.id,
      name: group.name,
      color: group.color,
      iconUrl: group.iconUrl,
    });
  }

  addEdge(edge: Edge) {
    const yEdge = convertObjectToYMap<Edge>(edge) as Y.Map<Edge>;
    this.edges$.set(edge.id, yEdge);
  }

  updateEdge(id: string, payload: Partial<Edge>) {
    const edge$ = this.edges$.get(id);
    this.transact(() => {
      Object.keys(payload).forEach((key) => {
        if (edge$.get(key) !== payload[key]) {
          edge$.set(key, payload[key]);
        }
      });
    });
  }

  addState(id: string, state: NodeState) {
    const state$ = convertObjectToYMap<NodeState>(state) as Y.Map<NodeState>;
    this.states$.set(id, state$);
  }

  updateState(id: string, newState: Partial<NodeState>) {
    if (!this.states$.get(id)) {
      this.addState(id, newState as NodeState);
      return;
    }
    const oldState = this.states$.get(id).toJSON();
    if (Object.keys(newState).some((key) => newState[key] !== oldState[key])) {
      const state$ = this.states$.get(id);
      Object.keys(newState).forEach((key) => {
        state$.set(key, newState[key]);
      });
    }
  }

  createGroup = (components: string[], defaultPos: any): Group => {
    const group: Group = {
      id: generateObjectId(),
      name: getNewGroupName(this.groups),
      color: PlatformComponentColorEnum.GRAY,
    };
    const { x, y } = getTopLeftNodePosition(
      components,
      this.states,
      defaultPos
    );
    const state = { x, y, collapsed: false };

    this.groupComponents(group, state, components);

    return group;
  };

  groupComponents(group, state: NodeState, ids: string[] = []) {
    this.transact(() => {
      const state$ = convertObjectToYMap<NodeState>(state);

      this.groups$.set(group.id, group);
      this.states$.set(group.id, state$);

      ids.forEach((componentId) => {
        const component = this.components$.get(componentId);
        this.components$.set(componentId, { ...component, groupId: group.id });
      });
    });
  }

  addComponentToGroup(
    groupId,
    components: string[],
    states: NodeState[]
  ): void {
    this.transact(() => {
      components.forEach((id, index) => {
        const prev = this.components$.get(id);
        if (prev) {
          this.updateState(id, states[index]);
          this.components$.set(id, { ...prev, groupId });
        }
      });
    });
  }

  addComponentToView(
    id: string,
    state: NodeState,
    viewId: string = this.currentViewId
  ) {
    this.addToView(id, state, viewId, "components");
  }

  removeComponentFromView(id: string, viewId: string = this.currentViewId) {
    this.removeFormView(id, viewId, "components");
  }

  addGroupToView(
    id: string,
    state: NodeState,
    viewId: string = this.currentViewId
  ) {
    this.addToView(id, state, viewId, "groups");
  }

  removeGroupFromView(id: string, viewId: string = this.currentViewId) {
    this.removeFormView(id, viewId, "groups");
  }

  createView(selectedComponents: string[], selectedGroups: string[]): any {
    const states$ = new Y.Map();
    const visualizations$ = new Y.Map();
    const groups$ = new Y.Array();
    const components$ = new Y.Array();

    selectedComponents.forEach((id) => {
      const currentState = this.states$.get(id);
      if (currentState) {
        components$.insert(0, [id]);
        states$.set(id, currentState.clone());
      }
    });

    selectedGroups.forEach((id) => {
      const currentState = this.states$.get(id);
      if (currentState) {
        groups$.insert(0, [id]);
        states$.set(id, currentState.clone());
      }
    });

    visualizations$.set(VisualizationType.DIAGRAM, states$);

    const newView = {
      id: uuidv4(),
      groups: groups$,
      components: components$,
      visualizations: visualizations$,
      name: getNewViewName(this.views$.toJSON()),
    };
    const view$ = convertObjectToYMap<View>(newView) as Y.Map<View>;

    this.views$.set(newView.id, view$);

    return view$.toJSON();
  }

  setDefaultView(viewId) {
    this.metadata$.set("defaultView", viewId);
  }

  setMetadataProp<K extends keyof PlatformMetadata>(
    propName: K,
    value: PlatformMetadata[K]
  ) {
    this.metadata$.set(propName, value);
  }

  removeComponent(id: string, ignoreDetectionId = true) {
    const component = this.components$.get(id);
    if (component.detectionId && ignoreDetectionId) {
      this.addDetectionsToIgnores([component.detectionId]);
    }
    this.components$.delete(id);
  }

  removeGroup(id: string) {
    this.groups$.delete(id);
  }

  removeEdge(id: string, ignoreDetectionId = true) {
    const edge = this.edges$.get(id)?.toJSON();
    if (edge?.detectionId && ignoreDetectionId) {
      this.addDetectionsToIgnores([edge?.detectionId]);
    }
    this.edges$.delete(id);
  }

  removeState(id: string) {
    this.states$.delete(id);
  }

  removeView(id: string) {
    this.views$.delete(id);
  }

  renameView(id: string, newName: any) {
    const viewToRename = this.views$.get(id);
    viewToRename.set("name", newName);
  }

  removeFromGroup(ids: string[] = [], states) {
    this.transact(() => {
      ids.forEach((componentId) => {
        const { groupId, ...rest } = this.components$.get(componentId);
        this.components$.set(componentId, rest);
        const newState = states[componentId];
        if (newState) {
          this.updateState(componentId, newState);
        }
      });
    });
  }

  cleanupComponentData(nodeId: string, ignoreDetectionId = true) {
    this.edges$.forEach((edge) => {
      const { id, source, target } = edge.toJSON();
      if (source === nodeId || target === nodeId) {
        this.removeEdge(id, ignoreDetectionId);
      }
    });
    this.removeComponent(nodeId, ignoreDetectionId);

    this.views$.forEach((view$) => {
      this.removeComponentFromView(nodeId, view$.get("id"));
    });
  }

  cleanupGroupData(groupId: string) {
    this.groups$.delete(groupId);
    this.views$.forEach((view) => {
      this.removeGroupFromView(groupId, view);
    });

    this.components$.forEach((component) => {
      if (component.groupId === groupId) {
        this.cleanupComponentData(component.id, false);
      }
    });
  }

  transact(cb, origin?) {
    this.doc.transact(cb, origin);
  }

  destroy() {
    this.clearAllObservers();
  }

  transactThrottled = (() => {
    let queue = [];
    const transactAll = throttle(
      (origin) => {
        if (queue.length > 0) {
          this.doc.transact(() => {
            queue.forEach((fn) => fn());
            queue = [];
          }, origin);
        }
      },
      SYNC_THROTTLING,
      { leading: false }
    );

    return (fn, origin = null) => {
      queue.push(fn);
      transactAll(origin);
    };
  })();

  runVersionMigration() {}

  getGroupsInView(): Record<string, Group> {
    if (this.isSystemView) {
      return this.groups$.toJSON();
    } else {
      const itemsInView$ = this.currentView$.get("groups");

      const itemsInView = itemsInView$ ? itemsInView$.toJSON() : [];
      return itemsInView.reduce((acc, id) => {
        const group$ = this.groups$.get(id);
        if (group$) {
          acc[id] = group$;
        }
        return acc;
      }, {});
    }
  }

  getComponentsInView(): Record<string, Component> {
    if (this.isSystemView) {
      return this.components$.toJSON();
    } else {
      const itemsInView$ = this.currentView$.get(
        "components"
      ) as Y.Array<string>;
      const itemsInView = itemsInView$ ? itemsInView$.toJSON() : [];
      return itemsInView.reduce((acc, id) => {
        const components$ = this.components$.get(id);
        if (components$) {
          acc[id] = components$;
        }
        return acc;
      }, {});
    }
  }

  addDetectionsToIgnores(detections: string[]) {
    const current = new Set([
      ...(this.radar$.get("ignoredDetections") || []),
      ...detections,
    ]);

    this.radar$.set("ignoredDetections", Array.from(current));
  }

  removeDetectionsFromIgnores(detections: string[]) {
    const detectionsToRemove = new Set(detections);
    const current = this.radar$.get("ignoredDetections") || [];
    const filtered = current.filter(
      (detection) => !detectionsToRemove.has(detection)
    );
    this.radar$.set("ignoredDetections", filtered);
  }

  private removeFormView(
    id: string,
    viewId: string,
    location: "groups" | "components"
  ) {
    const view$ = this.views$.get(viewId);
    if (!view$) return;
    const visualizations$ = view$.get("visualizations");
    const states$ = visualizations$.get(VisualizationType.DIAGRAM);

    const items$ = view$.get(location);
    const items = items$ ? items$.toJSON() : [];
    const filtered = items.filter((c) => c !== id);
    states$.delete(id);
    view$.set(location, Y.Array.from(filtered));
  }

  private addToView(
    id: string,
    state: NodeState,
    viewId: string,
    location: "groups" | "components"
  ) {
    const view$ = this.views$.get(viewId) as Y.Map<any>;
    if (!view$) return;
    const visualizations$ = view$.get("visualizations");
    const states$ = visualizations$.get(VisualizationType.DIAGRAM);
    const items$ = view$.has(location)
      ? view$.get(location)
      : view$.set(location, new Y.Array<string>());
    const state$ = convertObjectToYMap<NodeState>(state) as Y.Map<NodeState>;

    items$.insert(0, [id]);
    states$.set(id, state$);
  }

  private getObject(parent$: Y.Map<any>, key: string, initial?: any) {
    let obj$ = parent$.get(key);
    if (!obj$ && initial) {
      obj$ = parent$.set(key, initial);
    }
    return obj$;
  }
}

export default YDocManager;
