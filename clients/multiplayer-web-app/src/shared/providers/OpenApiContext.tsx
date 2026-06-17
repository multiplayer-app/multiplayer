import * as Y from "yjs";
import { OpenAPIV3 } from "openapi-types";
import { useSearchParams } from "react-router-dom";
import { EntityCommitChangeType, EntityType } from "@multiplayer/types";
import {
  useRef,
  useMemo,
  useState,
  useEffect,
  useContext,
  useCallback,
  createContext,
  useImperativeHandle,
} from "react";

import {
  getFirstPath,
  parseComponents,
  parseCollections,
  getMethodWithChanges,
  getChangesStyles,
  getDefaultStyles,
  getXrayStyles,
  getRefChangeTypesByDiff,
  parseMethodKey,
  getRootSourceChangesMap,
} from "shared/helpers/openApi.helpers";

import {
  YTagsType,
  YPatsType,
  ICollection,
  ComponentType,
  TagObjectType,
  YComponentsType,
} from "shared/models/openApi.types";
import {
  generateOperationId,
  getMethodInitialData,
} from "../configs/openApi.configs";
import { useApis } from "./ApisContext";
import { EntityDiffPatch } from "@multiplayer/entity";
import { getChangeType } from "shared/helpers/changes.helpers";
import { getClientUserName } from "shared/helpers/general.helpers";
import {
  clone,
  debounce,
  deepAssign,
  getNestedProperty,
  setNestedProperty,
} from "shared/utils";
import {
  ChangesViewMode,
  RefetchTargetType,
  SystemViewTypes,
} from "shared/models/enums";
import { IPresentUser, IUserPresenceState } from "shared/models/interfaces";
import useMessage from "shared/hooks/useMessage";
import { useRefetch } from "shared/providers/RefetchContext";

export const OpenApiProvider = ({ children }) => {
  const {
    doc,
    clients,
    provider,
    radarData,
    initialData,
    checkedNodes,
    currentView,
    isRadarView,
    highlightingMode,
    baseCommitContent,
    cleanSelection,
    setCheckedNodes,
    onSelectionChange,
  } = useApis();
  const message = useMessage();
  const { openApiProviderRef } = useApis();
  const [params, setParams] = useSearchParams();
  const { onRegisterRefetchFn } = useRefetch();
  const tagsRef = useRef<YTagsType>(new Y.Map());
  const pathsRef = useRef<YPatsType>(new Y.Map());
  const componentsRef = useRef<YComponentsType>(new Y.Map());
  const currentMethodRef = useRef<string>();
  const currentSchemaRef = useRef<string>();
  const [presenceState, setPresenceState] = useState<
    Record<string, IPresentUser[]>
  >({});

  const changesRef = useRef<any>({});
  const unobserveRef = useRef(null);
  const changeTypesRef = useRef<Map<string, EntityCommitChangeType>>(new Map());
  const changeSourcesRef = useRef<Map<string, string>>(new Map());
  const [collections, setCollections] = useState<Record<string, ICollection>>(
    {}
  );
  const [schema, setSchema] = useState<SchemaState>(null);
  const [endpoint, setEndpoint] = useState<EndpointState>(null);
  const [components, setComponents] = useState<Record<string, ComponentType>>(
    {}
  );
  const { currentMethod, currentSchema } = useMemo(
    () => ({
      currentMethod: params.get("method"),
      currentSchema: params.get("schema"),
    }),
    [params]
  );

  const updateEndpoint = useCallback(() => {
    if (currentMethodRef.current) {
      const [path, method] = parseMethodKey(currentMethodRef.current);
      const changes = getNestedProperty(
        changesRef.current,
        ["paths", currentMethodRef.current],
        {}
      );
      const changeType = getChangeType(changes);
      const data =
        pathsRef.current.get(currentMethodRef.current) ||
        (changeType === EntityCommitChangeType.CREATE && changes[0]); // Radar

      if (data) {
        const initialData = getNestedProperty<OpenAPIV3.OperationObject>(
          baseCommitContent,
          ["object", "paths", currentMethodRef.current]
        );
        const dataWithChanges = getMethodWithChanges(
          data,
          changeType,
          initialData,
          changes
        );
        setEndpoint({
          path,
          changes,
          changeType,
          data: dataWithChanges,
          key: currentMethodRef.current,
          method: method as OpenAPIV3.HttpMethods,
        });
      } else {
        setEndpoint(null);
      }
    } else {
      setEndpoint(null);
    }
  }, [isRadarView, baseCommitContent]);

  const updateSchema = useCallback(() => {
    if (currentSchemaRef.current) {
      const [_, name] = currentSchemaRef.current.split(":");
      const data = componentsRef.current.get(currentSchemaRef.current);

      if (data) {
        const path = ["components", currentSchemaRef.current];
        const changes = getNestedProperty(changesRef.current, path, {});
        const changeType = getChangeType(changes);

        setSchema({
          data,
          path,
          name,
          changes,
          changeType,
        });
      } else {
        setSchema(null);
      }
    } else {
      setSchema(null);
    }
  }, [baseCommitContent]);

  const updateComponents = useCallback(() => {
    const componentsJSON = componentsRef.current?.toJSON();
    setComponents(() =>
      parseComponents(
        componentsJSON,
        changesRef.current,
        changeTypesRef.current,
        isRadarView
      )
    );
  }, [isRadarView]);

  const updateCollections = useCallback(() => {
    try {
      const tagsJSON = tagsRef.current ? tagsRef.current.toJSON() : [];
      const pathsJSON = pathsRef.current ? pathsRef.current.toJSON() : {};
      setCollections(() =>
        parseCollections(
          tagsJSON,
          pathsJSON,
          changesRef.current,
          changeTypesRef.current,
          isRadarView
        )
      );
    } catch (error) {
      console.log("Update Collections error:", error);
    }
  }, [isRadarView]);

  const onAwarenessUpdate = useCallback(
    (key, value) => {
      if (provider) {
        provider.awareness.setLocalStateField(key, value);
      }
    },
    [provider]
  );

  const updateCollectionsDebounce = useCallback(
    debounce(updateCollections, 300),
    [updateCollections]
  );

  const updateComponentsDebounce = useCallback(
    debounce(updateComponents, 300),
    [updateComponents]
  );

  const updateEndpointDebounce = useCallback(debounce(updateEndpoint, 300), [
    updateEndpoint,
  ]);

  const updateSchemaDebounce = useCallback(debounce(updateSchema, 300), [
    updateSchema,
  ]);

  const addCollection = (data: TagObjectType): Promise<TagObjectType> => {
    return new Promise((resolve, reject) => {
      if (tagsRef.current.get(data.name)) {
        return reject(new Error("Collection already exists!"));
      }
      tagsRef.current.set(data.name, data);
      resolve(data);
    });
  };

  const addEndpoint = (
    path: string,
    method: OpenAPIV3.HttpMethods,
    tags: string[] = [],
    rest?: OpenAPIV3.OperationObject
  ): Promise<any> => {
    const methodKey = `${path}:${method}`;
    return new Promise((resolve, reject) => {
      if (pathsRef.current.get(methodKey)) {
        return reject(new Error("Method already exists!"));
      }
      const initialData = getMethodInitialData(method);
      initialData.tags = tags;
      initialData.operationId = generateOperationId(method, path);

      pathsRef.current.set(methodKey, { ...initialData, ...(rest || {}) });
      resolve(methodKey);
    });
  };

  const deleteEndpoint = (
    path: string,
    method: OpenAPIV3.HttpMethods
  ): void => {
    const methodKey = `${path}:${method}`;

    pathsRef.current.doc?.transact(() => {
      if (pathsRef.current.has(methodKey)) {
        pathsRef.current.delete(methodKey);
      } else {
        console.warn("Method does not exist!");
      }
    });
  };

  const getDataFromDoc = useCallback(
    (doc: Y.Doc) => {
      const object = doc.getMap("object");
      tagsRef.current = object.get("tags") as YTagsType;
      pathsRef.current = object.get("paths") as YPatsType;
      componentsRef.current = object.get("components") as YPatsType;

      updateEndpoint();
      updateComponents();
      updateCollections();

      const onTagsChange = (event) => {
        updateCollectionsDebounce();
      };

      const onPathsChange = (event) => {
        if (event.keysChanged.has(currentMethodRef.current)) {
          updateEndpoint();
        }
        updateCollectionsDebounce();
      };
      const onComponentsChange = (event) => {
        updateComponentsDebounce();
      };

      tagsRef.current?.observe(onTagsChange);
      pathsRef.current?.observe(onPathsChange);
      componentsRef.current?.observe(onComponentsChange);

      return () => {
        tagsRef.current?.unobserve(onTagsChange);
        pathsRef.current?.unobserve(onPathsChange);
        componentsRef.current?.unobserve(onComponentsChange);
      };
    },
    [
      updateEndpoint,
      updateComponents,
      updateCollections,
      updateComponentsDebounce,
      updateCollectionsDebounce,
    ]
  );

  const getDataFromJSON = useCallback((initialData) => {}, []);

  const onMethodChange = (payload: Partial<OpenAPIV3.OperationObject>) => {
    const current = pathsRef.current.get(currentMethodRef.current);
    if (current) {
      pathsRef.current.set(
        currentMethodRef.current,
        deepAssign(current, payload)
      );
    } else if (isRadarView) {
      setEndpoint((prev) => {
        const newState = deepAssign(prev, { data: payload });
        // if (changesRef.current?.paths[prev.key]) {
        //   changesRef.current.paths[prev.key] = [newState];
        // }
        return newState;
      });
    }
  };

  const openMethod = useCallback(
    (method: string) => {
      setParams(
        (prev) => {
          prev.set("method", method);
          return prev.toString();
        },
        { replace: true }
      );
    },
    [setParams]
  );

  const updateCollectionsSelection = (newState) => {
    Object.keys(collections).forEach((tag) => {
      if (collections[tag]) {
        const paths = isRadarView
          ? collections[tag].paths.filter((p) => p.changeType)
          : collections[tag].paths;

        newState.tags[tag] = !paths.some(({ key }) => newState.paths[key])
          ? 0
          : paths.every(({ key }) => newState.paths[key])
          ? 1
          : 2;
      }
    });
  };

  const updateRelatedPaths = (newState, type, id, value) => {
    if (!isRadarView) return;
    const pattern = `${type}.${id}`;
    const sourceChange = changeSourcesRef.current.get(pattern);
    if (sourceChange) {
      changeSourcesRef.current.forEach((val, key) => {
        if (sourceChange === val) {
          setNestedProperty(newState, key, value);
        }
      });
    }
  };

  const onSelectionToggle = (checked: boolean, type, id) => {
    setCheckedNodes((prev) => {
      const value = Number(checked);
      const newState = {
        ...prev,
        [type]: { ...prev[type], [id]: value },
      };
      // updateRelatedPaths(newState, type, id, value);
      if (type === "tags") {
        collections[id].paths.forEach(({ key, changeType }) => {
          if (isRadarView && !changeType) {
            return;
          }
          newState.paths[key] = value;
          // updateRelatedPaths(newState, "paths", key, value);
        });
      }
      updateCollectionsSelection(newState);
      onSelectionChange && onSelectionChange(newState);
      return newState;
    });
  };

  const setSourceKeyFromSelection = (type, changes) => {
    Object.keys(checkedNodes[type]).forEach((key) => {
      if (key) {
        if (checkedNodes[type][key]) {
          changes.add(changeSourcesRef.current.get(`${type}.${key}`));
        }
      }
    });
  };

  useImperativeHandle(openApiProviderRef, () => ({
    applyChanges: () => {
      let changes = new Set<string>();
      setSourceKeyFromSelection("paths", changes);
      setSourceKeyFromSelection("components", changes);
      // Apply all
      if (!changes.size) {
        changes = new Set(Array.from(changeSourcesRef.current.values()));
      }

      doc.transact(() => {
        // TODO: use api helpers
        const object = doc.getMap("object");
        const diffPatcher = EntityDiffPatch.getDiffPatcher(EntityType.API);
        try {
          changes.forEach((pattern) => {
            const [type, key] = pattern.split(".");
            const targetObject = object.get(type) as Y.Map<any>;
            const currentState = targetObject.get(key);
            const patch = getNestedProperty(changesRef.current, pattern);
            const changeType = getChangeType(patch);
            if (changeType === EntityCommitChangeType.CREATE) {
              const parts = key.split(":");
              const method = parts.pop() as OpenAPIV3.HttpMethods;
              const path = parts.join(":");
              addEndpoint(path, method, [], patch[0]);
            } else {
              const [success, newState] = diffPatcher.applyPatch(
                JSON.parse(JSON.stringify(currentState)),
                patch
              );
              if (success) {
                targetObject.set(key, newState);
              }
            }
          });
          message.success(
            "Changes have been successfully applied to the notebook!"
          );
        } catch (error) {
          message.handleError("Failed to apply changes!");
        }
      });
      cleanSelection();
    },
    cleanSelection: () => {
      cleanSelection();
    },
  }));

  useEffect(() => {
    if (!currentMethod && !currentSchema) {
      const fistPath = getFirstPath(Object.values(collections), 0);
      if (fistPath) {
        openMethod(fistPath.key);
      }
    }
  }, [collections, currentMethod]);

  const loadData = useCallback(() => {
    if (typeof unobserveRef.current === "function") {
      unobserveRef.current();
      unobserveRef.current = null;
    }

    if (doc) {
      unobserveRef.current = getDataFromDoc(doc);
    } else if (initialData) {
      getDataFromJSON(initialData);
    }
  }, [initialData, doc]);

  useEffect(() => {
    loadData();

    return () => {
      if (typeof unobserveRef.current === "function") {
        unobserveRef.current();
      }
    };
  }, [loadData]);

  useEffect(() => {
    return onRegisterRefetchFn(RefetchTargetType.API, loadData);
  }, [onRegisterRefetchFn, loadData]);

  useEffect(() => {
    currentMethodRef.current = currentMethod;
    updateEndpoint();
  }, [currentMethod]);

  useEffect(() => {
    currentSchemaRef.current = currentSchema;
    updateSchema();
  }, [currentSchema]);

  useEffect(() => {
    onAwarenessUpdate("currentPath", currentMethod || currentSchema);
  }, [currentSchema, currentMethod, onAwarenessUpdate]);

  const updateState = useCallback(() => {
    updateSchemaDebounce();
    updateEndpointDebounce();
    updateComponentsDebounce();
    updateCollectionsDebounce();
  }, [
    updateSchemaDebounce,
    updateEndpointDebounce,
    updateComponentsDebounce,
    updateCollectionsDebounce,
  ]);

  const updateChanges = useCallback(() => {
    const data = doc.getMap("object").toJSON() as OpenAPIV3.OperationObject;
    const patcher = EntityDiffPatch.getDiffPatcher(EntityType.API);

    if (baseCommitContent) {
      changesRef.current = patcher.getDiff(baseCommitContent.object, data);
    } else if (radarData) {
      const mergedData = deepAssign(clone(data), radarData.object); // TODO: Replace deepAssign to manual comparison
      changesRef.current = patcher.getDiff(data, mergedData);
    }
    changeTypesRef.current = getRefChangeTypesByDiff(changesRef.current, data);
    changeSourcesRef.current = getRootSourceChangesMap(
      changesRef.current,
      data
    );

    updateState();
  }, [updateState]);

  const updateChangesDebounce = useCallback(debounce(updateChanges, 300), [
    updateChanges,
  ]);

  useEffect(() => {
    const hasChanges = doc && (baseCommitContent?.object || radarData);
    if (hasChanges) {
      updateChanges();
      doc.getMap("object").observeDeep(updateChangesDebounce);
    } else {
      changesRef.current = {};
      changeTypesRef.current = new Map();
      updateState();
    }

    return () => {
      if (hasChanges) {
        doc.getMap("object").unobserveDeep(updateChangesDebounce);
      }
    };
  }, [
    doc,
    radarData,
    baseCommitContent,
    updateState,
    updateChanges,
    updateChangesDebounce,
  ]);

  useEffect(() => {
    setPresenceState(() => {
      if (!clients) return {};
      const newSate: IUserPresenceState = {};
      clients.forEach((c) => {
        if (c.user?._id) {
          const name = getClientUserName(c.user);
          const presentUser: IPresentUser = {
            name,
            id: c.user._id,
            color: c.user.color,
            avatar: c.user.iconUrl,
            focusElement: c.focusElement,
          };
          if (c.currentPath) {
            if (!newSate[c.currentPath]) newSate[c.currentPath] = [];
            newSate[c.currentPath].push(presentUser);
          }
        }
      });
      return newSate;
    });
  }, [clients]);

  const getVisibilityStyles = useCallback(
    (changeType: EntityCommitChangeType) => {
      const isDiffView = currentView === SystemViewTypes.DIFFS;
      return { opacity: isDiffView && !changeType ? "0.3" : 1 };
    },
    [currentView]
  );

  const getVisibility = useCallback(
    (changeType: EntityCommitChangeType) => {
      const isChangesView = currentView === SystemViewTypes.CHANGES;
      return !(isChangesView && !changeType);
    },
    [currentView]
  );

  const getHighlightingStyles = useCallback(
    (type: EntityCommitChangeType) => {
      switch (highlightingMode) {
        case ChangesViewMode.CHANGES:
          return getChangesStyles(type);
        case ChangesViewMode.XRAY:
          return getXrayStyles(type);
        default: // ChangesViewMode.NONE
          return getDefaultStyles(type);
      }
    },
    [radarData, highlightingMode]
  );

  const getHighlightingStylesByChanges = useCallback(
    (changes) => {
      const changeType = getChangeType(changes);
      return getHighlightingStyles(changeType);
    },
    [getHighlightingStyles]
  );

  return (
    <OpenApiContext.Provider
      value={{
        changes: changesRef.current,
        changeTypes: changeTypesRef.current,
        isRadarView,
        schema,
        endpoint,
        components,
        collections,
        presenceState,

        onMethodChange,
        addCollection,
        addEndpoint,
        deleteEndpoint,
        onAwarenessUpdate,
        onSelectionToggle,
        getVisibility,
        getVisibilityStyles,
        getHighlightingStyles,
        getHighlightingStylesByChanges,
        refetchData: loadData,
      }}
    >
      {children}
    </OpenApiContext.Provider>
  );
};

export interface OpenApiMethods {
  applyChanges?: () => void;
}

export const OpenApiContext = createContext<{
  changes: any;
  changeTypes: any;
  isRadarView: any;
  collections: Record<string, ICollection>;
  schema: SchemaState;
  endpoint: EndpointState;
  components: OpenAPIV3.ComponentsObject;
  presenceState: Record<string, IPresentUser[]>;

  addEndpoint: (
    path: string,
    method: OpenAPIV3.HttpMethods,
    tags?: string[]
  ) => Promise<string>;
  deleteEndpoint: (path: string, method: OpenAPIV3.HttpMethods) => void;
  onSelectionToggle: (checked: boolean, type: string, id: string) => void;
  onAwarenessUpdate: (key: string, value: any) => void;
  addCollection: (data: TagObjectType) => Promise<TagObjectType>;
  onMethodChange: (data: Partial<OpenAPIV3.OperationObject>) => void;
  getVisibility: (mode: EntityCommitChangeType) => boolean;
  getVisibilityStyles: (mode: EntityCommitChangeType) => Record<string, any>;
  getHighlightingStyles: (mode: EntityCommitChangeType) => Record<string, any>;
  getHighlightingStylesByChanges: (changes: any) => Record<string, any>;
  refetchData: () => void;
} | null>(null);

export function useOpenApi() {
  const context = useContext(OpenApiContext);
  if (context === null) {
    throw new Error("useOpenApi must be used within OpenApiProvider");
  }
  return context;
}

export interface EndpointState {
  key: string;
  path: string;
  changes: any;
  method: OpenAPIV3.HttpMethods;
  data: OpenAPIV3.OperationObject;
  changeType: EntityCommitChangeType;
}

export interface SchemaState {
  path: string[];
  name: string;
  changes: any;
  data: ComponentType;
  changeType: EntityCommitChangeType;
}
