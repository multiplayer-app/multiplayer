import {
  Box,
  Flex,
  Icon,
  Button,
  Collapse,
  useDisclosure,
} from "@chakra-ui/react";
import { v4 as uuidv4 } from "uuid";
import { useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { AddCircleIcon } from "shared/icons";
import ResizableBox from "shared/components/ResizableBox";
import DebounceSearch from "shared/components/DebounceSearch/DebounceSearch";

import useMessage from "shared/hooks/useMessage";
import { useOpenApi } from "shared/providers/OpenApiContext";
import { toggleStateSet } from "shared/helpers/useState.helpers";

import MethodItem from "./MethodItem";
import ExplorerItem from "./ExplorerItem";
import ComponentItem from "./ComponentItem";
import CollectionForm from "./CollectionForm";
import CreateEndpointModal from "../CreateEndpointModal";
import VisibilityController from "../VisibilityController";
import ViewsCheckbox from "./ViewsCheckbox";
import { useApis } from "shared/providers/ApisContext";
import { getNestedProperty } from "shared/utils";

const schemaComponentsUUid = uuidv4();

const Explorer = ({ readonly, isSplitView }) => {
  const message = useMessage();
  const [query, setQuery] = useState("");
  const [params, setParams] = useSearchParams();
  const createEndpointDisclosure = useDisclosure();
  const [expanded, setExpanded] = useState(new Set());
  const [newCollection, setNewCollection] = useState(false);
  const [targetCollection, setTargetCollection] = useState();
  const { customViews, currentView } = useApis();
  const {
    components,
    collections,
    changeTypes,
    addEndpoint,
    addCollection,
    getVisibilityStyles,
    getHighlightingStyles,
  } = useOpenApi();

  const viewsFilter = customViews[currentView];

  const filteredCollections = useMemo(() => {
    const filtered = filterCollections(Object.values(collections), viewsFilter);
    if (!query) return filtered;
    const q = query.toLowerCase();
    const newList = filtered.filter((c) => {
      const isMatch =
        c.name.toLowerCase().includes(q) ||
        c.paths.some((p) => p.path.toLowerCase().includes(q));
      return isMatch;
    });
    return newList;
  }, [collections, query, viewsFilter]);

  const filteredComponents = useMemo(() => {
    const filtered = filterComponents(components, viewsFilter);
    if (!query) return filtered;
    const q = query.toLowerCase();
    const newList = Object.keys(filtered).reduce((acc, key) => {
      if (key.toLowerCase().includes(q)) {
        acc[key] = components[key];
      }
      return acc;
    }, {});
    return newList;
  }, [components, query, viewsFilter]);

  const currentMethod = params.get("method");
  const currentSchema = params.get("schema");

  useEffect(() => {
    if (currentMethod && collections) {
      setExpanded((prev) => {
        const collection = Object.values(collections).find((c) =>
          c.paths.some((p) => p.key === currentMethod)
        );
        if (!collection) return prev;
        const newState = new Set(prev);
        newState.add(collection.name);
        return newState;
      });
    }
  }, [collections, currentMethod]);

  useEffect(() => {
    if (currentSchema) {
      setExpanded((prev) => {
        const newState = new Set(prev);
        newState.add(schemaComponentsUUid);
        return newState;
      });
    }
  }, [currentMethod]);

  const openEndpoint = (key) => {
    params.delete("schema");
    params.set("method", key);
    setParams(params.toString(), { replace: true });
  };

  const openComponent = (key) => {
    params.delete("method");
    params.set("schema", key);
    setParams(params.toString(), { replace: true });
  };

  const handleCreateCollection = async (body) => {
    try {
      const res = await addCollection(body);
      setNewCollection(false);
      setExpanded(toggleStateSet(res.name));
    } catch (error) {
      message.handleError(error);
    }
  };

  const handleCreateEndpoint = async ({ path, method, tag }) => {
    try {
      const res = await addEndpoint(path, method, tag ? [tag] : []);
      createEndpointDisclosure.onClose();
      openEndpoint(res);
    } catch (error) {
      message.handleError(error);
    }
  };

  const openCreateEndpointModal = (target = null) => {
    setTargetCollection(target);
    createEndpointDisclosure.onOpen();
  };

  return (
    <ResizableBox
      as={Flex}
      minH="0"
      minW={320}
      direction="column"
      borderRight="solid 1px"
      w={isSplitView ? 320 : 460}
      borderRightColor="border.primary"
    >
      <Box px="4">
        <DebounceSearch onSearch={setQuery} />
      </Box>

      <Flex flexDirection="column" flex="1" minH="0">
        <Box flex="1" overflowY="scroll">
          {filteredCollections.map((collection) => (
            <VisibilityController
              key={collection.name}
              changeType={collection.changeType}
            >
              <ExplorerItem
                name={collection.name}
                isExpanded={expanded.has(collection.name)}
                onToggle={() => setExpanded(toggleStateSet(collection.name))}
                leftIcon={
                  <ViewsCheckbox
                    type="tags"
                    data={collection}
                    id={collection.name}
                    changeType={collection.changeType}
                    isDisabled={
                      collection.isDefault ||
                      collection.isDeleted ||
                      !collection.paths.length
                    }
                  />
                }
                {...getVisibilityStyles(collection.changeType)}
                {...getHighlightingStyles(collection.changeType)}
              >
                {collection.paths.map((item) => (
                  <VisibilityController
                    key={item.key}
                    changeType={item.changeType}
                  >
                    <MethodItem
                      data={item}
                      isActive={params.get("method") === item.key}
                      onOpen={openEndpoint}
                    />
                  </VisibilityController>
                ))}
                {!readonly && !collection.isDeleted && (
                  <Button
                    px="2"
                    autoFocus
                    border="0"
                    bg="bg.surface"
                    variant="base"
                    color="muted"
                    fontFamily="JetBrains Mono, sans-serif"
                    justifyContent="flex-start"
                    leftIcon={<Icon as={AddCircleIcon} />}
                    transition="all .2s cubic-bezier(.87, 0, .13, 1)"
                    onClick={() => {
                      openCreateEndpointModal(
                        collection.isDefault ? null : collection.name
                      );
                    }}
                    _hover={{ bg: "bg.subtle" }}
                  >
                    Create a new method
                  </Button>
                )}
              </ExplorerItem>
            </VisibilityController>
          ))}

          {Object.keys(filteredComponents).length ? (
            <>
              <hr />
              <ExplorerItem
                name="Schemas"
                isExpanded={expanded.has(schemaComponentsUUid)}
                onToggle={() =>
                  setExpanded(toggleStateSet(schemaComponentsUUid))
                }
                {...getVisibilityStyles(changeTypes.get("components"))}
                {...getHighlightingStyles(changeTypes.get("components"))}
              >
                {Object.keys(filteredComponents).map((componentKey) => {
                  const component = components[componentKey];
                  return (
                    <VisibilityController
                      key={componentKey}
                      changeType={component.changeType}
                    >
                      <ComponentItem
                        data={component}
                        componentKey={componentKey}
                        isActive={params.get("schema") === componentKey}
                        onOpen={openComponent}
                      />
                    </VisibilityController>
                  );
                })}
              </ExplorerItem>
            </>
          ) : null}
        </Box>
        {!readonly && (
          <Box>
            <Collapse in={newCollection} unmountOnExit>
              <CollectionForm onSubmit={handleCreateCollection} />
            </Collapse>
            <Flex p="4" gap="4">
              <Button flex="1" onClick={() => openCreateEndpointModal()}>
                Create a method
              </Button>
              <Button
                flex="1"
                variant="light"
                onClick={() => setNewCollection((prev) => !prev)}
              >
                Create a collection
              </Button>
            </Flex>
          </Box>
        )}
      </Flex>

      <CreateEndpointModal
        onSubmit={handleCreateEndpoint}
        disclosure={createEndpointDisclosure}
        targetCollection={targetCollection}
      />
    </ResizableBox>
  );
};

const filterCollections = (collections, viewsFilter) => {
  if (!viewsFilter) return collections;
  const tags = getNestedProperty(viewsFilter, ["tags"], {});
  const paths = getNestedProperty(viewsFilter, ["paths"], {});

  return collections.reduce((acc, item) => {
    const isInTags = tags[item.name];
    if (isInTags) {
      acc.push(item);
    } else {
      const filteredPaths = item.paths.filter((p) => paths[p.key]);
      if (filteredPaths.length) {
        acc.push({ ...item, paths: filteredPaths });
      }
    }

    return acc;
  }, []);
};

const filterComponents = (components, viewsFilter) => {
  // return components; // TODO: ask about components in custom views
  if (!viewsFilter) return components;
  const filter = getNestedProperty(viewsFilter, ["components"], {});
  return Object.keys(components).reduce((acc, key) => {
    if (filter[key]) {
      acc[key] = components[key];
    }
    return acc;
  }, {});
};
export default Explorer;
