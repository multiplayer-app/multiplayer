import {
  Edge,
  View,
  Position,
  Component,
  VisualizationType,
  Group,
} from "@multiplayer/types";
import * as Y from "yjs";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useMemo, useRef } from "react";
import { convertObjectToYMap } from "../helpers/yjs.helpers";
import { getNewViewName } from "../helpers/diagram.helpers";
import { SystemViewTypes } from "shared/models/enums";

const getGroupComponents = (
  groupId: string,
  components: Record<string, Component>
) => {
  return Object.values(components).reduce((acc, c) => {
    if (c.groupId === groupId) {
      acc.push(c.id);
    }
    return acc;
  }, []);
};

const usePlatformYDoc = (doc) => {
  const dataRef = useRef<Y.Map<any>>();
  const componentsRef = useRef<Y.Map<Component>>();
  const groupsRef = useRef<Y.Map<Group>>();
  const viewsRef = useRef<Y.Map<Y.Map<View>>>();
  const edgesRef = useRef<Y.Map<Y.Map<Edge>>>();
  const positionsRef = useRef<Y.Map<Y.Map<Position>>>();
  const metadataRef = useRef<Y.Map<any>>();

  useEffect(() => {
    if (!doc || dataRef.current) return;

    dataRef.current = doc.getMap("object");
    edgesRef.current = dataRef.current.get("edges");
    viewsRef.current = dataRef.current.get("views");
    groupsRef.current = dataRef.current.get("groups") || new Y.Map();
    metadataRef.current = dataRef.current.get("metadata");
    componentsRef.current = dataRef.current.get("components");

    return () => {
      dataRef.current = null;
    };
  }, [doc]);

  const yDocActions = useMemo(
    () => ({
      duplicateView() {
        const [components, groups] = Array.from(
          positionsRef.current.keys()
        ).reduce(
          (acc, key) => {
            if (componentsRef.current.get(key)) {
              acc[0].add(key);
            } else if (groupsRef.current.get(key)) {
              acc[1].add(key);
            }
            return acc;
          },
          [new Set(), new Set()]
        );
        return this.addView(components, groups);
      },
      addView(
        selectedNodes: Set<string>,
        selectedGroups: Set<string> = new Set()
      ) {
        const states$ = new Y.Map();
        const visualizations$ = new Y.Map();
        const groups$ = new Y.Array();
        const components$ = new Y.Array();

        const groupIds = Array.from(selectedGroups);
        const componentIds = Array.from(selectedNodes);
        const components = componentsRef.current.toJSON();

        selectedGroups.forEach((groupId) => {
          const groupComponents = getGroupComponents(groupId, components);
          const hasSelectedComponentInGroup = groupComponents.some((compId) =>
            selectedNodes.has(compId)
          );
          if (!hasSelectedComponentInGroup) {
            componentIds.push(...groupComponents);
          }
          const state$ = positionsRef.current.get(groupId);

          if (state$) {
            states$.set(groupId, state$.clone());
          }
        });

        componentIds.forEach((nodeId) => {
          const component = componentsRef.current.get(nodeId);
          const groupId = component.groupId;

          if (groupId && !selectedGroups.has(groupId)) {
            const groupState$ = positionsRef.current.get(groupId);
            if (groupState$) {
              groupIds.push(groupId);
              states$.set(groupId, groupState$.clone());
            }
          }

          const componentState$ = positionsRef.current.get(nodeId);
          if (componentState$) {
            states$.set(nodeId, componentState$.clone());
          }
        });

        visualizations$.set(VisualizationType.DIAGRAM, states$);

        groups$.insert(0, groupIds);
        components$.insert(0, componentIds);

        const newView = {
          id: uuidv4(),
          name: getNewViewName(viewsRef.current.toJSON()),
          groups: groups$,
          components: components$,
          visualizations: visualizations$,
        };

        const yView = convertObjectToYMap<View>(newView) as Y.Map<View>;
        viewsRef.current.set(newView.id, yView);
        return yView.toJSON();
      },

      setDefaultView(viewId) {
        metadataRef.current.set("defaultView", viewId);
      },
      setMetadataProp(propName: any, value: any) {
        metadataRef.current.set(propName, value);
      },

      removeView(id: string) {
        viewsRef.current.delete(id);
      },
      renameView(id: string, newName: any) {
        const viewToRename = viewsRef.current.get(id);
        viewToRename.set("name", newName);
      },
      setPositionRef(viewId: string) {
        const view =
          viewsRef.current.get(viewId) ||
          (viewsRef.current.get(SystemViewTypes.ALL) as any);
        const visualization = view.get("visualizations") as any;
        positionsRef.current = visualization?.get(VisualizationType.DIAGRAM);
      },
    }),
    [doc]
  );

  return {
    dataRef,
    viewsRef,
    edgesRef,
    groupsRef,
    metadataRef,
    yDocActions,
    positionsRef,
    componentsRef,
  };
};

export default usePlatformYDoc;
