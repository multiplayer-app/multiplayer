import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import * as Y from "yjs";
import { EntityConverter } from "@multiplayer/entity";
import {
  EntityType,
  VisualizationType,
  EntityCommitChangeType,
  DEFAULT_VIEW,
  DEFAULT_LAYOUT,
  PlatformMetadata,
  ComponentType,
} from "@multiplayer/types";
import { getNestedProperty } from "shared/utils";
import { isDynamicView } from "shared/helpers/diagram.helpers";
import {
  INode,
  EntityWithMeta,
  IDiagramBoardState,
} from "shared/models/interfaces";
import {
  SystemViewTypes,
  ChangesViewMode,
  EntityCategories,
} from "shared/models/enums";
import { useEntities } from "shared/providers/EntitiesContext";
import { useVersion } from "../providers/VersionContext";
import { YjsSocketIOProvider } from "integrations/YjsSocketIOProvider";
import { getEntityCommitContentsMemo } from "../services/version.service";
import usePlatformYDoc from "./usePlatformYDoc";

const initialState: IDiagramBoardState = {
  views: {},
  metadata: {
    defaultView: DEFAULT_VIEW,
    layout: { ...DEFAULT_LAYOUT },
  },
  nodes: new Map(),
  groups: new Map(),
  baseContent: null,
  currentViewId: null,
  selectedNodes: new Set(),
  selectedEdges: new Set(),
  selectedGroups: new Set(),
  componentsInPlatform: [],
};

interface UseDiagramBoardYProps {
  doc: Y.Doc;
  provider: YjsSocketIOProvider;
}

interface UseDiagramBoardProps extends UseDiagramBoardYProps {
  readonly?: boolean;
  viewMode?: ChangesViewMode;
}

const useDiagramBoard = ({
  doc,
  provider,
  readonly,
  viewMode,
}: UseDiagramBoardProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState(initialState);
  const { currentBranch, currentBranchId } = useVersion();
  const { entities, entitiesFetching, entity, entityCommits } = useEntities();
  const {
    viewsRef,
    metadataRef,
    yDocActions,
    groupsRef,
    positionsRef,
    componentsRef,
  } = usePlatformYDoc(doc);

  const entitiesMap = useMemo(() => {
    if (entitiesFetching) return null;
    return new Map<string, EntityWithMeta>(
      entities[EntityCategories.COMPONENT].map((e) => [e.entityId, e])
    );
  }, [entities, entitiesFetching]);

  const viewIdParam = searchParams.get("viewId");
  const showChangesInView = useMemo(() => {
    return (
      viewMode === ChangesViewMode.CHANGES || viewMode === ChangesViewMode.XRAY
    );
  }, [viewMode]);

  const isReadonly = useMemo(() => {
    return readonly || isDynamicView(state.currentViewId);
  }, [state.currentViewId, readonly]);

  const getAvailableViews = useCallback(() => {
    const views = viewsRef.current.toJSON();
    if (views && !currentBranch.data.default) {
      // if is in feature branch, add change tracking views programmatically
      views["_changes"] = {
        id: "_changes",
        name: "Changes",
        visualizations: {
          [VisualizationType.DIAGRAM]: {},
        },
      };
      views["_diffs"] = {
        id: "_diffs",
        name: "Diffs",
        visualizations: {
          [VisualizationType.DIAGRAM]: {},
        },
      };
    }
    return views;
  }, [currentBranch.data.default, viewsRef]);

  const actions: any = useMemo(
    (): any => ({
      onSelectionDone: (
        selectedNodes: string[],
        selectedGroups: string[],
        selectedEdges: string[]
      ) => {
        setState((prev: IDiagramBoardState) => {
          return {
            ...prev,
            selectedNodes: new Set(selectedNodes),
            selectedEdges: new Set(selectedEdges),
            selectedGroups: new Set(selectedGroups),
          };
        });
      },

      onViewCreate: (isDuplicate = false) => {
        setState((prevState) => {
          const newView = isDuplicate
            ? yDocActions.duplicateView()
            : yDocActions.addView(
              prevState.selectedNodes,
              prevState.selectedGroups
            );
          return {
            ...prevState,
            views: { ...prevState.views, [newView.id]: newView },
            currentViewId: newView.id,
          };
        });
      },

      onViewRename: (id, newName) => {
        setState((prevState) => {
          yDocActions.renameView(id, newName);
          const updatedViews = { ...prevState.views };
          updatedViews[id].name = newName;
          return {
            ...prevState,
            views: updatedViews,
            currentViewId: id,
          };
        });
      },

      onViewDelete: (id) => {
        setState((prevState) => {
          if (prevState.currentViewId === id) {
            return {
              ...prevState,
              currentViewId: SystemViewTypes.ALL,
            };
          } else {
            return prevState;
            // const updatedViews = { ...prevState.views };
            // delete updatedViews[id];
            // return { ...prevState, views: updatedViews };
          }
        });

        doc.transact(() => {
          if (metadataRef.current.toJSON().defaultView === id) {
            yDocActions.setMetadataProp("defaultView", SystemViewTypes.ALL);
          }
          yDocActions.removeView(id);
        });
      },

      onViewSetDefault: (viewId) => {
        yDocActions.setDefaultView(viewId);
      },

      onMetadataChange: (key, value) => {
        yDocActions.setMetadataProp(key, value);
      },

      onViewSelect: (viewId) => {
        setState((prevState) => {
          if (prevState.currentViewId === viewId) {
            return prevState;
          }

          return {
            ...prevState,
            currentViewId: viewId,
          };
        });
      },
    }),
    [
      doc,
      entitiesMap,
      isReadonly,
      currentBranch.data.default,
      provider,
      viewsRef,
      yDocActions,
      metadataRef,
    ]
  );

  const setViewIdQueryParam = useCallback(
    (viewId: string) => {
      const searchParams = new URLSearchParams(location.search);
      if (viewId) {
        searchParams.set("viewId", viewId);
      } else {
        searchParams.delete("viewId");
      }

      const newSearch = searchParams.toString();

      navigate(`${location.pathname}?${newSearch}`, { replace: true });
    },
    [location.pathname, location.search, navigate]
  );

  const buildNodeObject = useCallback(
    (component, positionsJSON): INode => {
      if (!component || !entitiesMap) return;
      const { id } = component;
      const entity = entitiesMap.get(component.linkedTo);

      if (!entity) {
        return;
      }
      const baseType = component.type || ComponentType.GENERIC;
      return {
        ...component,
        name: entity.key,
        position: positionsJSON[id],
        data: getNestedProperty(entity, "metadata", component.data),
        type: getNestedProperty(entity, "metadata.type", baseType),
      };
    },
    [doc, entitiesMap, yDocActions]
  );

  const getConvertedDataFromDoc = useCallback(
    (viewId: string) => {
      const nodes = new Map();
      const groups = new Map(Object.entries(groupsRef.current.toJSON()));

      const positions = positionsRef.current.toJSON();
      const components = componentsRef.current.toJSON();

      Object.keys(positions).forEach((id) => {
        const node = buildNodeObject(components[id], positions);
        node && nodes.set(id, node);
      });

      if (viewId === SystemViewTypes.ALL) {
        Object.keys(components).forEach((id) => {
          if (!nodes.has(id)) {
            const node = buildNodeObject(components[id], positions);
            node && nodes.set(id, node);
          }
        });
      }

      return { nodes, groups };
    },
    [doc, viewsRef, componentsRef, buildNodeObject]
  );

  const initDiagramDataByDoc = useCallback(() => {
    const views = getAvailableViews();
    const metadata = metadataRef.current.toJSON() as PlatformMetadata;
    const lastSavedView = localStorage.getItem("lastViewId");
    const defaultView = metadata.defaultView;

    let currentViewId =
      viewIdParam ||
      (!currentBranch.data.default && lastSavedView) ||
      defaultView;

    if (!views[currentViewId]) {
      currentViewId = SystemViewTypes.ALL;
    }

    setState((prevState) => ({
      ...prevState,
      views,
      metadata,
      currentViewId,
      selectedNodes: new Set(),
      selectedEdges: new Set(),
      selectedGroups: new Set(),
    }));

    const updateComponents = () => {
      setState((prev) => ({
        ...prev,
        componentsInPlatform: Object.values(componentsRef.current.toJSON()),
      }));
    };

    const updateViews = () => {
      const views = getAvailableViews();
      setState((prevState) => ({
        ...prevState,
        views,
      }));
    };

    const updateMetadata = () => {
      setState((prevState) => ({
        ...prevState,
        metadata: metadataRef.current.toJSON() as PlatformMetadata,
      }));
    };

    updateComponents();
    viewsRef.current.observe(updateViews);
    metadataRef.current.observe(updateMetadata);
    componentsRef.current.observe(updateComponents);
    return () => {
      viewsRef.current.unobserve(updateViews);
      metadataRef.current.observe(updateMetadata);
      componentsRef.current.unobserve(updateComponents);
    };
  }, [
    metadataRef,
    viewIdParam,
    componentsRef,
    currentBranch.data.default,
    getAvailableViews,
  ]);

  useEffect(() => {
    const updateNodes = () => {
      const { nodes, groups } = getConvertedDataFromDoc(state.currentViewId);
      setState((prev) => ({
        ...prev,
        nodes,
        groups,
      }));
    };

    yDocActions.setPositionRef(state.currentViewId);
    groupsRef.current.observe(updateNodes);
    positionsRef.current.observe(updateNodes);
    updateNodes();
    setLoading(false);
    return () => {
      groupsRef.current.unobserve(updateNodes);
      positionsRef.current.unobserve(updateNodes);
    };
  }, [viewsRef, state.currentViewId, getConvertedDataFromDoc]);

  useEffect(() => {
    if (!provider || state.currentViewId === null) {
      return;
    }
    localStorage.setItem("lastViewId", state.currentViewId);
    setViewIdQueryParam(state.currentViewId);
  }, [
    state.currentViewId,
    provider,
    entity,
    viewsRef,
    yDocActions,

    setViewIdQueryParam,
  ]);

  useEffect(() => {
    if (!provider) return;
    const getContent = async () => {
      const commit = entityCommits[provider.entityId];
      if (!commit) {
        return;
      }
      const content = await getEntityCommitContentsMemo(
        provider.branchId,
        provider.entityId,
        commit.baseEntityCommit
      );
      const baseContent = EntityConverter.convertStateToData(
        EntityType.PLATFORM,
        content
      );

      setState((prevState) => ({
        ...prevState,
        baseContent,
      }));
    };
    if (
      (isDynamicView(state.currentViewId) || showChangesInView) &&
      (entity.typeOfChangeInBranch !== EntityCommitChangeType.CREATE ||
        (entity.typeOfChangeInBranch === EntityCommitChangeType.CREATE &&
          entity.projectBranch !== currentBranchId))
    ) {
      getContent();
    } else {
      setState((prev) =>
        !prev.baseContent ? prev : { ...prev, baseContent: null }
      );
    }
  }, [
    provider,
    entity,
    entityCommits,
    showChangesInView,
    state.currentViewId,
    currentBranchId,
  ]);

  useEffect(() => {
    if (doc) {
      initDiagramDataByDoc();
    }
  }, [doc, initDiagramDataByDoc]);

  return useMemo(() => {
    return {
      loading,
      state,
      actions,
      viewMode,
      isReadonly,
    };
  }, [state, actions, isReadonly, viewMode]);
};

export default useDiagramBoard;
