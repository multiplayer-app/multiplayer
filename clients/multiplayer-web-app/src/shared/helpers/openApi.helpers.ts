import { OpenAPIV3 } from "openapi-types";
import { EntityDiffPatch } from "@multiplayer/entity";
import {
  ApiView,
  EntityCommitChangeType,
  EntityType,
} from "@multiplayer/types";

import {
  clone,
  containsKeyValue,
  deepAssign,
  getNestedProperty,
  isObjectEmpty,
  setNestedProperty,
} from "shared/utils";
import {
  getChangeType,
  getChangeTypesByDiff,
} from "shared/helpers/changes.helpers";
import { CodeEditorType } from "shared/components/Editors/CodeEditor";
import { ComponentType, ICollection } from "shared/models/openApi.types";

const DEFAULT_TAG_KEY = "___Default";

export const getFirstPath = (arr: ICollection[], index: number) => {
  if (index >= arr.length) return;
  return arr[index]?.paths[0] || getFirstPath(arr, index + 1);
};

export const parseCollections = (
  tags,
  paths,
  changes,
  changeTypes,
  includeCreatedItems = false
) => {
  const deletedTags = getDeletedItems(changes?.tags);
  const deletedPaths = getDeletedItems(changes?.paths);
  const createdPaths = includeCreatedItems
    ? getCreatedItems(changes?.paths)
    : {}; // Only Radar

  const allTags = { ...tags, ...deletedTags };
  const allPaths = { ...paths, ...deletedPaths, ...createdPaths };
  const tagsObj = {
    ...Object.keys(allTags)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      .reduce((acc, key) => {
        const tag = allTags[key];
        const tagChange = getNestedProperty(changes, ["tags", tag.name]);
        const changeType = getChangeType(tagChange);
        acc[tag.name] = { ...tag, changeType, key, paths: [] };
        return acc;
      }, {}),
    [DEFAULT_TAG_KEY]: {
      paths: [],
      name: "Default",
      isDefault: true,
      changeType: null,
      key: DEFAULT_TAG_KEY,
    },
  };

  const pushToCollection = (name, methodData) => {
    const targetCollection = tagsObj[name] || tagsObj[DEFAULT_TAG_KEY];
    targetCollection.paths.push(methodData);
    if (methodData.changeType && !targetCollection.changeType) {
      targetCollection.changeType = EntityCommitChangeType.UPDATE;
    }
  };

  Object.keys(allPaths)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .forEach((pattern) => {
      const methodObj = allPaths[pattern];
      const [path, method] = parseMethodKey(pattern);
      const methodData = {
        key: pattern,
        path,
        method,
        tags: methodObj.tags,
        isDeleted: methodObj.isDeleted,
        changeType: changeTypes.get(getMethodPath(pattern)),
      };
      if (Array.isArray(methodObj.tags) && methodObj.tags.length) {
        methodObj.tags.forEach((name) => {
          pushToCollection(name, methodData);
        });
      } else {
        pushToCollection(DEFAULT_TAG_KEY, methodData);
      }
    });

  return tagsObj;
};

export const getDeletedItems = (changesObj) => {
  if (!changesObj) return {};
  return Object.keys(changesObj).reduce((acc, key) => {
    const changeType = getChangeType(changesObj[key]);
    if (changeType === EntityCommitChangeType.DELETE) {
      acc[key] = { ...changesObj[key][0], isDeleted: true, isReadonly: true };
    }
    return acc;
  }, {});
};

export const getCreatedItems = (changesObj) => {
  if (!changesObj) return {};
  return Object.keys(changesObj).reduce((acc, key) => {
    const changeType = getChangeType(changesObj[key]);
    if (changeType === EntityCommitChangeType.CREATE) {
      acc[key] = { ...changesObj[key][0], isReadonly: true };
    }
    return acc;
  }, {});
};

export const parseComponents = (
  data: Record<string, unknown>,
  changes: any,
  changeTypes: Map<string, EntityCommitChangeType>,
  includeCreatedItems = false
): Record<string, ComponentType> => {
  const deletedComponents = getDeletedItems(changes?.components);
  const createdComponents = includeCreatedItems
    ? getCreatedItems(changes?.components)
    : {};
  const allComponents = {
    ...(data || {}),
    ...deletedComponents,
    ...createdComponents,
  };

  return Object.keys(allComponents).reduce((acc, key) => {
    const component = allComponents[key];
    const refPath = getRefPath(key);
    const changeType = changeTypes.get(refPath);

    acc[key] = {
      ...component,
      changeType,
      name: key.split(":")[1],
      isDeleted: component.isDeleted,
    };
    return acc;
  }, {});
};

export const getSchemaType = (obj) => {
  const { type, oneOf, $ref } = obj;
  return type
    ? type
    : $ref
    ? getRefName($ref)
    : oneOf
    ? oneOf.map(getSchemaType).join(" | ")
    : "";
};

export const parseDirection = (parts: string[]): string[] => {
  const mappings: Record<string, string> = {
    components: "",
    definitions: "schemas",
    parameters: "parameter",
    responses: "responses",
    securityDefinitions: "securitySchemes",
  };
  const firstPart = parts[0];
  if (mappings.hasOwnProperty(firstPart)) {
    parts[0] = mappings[firstPart];
  }
  return parts.filter(Boolean);
};

export const parseRef = (ref: string): string[] => {
  if (!ref) return [];
  const refWithoutHash = ref.substring(2);
  return parseDirection(refWithoutHash.split("/"));
};

export const getRefName = (ref: string): string => {
  return parseRef(ref)?.pop();
};

export const getRefSchema = (schema, components) => {
  if (!hasRelativeRef(schema)) return schema;
  const parsedRef = parseRef(schema.$ref).join(":");
  const nestedSchema = getNestedProperty(components, parsedRef);

  return getRefSchema(nestedSchema, components);
};

export const getEnumsSchema = (schema, components) => {
  if (schema.enum) {
    return schema;
  }

  if (hasRelativeRef(schema)) {
    const nestedSchema = getRefSchema(schema, components);
    if (nestedSchema.enum) {
      return nestedSchema;
    }
  }
  if (schema.items) {
    return getEnumsSchema(schema.items, components);
  }

  return {};
};

export const hasChildren = (schema, components): boolean => {
  const { properties, items, allOf, oneOf, enum: hasEnums } = schema;

  return Boolean(
    !hasEnums &&
      (allOf ||
        oneOf ||
        properties ||
        (items && hasChildren(items, components)) ||
        (hasRelativeRef(schema) &&
          hasChildren(getRefSchema(schema, components), components)))
  );
};

export const hasRelativeRef = (
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
) => {
  return isReferenceObject(schema) && schema.$ref.startsWith("#");
};

export const isReferenceObject = (
  object: OpenAPIV3.ReferenceObject | any
): object is OpenAPIV3.ReferenceObject => {
  return object && "$ref" in object;
};

export const isArraySchema = (
  object: OpenAPIV3.ArraySchemaObject | any
): object is OpenAPIV3.ArraySchemaObject => {
  return object && "items" in object;
};

export const isSchemaObject = (
  object: OpenAPIV3.SchemaObject | any
): object is OpenAPIV3.SchemaObject => {
  return object && "schema" in object;
};

export const scrollToLine = (
  editor: CodeEditorType,
  currentMethod: string,
  extension: string
) => {
  const [path, method] = parseMethodKey(currentMethod);
  const getLineIndex = () => {
    let isPath = false;
    return editor
      .getValue()
      .split("\n")
      .findIndex((line, index) => {
        const trimLine = line.trim();
        if (!trimLine) return false;
        if (!isPath) {
          isPath = trimLine.startsWith(
            extension === "json" ? `"${path}"` : path
          );
        } else {
          return trimLine.startsWith(
            extension === "json" ? `"${method}"` : method
          );
        }
      });
  };

  const lineNumber = getLineIndex() + 1;

  if (lineNumber > 0) {
    editor.revealLineNearTop(lineNumber);
    editor.setPosition({ column: 1, lineNumber });
  }
};

export const setupSchemaValidator = (
  monaco: any,
  extension: string,
  version: string
) => {
  if (extension !== "json") return;
  const versionDir = version.startsWith("2")
    ? "v2.0"
    : version.startsWith("3.0")
    ? "v3.0"
    : "v3.1";

  fetch(`${process.env.PUBLIC_URL}/schemas/OpenApi/${versionDir}/schema.json`)
    .then((r) => r.json())
    .then((schema) => {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [
          {
            schema,
            uri: schema.$id || schema.$schema,
            fileMatch: ["*"],
          },
        ],
      });
    })
    .catch((err) => {
      console.log("Fail to fetch schema!");
    });
};

const modifyParameters = (
  data: OpenAPIV3.OperationObject,
  baseData: OpenAPIV3.OperationObject
): OpenAPIV3.OperationObject => {
  // Update parameters
  const dataClone = clone(data);
  if (Array.isArray(dataClone.parameters)) {
    const baseParamsMap = Array.isArray(baseData?.parameters)
      ? baseData.parameters.reduce((acc, param) => {
          if (isReferenceObject(param)) {
            acc.set(param.$ref, param);
          } else {
            acc.set(param.name, param);
            return acc;
          }
        }, new Map())
      : new Map();

    const patcher = EntityDiffPatch.getDiffPatcher(EntityType.API);

    dataClone.parameters = dataClone.parameters.reduce((acc, param) => {
      const paramKey = isReferenceObject(param) ? param.$ref : param.name;
      const baseParam = baseParamsMap.get(paramKey);
      const changes = patcher.getDiff(baseParam, param);
      const changeType = getChangeType(changes);
      baseParamsMap.delete(paramKey); // Clean up updated params
      acc.push({
        ...param,
        changes,
        changeType,
      });
      return acc;
    }, []);

    // Only deleted params left in map
    baseParamsMap.forEach((value) => {
      dataClone.parameters.push({
        ...value,
        changeType: EntityCommitChangeType.DELETE,
      });
    });
  }
  return dataClone;
};

export const getMethodWithChanges = (
  data: OpenAPIV3.OperationObject,
  changeType: EntityCommitChangeType,
  baseData: OpenAPIV3.OperationObject,
  changes: any
): OpenAPIV3.OperationObject => {
  if (!baseData || changeType !== EntityCommitChangeType.UPDATE) {
    return data;
  }
  return modifyParameters(data, baseData);
};

export const getChangesStyles = (type: EntityCommitChangeType) => {
  switch (type) {
    case EntityCommitChangeType.CREATE:
      return { boxShadow: "inset 0 0 0 2px #00C889" };
    case EntityCommitChangeType.UPDATE:
      return { boxShadow: "inset 0 0 0 2px #0091FF" };
    case EntityCommitChangeType.DELETE:
      return {
        boxShadow: "inset 0 0 0 2px #FF0000",
        textDecoration: "line-through",
      };
    default:
      return {};
  }
};

export const getXrayStyles = (type: EntityCommitChangeType) => {
  switch (type) {
    case EntityCommitChangeType.CREATE:
      return {
        boxShadow: "inset 0 0 0 2px #00C889",
        background: "none",
      };
    case EntityCommitChangeType.UPDATE:
      return {
        boxShadow: "inset 0 0 0 2px #0091FF",
        background: "none",
      };
    case EntityCommitChangeType.DELETE:
      return {
        boxShadow: "inset 0 0 0 2px #FF0000",
        textDecoration: "line-through",
        background: "none",
      };
    default:
      return {
        background: "none",
        boxShadow: "inset 0 0 0 1px var(--chakra-colors-gray-200)",
      };
  }
};

export const getDefaultStyles = (type: EntityCommitChangeType) => {
  switch (type) {
    case EntityCommitChangeType.DELETE:
      return { display: "none" };
    default:
      return {};
  }
};

export const getFormattedComponentRef = (ref) => {
  return ["components", parseRef(ref).join(":")].join(".");
};

export const getRefChangeType = (
  ref: string,
  changeTypes: Map<string, EntityCommitChangeType>
): EntityCommitChangeType => {
  if (!ref) return;
  return changeTypes.get(getFormattedComponentRef(ref));
};

export const getRootSourceChangesMap = (
  diff,
  data: OpenAPIV3.OperationObject
) => {
  const changesMap = new Map();
  const componentsRefs = new Map();

  const paths = getNestedProperty(data, "paths", {});
  const components = getNestedProperty(data, "components", {});

  const pathsDiff = getNestedProperty(diff, "paths", {});
  const componentsDiff = getNestedProperty(diff, "components", {});

  for (const key in pathsDiff) {
    if (pathsDiff.hasOwnProperty(key)) {
      changesMap.set(`paths.${key}`, `paths.${key}`);
    }
  }

  for (const key in componentsDiff) {
    if (componentsDiff.hasOwnProperty(key)) {
      changesMap.set(`components.${key}`, `components.${key}`);
    }
  }

  for (const key in componentsDiff) {
    if (componentsDiff.hasOwnProperty(key)) {
      const refPath = getRefPath(key);
      componentsRefs.set(refPath, refPath);
    }
  }

  const visitedRefs = new Map();

  while (componentsRefs.size !== 0) {
    const firstRef = componentsRefs.keys().next().value;
    if (visitedRefs.has(firstRef)) {
      continue;
    } else {
      const parents = getParentRefs(firstRef, components, getRefPath);
      visitedRefs.set(firstRef, componentsRefs.get(firstRef));
      parents.forEach((_, ref) => {
        if (!visitedRefs.has(ref)) {
          componentsRefs.set(ref, componentsRefs.get(firstRef));
        }
      });
    }
    componentsRefs.delete(firstRef);
  }

  for (const key in paths) {
    if (paths.hasOwnProperty(key)) {
      const method = paths[key];
      const fullPath = getMethodPath(key);
      if (changesMap.has(fullPath)) continue;
      visitedRefs.forEach((_, ref) => {
        if (containsKeyValue(method, "$ref", ref)) {
          changesMap.set(
            fullPath,
            getFormattedComponentRef(visitedRefs.get(ref))
          );
        }
      });
    }
  }

  visitedRefs.forEach((value, key) => {
    changesMap.set(
      getFormattedComponentRef(key),
      getFormattedComponentRef(value)
    );
  });

  return changesMap;
};

export const getRefChangeTypesByDiff = (
  diff: any,
  data: OpenAPIV3.OperationObject
) => {
  const paths = getNestedProperty(data, "paths", {});
  const components = getNestedProperty(data, "components", {});
  const componentsDiff = getNestedProperty(diff, "components", {});

  const componentsRefs = new Map();
  const allChanges = getChangeTypesByDiff(diff);

  for (const key in componentsDiff) {
    if (componentsDiff.hasOwnProperty(key)) {
      const refPath = getRefPath(key);
      const change = componentsDiff[key];
      componentsRefs.set(refPath, getChangeType(change));
    }
  }

  const visitedRefs = new Map();

  while (componentsRefs.size !== 0) {
    const firstRef = componentsRefs.keys().next().value;
    componentsRefs.delete(firstRef);
    if (visitedRefs.has(firstRef)) {
      continue;
    } else {
      visitedRefs.set(firstRef, EntityCommitChangeType.UPDATE);
      const parents = getParentRefs(firstRef, components, getRefPath);
      parents.forEach((_, ref) => {
        if (!visitedRefs.has(ref)) {
          componentsRefs.set(ref, EntityCommitChangeType.UPDATE);
        }
      });
    }
  }

  for (const key in paths) {
    if (paths.hasOwnProperty(key)) {
      const method = paths[key];
      const fullPath = getMethodPath(key);
      if (allChanges.has(fullPath)) continue;
      visitedRefs.forEach((_, ref) => {
        if (containsKeyValue(method, "$ref", ref)) {
          allChanges.set(fullPath, EntityCommitChangeType.UPDATE);
        }
      });
    }
  }

  if (visitedRefs.size) {
    allChanges.set("components", EntityCommitChangeType.UPDATE);
  }
  return new Map([...visitedRefs, ...allChanges]);
};

const getParentRefs = (
  ref: string,
  data: object,
  pathParser: (key) => string
) => {
  const parentRefs = new Map();
  Object.keys(data).forEach((key) => {
    const hasRef = containsKeyValue(data[key], "$ref", ref);
    if (hasRef) {
      const refPath = pathParser(key);
      parentRefs.set(refPath, EntityCommitChangeType.UPDATE);
    }
  });
  return parentRefs;
};

export const getMethodPath = (key) => {
  return `paths.${key}`;
};

// TODO: add handling for OpenApi v2.0 keys
export const getRefPath = (key) => {
  const [type, name] = key.split(":");
  return `#/components/${type}/${name}`;
};

export const parseMethodKey = (key) => {
  const lastColonIndex = key.lastIndexOf(":");
  return [key.substring(0, lastColonIndex), key.substring(lastColonIndex + 1)];
};

export function getNewViewName(views: { [id: string]: ApiView }) {
  let lastNumber = 0;
  const regex = /View [0-9]*$/g;
  Object.values(views).forEach((v) => {
    if (v.name.match(regex)) {
      lastNumber = +v.name.split(" ")[1];
    }
  });

  return `View ${lastNumber + 1}`;
}

export function getFullSchema(schemaRef, openApiDoc) {
  if (!schemaRef) return;

  const visitedRefs = new Set();

  function resolveRef(ref) {
    const refPath = ref.split("/").slice(1); // Remove the initial '#'
    let resolved = openApiDoc;
    refPath.forEach((part) => {
      resolved = resolved[part];
    });
    return { ...resolved, $originalRef: ref };
  }

  function traverseSchema(schema) {
    if (!schema || visitedRefs.has(schema)) return schema;

    visitedRefs.add(schema);

    if (schema.$ref) {
      const resolvedSchema = resolveRef(schema.$ref);
      return traverseSchema(resolvedSchema);
    }

    if (schema.properties) {
      for (const property in schema.properties) {
        schema.properties[property] = traverseSchema(
          schema.properties[property]
        );
      }
    }

    if (schema.items) {
      schema.items = traverseSchema(schema.items);
    }

    if (schema.allOf) {
      schema.allOf = schema.allOf.map((subSchema) => traverseSchema(subSchema));
      schema.allOf.forEach((subSchema) => {
        schema = deepAssign(schema, subSchema);
      });
    }

    if (schema.oneOf) {
      schema.oneOf = schema.oneOf.map((subSchema) => traverseSchema(subSchema));
      schema.oneOf.forEach((subSchema) => {
        schema = deepAssign(schema, subSchema);
      });
    }

    if (schema.anyOf) {
      schema.anyOf = schema.anyOf.map((subSchema) => traverseSchema(subSchema));
      schema.anyOf.forEach((subSchema) => {
        schema = deepAssign(schema, subSchema);
      });
    }

    return schema;
  }

  return traverseSchema(
    schemaRef.$ref ? resolveRef(schemaRef.$ref) : schemaRef
  );
}

export function findExtraFields(originalSchema, partialSchema) {
  let extraFields = {};

  if (partialSchema.type && partialSchema.type !== originalSchema.type) {
    return partialSchema;
  }

  function compareSchemas(original, partial, path = "") {
    if (
      !original ||
      typeof original !== "object" ||
      !partial ||
      typeof partial !== "object"
    ) {
      return;
    }

    for (const key in partial) {
      const currentPath = path ? `${path}.${key}` : key;
      if (!(key in original)) {
        // Key does not exist in the original schema
        setNestedProperty(extraFields, currentPath, partial[key]);
      } else if (
        typeof partial[key] !== typeof original[key] ||
        (key !== "properties" &&
          partial[key].type &&
          partial[key].type !== original[key].type)
      ) {
        // Type is different, consider the whole object as extra
        setNestedProperty(extraFields, currentPath, partial[key]);
      } else {
        // TODO: Fix later
        if (Array.isArray(original[key].oneOf)) {
          original[key].oneOf.forEach((subSchema) => {
            compareSchemas(subSchema, partial[key], currentPath);
          });
        } else if (Array.isArray(original[key].allOf)) {
          original[key].allOf.forEach((subSchema) => {
            compareSchemas(subSchema, partial[key], currentPath);
          });
        } else if (Array.isArray(original[key].anyOf)) {
          original[key].anyOf.forEach((subSchema) => {
            compareSchemas(subSchema, partial[key], currentPath);
          });
        } else if (original[key].items && partial[key].items) {
          compareSchemas(
            original[key].items,
            partial[key].items,
            `${currentPath}.items`
          );
        } else {
          compareSchemas(original[key], partial[key], currentPath);
        }
      }
    }

    if (getNestedProperty(extraFields, path)) {
      if (partial.type && path.split(".").pop() !== "properties") {
        setNestedProperty(extraFields, `${path}.type`, partial.type);
      }
      if (original.$originalRef) {
        setNestedProperty(extraFields, `${path}.$ref`, original.$originalRef);
      }
      if (original.oneOf) {
        setNestedProperty(extraFields, `${path}.oneOf`, original.oneOf);
      }
      if (original.allOf) {
        setNestedProperty(extraFields, `${path}.allOf`, original.allOf);
      }
      if (original.anyOf) {
        setNestedProperty(extraFields, `${path}.anyOf`, original.anyOf);
      }
    }
  }

  compareSchemas(originalSchema, partialSchema);

  if (!isObjectEmpty(extraFields)) {
    extraFields["type"] = partialSchema.type;
    const { $originalRef, oneOf, allOf, anyOf, type } = originalSchema;

    if ($originalRef) {
      extraFields["$ref"] = $originalRef;
    }
    // if (allOf) {
    //   extraFields = { type, allOf: [...allOf, extraFields] };
    // }
    // if (oneOf) {
    //   extraFields = { type, oneOf: [...oneOf, extraFields] };
    // }
    // if (anyOf) {
    //   extraFields = { type, anyOf: [...anyOf, extraFields] };
    // }
  }

  return extraFields;
}

const convertToNestedObject = (object) => {
  const nested = {};
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      const element = object[key];
      setNestedProperty(nested, key, element);
    }
  }
  return nested;
};
