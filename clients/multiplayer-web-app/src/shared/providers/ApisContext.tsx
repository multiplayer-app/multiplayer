import * as Y from "yjs";
import { v4 as uuidv4 } from "uuid";

import React, {
  useMemo,
  useState,
  useEffect,
  useContext,
  createContext,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useParams, useSearchParams } from "react-router-dom";

import {
  ApiType,
  ApiView,
  EntityType,
  EntityCommitChangeType,
} from "@multiplayer/types";
import { EntityConverter } from "@multiplayer/entity";
import { SplitViewIcon, SourceViewIcon, DesignerViewIcon } from "shared/icons";
import { YjsSocketIOProvider } from "integrations/YjsSocketIOProvider";
import {
  IMetadata,
  ViewModes,
} from "pages/Workspace/Project/Editors/Apis/Apis.types";
import { UseDisclosureReturn, useDisclosure } from "@chakra-ui/react";

import useYUndoManager, {
  UseUndoManagerReturn,
} from "shared/hooks/useYUndoManager";
import useMessage from "shared/hooks/useMessage";
import useYMapState from "shared/hooks/useYMapState";

import { getNewViewName } from "shared/helpers/openApi.helpers";
import { ToolbarToggleButton } from "shared/components/Toolbar";
import { getEntityCommitContentsMemo } from "shared/services/version.service";

import { clone } from "shared/utils";
import {
  ChangesViewMode,
  EntityCategories,
  SystemViewTypes,
} from "shared/models/enums";
import { ClientState, IViewItem } from "shared/models/interfaces";

import { useEntities } from "./EntitiesContext";
import { useVersion } from "./VersionContext";
import { useActiveTabState } from "./TabsContext";
import { ViewIdType } from "shared/models/types";
import { OpenAPIV3_1 } from "openapi-types";

const initialCheckedState = {
  tags: {},
  paths: {},
  components: {},
};

export const ApisProvider = forwardRef(
  (
    {
      doc,
      provider,
      children,
      readonly,
      clients,
      initialData,
      radarData,
      onSelectionChange,
    }: {
      doc: Y.Doc;
      provider: YjsSocketIOProvider;
      children: React.ReactNode;
      clients: ClientState[];
      readonly: boolean;
      initialData: any;
      radarData?: OpenAPIV3_1.Document;
      onSelectionChange?: (payload: any) => void;
    },
    ref
  ) => {
    const message = useMessage();
    const { branchId, path } = useParams();
    const openApiProviderRef = useRef<any>();
    const undoManager = useYUndoManager(
      doc ? [doc.getMap("object"), doc.getText("text")] : []
    );
    const { currentBranch } = useVersion();
    const viewsDisclosure = useDisclosure();
    const apiPropertiesDrawerDisclosure = useDisclosure();
    const [params, setParams] = useSearchParams();
    const { entities, entityCommits } = useEntities();
    const [systemViews, setSystemViews] = useState<IViewItem[]>([]);
    const [baseCommitContent, setBaseCommitContent] = useState<any>();
    const [viewModes, setViewModes] = useState<ToolbarToggleButton[]>([]);
    const [metadata, setMetadata] = useYMapState<IMetadata>(
      doc?.getMap("metadata")
    );
    const [customViews, setCustomViews] = useYMapState<any>(
      doc?.getMap("views")
    );
    const [checkedNodes, setCheckedNodes] = useState(
      clone(initialCheckedState)
    );
    const [tabState, setActiveTabState] = useActiveTabState<{
      viewMode: ViewModes;
      currentView: ViewIdType;
      highlightingMode: ChangesViewMode;
    }>({
      viewMode: null,
      highlightingMode: null,
      currentView: metadata?.defaultViewId || SystemViewTypes.ALL,
    });

    const isRadarView = !!radarData;
    const version = metadata?.version || "3.0.0";
    const extension = metadata?.extension || "json";
    const modeParam = params.get("mode") as ViewModes;
    const apiProvider = metadata?.provider || ApiType.OTHER;
    const showCustomViews = apiProvider === ApiType.OPENAPI && !isRadarView;

    const entityId = useMemo(() => {
      return provider?.entityId || path;
    }, [provider, path]);

    const isDynamicView = useMemo(
      () =>
        tabState.currentView === SystemViewTypes.DIFFS ||
        tabState.currentView === SystemViewTypes.CHANGES,
      [tabState.currentView]
    );

    const isRadar = !!radarData;

    const isReadonly = useMemo(() => {
      return readonly || isDynamicView;
    }, [readonly, isDynamicView]);

    const onViewModeChange = (mode: ViewModes) => {
      setParams(
        (prev) => {
          prev.set("mode", mode || ViewModes.DESIGNER);
          return prev.toString();
        },
        { replace: true }
      );
    };

    const onViewChange = (viewId: ViewIdType) => {
      setActiveTabState((prev) => ({ ...prev, currentView: viewId }));
    };

    const onDefaultViewChange = (viewId: ViewIdType) => {
      setMetadata("defaultViewId", viewId);
    };

    const onViewUpdate = (viewId: string, payload: ApiView) => {
      setCustomViews(viewId, payload);
    };

    const onViewDelete = (viewId: string) => {
      setCustomViews(viewId);
      if (viewId === tabState.currentView) {
        onViewChange(SystemViewTypes.ALL);
      }
    };

    const onViewCreate = () => {
      const hasCheckedNodes = Object.values(checkedNodes).some((obj) =>
        Object.values(obj).some((val) => val)
      );
      if (!hasCheckedNodes) {
        return message.handleError({
          message:
            " You need to select at least one item to create a new view.",
        });
      }
      const newView: ApiView = {
        id: uuidv4(),
        name: getNewViewName(customViews),
        ...Object.keys(checkedNodes).reduce(
          (acc, type) => {
            for (const key in checkedNodes[type]) {
              if (
                Object.prototype.hasOwnProperty.call(checkedNodes[type], key)
              ) {
                const node = checkedNodes[type][key];
                if (node === 1) {
                  acc[type][key] = true;
                }
              }
            }
            return acc;
          },
          { tags: {}, paths: {}, components: {} }
        ),
      };
      setCustomViews(newView.id, newView);
      setCheckedNodes(clone(initialCheckedState));
      onViewChange(newView.id);
    };

    const onHighlightingModeChange = (mode: ChangesViewMode) => {
      setActiveTabState((prev) => ({ ...prev, highlightingMode: mode }));
    };

    const entityState = useMemo(() => {
      return entities[EntityCategories.SOURCE].find(
        (e) => e.entityId === entityId
      );
    }, [entities, entityId]);

    const cleanSelection = () => {
      const newState = clone(initialCheckedState);
      setCheckedNodes(newState);
      onSelectionChange && onSelectionChange(newState);
    };

    useEffect(() => {
      setActiveTabState((prev) => ({
        ...prev,
        highlightingMode: ChangesViewMode.CHANGES,
      }));
    }, [radarData]);

    useEffect(() => {
      if (modeParam && modeParam !== tabState.viewMode) {
        setActiveTabState((prev) => ({ ...prev, viewMode: modeParam }));
      } else {
        onViewModeChange(tabState.viewMode);
      }
    }, [modeParam, tabState.viewMode]);

    useEffect(() => {
      setViewModes(getViewModesByType(apiProvider));
    }, [apiProvider]);

    useEffect(() => {
      const views = [{ id: SystemViewTypes.ALL, name: "All" }];

      if (!currentBranch.data.default || isRadar) {
        const prefix = isRadar ? "Radar " : "";
        if (apiProvider === ApiType.OPENAPI) {
          views.push({ id: SystemViewTypes.CHANGES, name: prefix + "Changes" });
        }
        views.push({ id: SystemViewTypes.DIFFS, name: prefix + "Diffs" });
        setActiveTabState((prev) =>
          prev?.highlightingMode
            ? prev
            : { ...prev, highlightingMode: ChangesViewMode.CHANGES }
        );
      } else {
        setActiveTabState((prev) =>
          prev?.highlightingMode
            ? prev
            : { ...prev, highlightingMode: ChangesViewMode.NONE }
        );
      }

      setSystemViews(views);
    }, [currentBranch.data, apiProvider, radarData]);

    useEffect(() => {
      setCheckedNodes(clone(initialCheckedState));
    }, [tabState.currentView]);

    useEffect(() => {
      if (
        systemViews.length &&
        !systemViews.find((v) => v.id === tabState.currentView) &&
        !customViews[tabState.currentView]
      ) {
        onViewChange(SystemViewTypes.ALL);
      }
    }, [tabState.currentView, systemViews, customViews]);

    useEffect(() => {
      const entityCommit = entityCommits[entityId];
      const fetchBaseCommitContent = async (commitId: string) => {
        try {
          const res = await getEntityCommitContentsMemo(
            branchId,
            entityId,
            commitId
          );
          const convertedData = EntityConverter.convertStateToData(
            EntityType.API,
            res
          );
          setBaseCommitContent(convertedData);
        } catch (error) {
          setBaseCommitContent(null);
        }
      };

      if (
        entityCommit &&
        entityState &&
        entityState.typeOfChangeInBranch !== EntityCommitChangeType.CREATE
      ) {
        fetchBaseCommitContent(entityCommit.baseEntityCommit);
      } else {
        setBaseCommitContent(null);
      }
    }, [isDynamicView, entityId, branchId, entityState, entityCommits]);

    useImperativeHandle(ref, () => ({
      applyChanges: () => {
        if (openApiProviderRef.current) {
          openApiProviderRef.current.applyChanges();
        }
      },
      cleanSelection: () => {
        if (openApiProviderRef.current) {
          openApiProviderRef.current.cleanSelection();
        }
      },
    }));

    return (
      <ApisContext.Provider
        value={{
          doc,
          clients,
          version,
          readonly,
          provider,
          viewModes,
          extension,
          apiProvider,
          undoManager,
          radarData,
          initialData,
          systemViews,
          customViews,
          isDynamicView,
          viewsDisclosure,
          apiPropertiesDrawerDisclosure,
          showCustomViews,
          baseCommitContent,
          openApiProviderRef,
          isRadarView,
          viewMode: tabState.viewMode,
          currentView: tabState.currentView,
          highlightingMode: tabState.highlightingMode,
          showHighlightingModeToggle:
            !currentBranch.data.default &&
            tabState.viewMode !== ViewModes.SOURCE,
          checkedNodes,
          cleanSelection,
          onSelectionChange,
          onViewCreate,
          onViewUpdate,
          onViewDelete,
          onViewChange,
          onDefaultViewChange,
          setCheckedNodes,
          onViewModeChange,
          onHighlightingModeChange,
        }}
      >
        {children}
      </ApisContext.Provider>
    );
  }
);

export const ApisContext = createContext<IApisStateContext | null>(null);

export function useApis() {
  const context = useContext(ApisContext);
  if (context === null) {
    throw new Error("useApis must be used within ApisProvider");
  }
  return context;
}

const getViewModesByType = (type: ApiType): ToolbarToggleButton[] => {
  switch (type) {
    case ApiType.OPENAPI:
      return [
        ViewModeTypes[ViewModes.DESIGNER],
        ViewModeTypes[ViewModes.SOURCE],
        ViewModeTypes[ViewModes.SPLIT],
      ];
    default:
      return [];
  }
};

const ViewModeTypes = {
  [ViewModes.DESIGNER]: {
    icon: DesignerViewIcon,
    key: ViewModes.DESIGNER,
    label: "Designer",
  },
  [ViewModes.SOURCE]: {
    icon: SourceViewIcon,
    key: ViewModes.SOURCE,
    label: "Source",
  },
  [ViewModes.SPLIT]: {
    icon: SplitViewIcon,
    key: ViewModes.SPLIT,
    label: "Split",
  },
};

interface IApisStateContext {
  doc: Y.Doc;
  version: string;
  initialData: any;
  extension: string;
  readonly: boolean;
  viewMode: ViewModes;
  apiProvider: ApiType;
  customViews: Record<string, ApiView>;
  systemViews: IViewItem[];
  currentView: ViewIdType;
  radarData: any;
  baseCommitContent: any;
  isDynamicView: boolean;
  isRadarView: boolean;
  showCustomViews: boolean;
  openApiProviderRef: any;

  clients: ClientState[];
  provider: YjsSocketIOProvider;
  viewModes: ToolbarToggleButton[];
  undoManager: UseUndoManagerReturn;
  viewsDisclosure: UseDisclosureReturn;
  apiPropertiesDrawerDisclosure: UseDisclosureReturn;
  highlightingMode: ChangesViewMode;
  showHighlightingModeToggle: boolean;
  checkedNodes: {
    tags: Record<string, number>;
    paths: Record<string, number>;
    components: Record<string, number>;
  };

  onViewCreate: () => void;
  cleanSelection: () => void;
  setCheckedNodes: React.Dispatch<
    React.SetStateAction<{
      tags: {};
      paths: {};
      components: {};
    }>
  >;
  onViewDelete: (id: string) => void;
  onDefaultViewChange: (id: string) => void;
  onViewUpdate: (id: string, view: ApiView) => void;
  onViewChange: (mode: ViewIdType) => void;
  onViewModeChange: (mode: ViewModes) => void;
  onHighlightingModeChange: (mode: ChangesViewMode) => void;
  onSelectionChange: (e: any) => void;
}
