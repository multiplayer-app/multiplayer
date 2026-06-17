import { useEffect, useMemo, useRef, useState } from "react";
import {
  EntityType,
  ComponentType,
  ComponentTypeToNameMap,
} from "@multiplayer/types";
import {
  Box,
  Flex,
  Text,
  Alert,
  Modal,
  Stack,
  Button,
  HStack,
  Select,
  FormLabel,
  ModalBody,
  AlertIcon,
  IconButton,
  FormControl,
  CloseButton,
  ModalHeader,
  ModalFooter,
  ModalOverlay,
  ModalContent,
  AlertDescription,
  ModalCloseButton,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { ChevronLeftIcon } from "@chakra-ui/icons";
import {
  EntityCategories,
  PostHogEvents,
  SortingDirection,
} from "../../models/enums";
import { PlusPolygonIcon } from "shared/icons";
import NodeIcon from "shared/components/NodeIcon";
import SlugifiedInput from "shared/components/SlugifiedInput";
import { isSystemView } from "shared/helpers/diagram.helpers";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { sortAlphabetically } from "shared/helpers/general.helpers";
import SelectionIndicator from "shared/components/SelectionIndicator";

import { useDiagramState } from "../../providers/DiagramContext";
import { useEntities } from "../../providers/EntitiesContext";
import MultiSelectFilter from "../MultiSelectFilter";
import useMessage from "../../hooks/useMessage";
import DebounceSearch from "../DebounceSearch";
import SwitchButtons from "../SwitchButtons";
import DisplayTags from "../DisplayTags";
import Table from "../Table";
import { ITableSorting } from "shared/models/interfaces";

const AddComponentModal = ({
  disclosure,
  onClose,
  onComponentsImport,
  sourceName,
}) => {
  const { path } = useParams();
  const message = useMessage();
  const containerRef = useRef();
  const { trackEvent } = useAnalytics();
  const { entities, onEntityCreate } = useEntities();

  const [selectedRows, setSelectedRows] = useState({});
  const [filters, setFilters] = useState(initialFilters);
  const [sorting, setSorting] = useState<ITableSorting | null>(null);
  const [creatingComponent, setCreatingComponent] = useState(false);

  const [showNoSelectionAlert, setShowNoSelectionAlert] = useState(false);
  const [newComponent, setNewComponent] = useState(newComponentDefaultState);
  const { currentViewId, componentsInPlatform, nodes, groups } =
    useDiagramState();

  const systemView = isSystemView(currentViewId);

  const handleComponentCreate = async () => {
    try {
      await onEntityCreate({
        key: newComponent.name.trim(),
        type: EntityType.PLATFORM_COMPONENT,
        metaSummary: { type: newComponent.type },
      });
      setFilters(initialFilters);
      setCreatingComponent(false);
      setNewComponent(newComponentDefaultState);
    } catch (err) {
      message.handleError(err);
    }
  };

  const handleNameChange = (newValue: string) => {
    setNewComponent((prev) => ({ ...prev, name: newValue }));
  };

  const handleTypeChange = (e) => {
    setNewComponent((prev) => ({ ...prev, type: e.target.value }));
  };

  const components = useMemo(() => {
    const entitiesInPlatform = () => {
      return componentsInPlatform
        .reduce((acc, { id, linkedTo, groupId }) => {
          const entity = entities[EntityCategories.COMPONENT].find(
            (e) => e.entityId === linkedTo
          );
          const isAlreadyInView = !!nodes.get(id);
          if (entity && !isAlreadyInView) {
            acc.push({ ...entity, nodeId: id, group: groups.get(groupId) });
          }
          return acc;
        }, [])
        .sort((a, b) =>
          sortAlphabetically(a.key.toLowerCase(), b.key.toLowerCase())
        );
    };

    const allEntities = () => {
      const linkedEntities = new Set(
        Array.from(nodes.values()).map((n) => n.linkedTo)
      );
      return entities[EntityCategories.COMPONENT]
        .map((e) => ({ ...e, isAdded: linkedEntities.has(e.entityId) }))
        .sort((a, b) =>
          sortAlphabetically(a.key.toLowerCase(), b.key.toLowerCase())
        );
    };
    return systemView ? allEntities() : entitiesInPlatform();
  }, [componentsInPlatform, systemView, entities, groups, nodes]);

  const tableData = useMemo(() => {
    let data = components.map((c) => ({
      _id: c.nodeId || c.entityId, // nodeId is for custom views, entityId is for All view
      entityName: c.key,
      tags: c.tags || [],
      type: c.metadata?.type,
      isAdded: c.isAdded,
      description: c.metadata?.shortDescription || c.shortDescription,
    }));

    if (!filters.isAdded) {
      data = data.filter((c) => !c.isAdded);
    }

    if (filters.query.length > 0) {
      data = data.filter((c) =>
        c.entityName.toLowerCase().includes(filters.query.toLowerCase())
      );
    }

    if (filters.type.length) {
      data = data.filter((d) => !!filters.type.find((t) => t.value === d.type));
    }

    if (filters.tags.length) {
      data = data.filter((d) =>
        d.tags.some((t) => filters.tags.some((f) => f.value === t.value))
      );
    }

    if (sorting) {
      data.sort((a, b) =>
        sorting.direction.toString() === SortingDirection.ASC
          ? b.entityName.localeCompare(a.entityName)
          : a.entityName.localeCompare(b.entityName)
      );
    }
    return data;
  }, [components, sorting, filters]);

  const selectedComponents = useMemo(() => {
    return Object.keys(selectedRows)
      .filter((k) => !!selectedRows[k])
      .map((index) => {
        return tableData[index]?._id;
      });
  }, [selectedRows, tableData]);

  useEffect(() => {
    setSelectedRows({});
  }, [sorting]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    components.forEach((c) => {
      c.tags?.forEach((t) => set.add(t.value));
    });
    return Array.from(set).map((tag) => ({ label: tag, value: tag }));
  }, [components]);

  const onAllRowsSelect = (isSelected: boolean) => {
    const selection = isSelected
      ? tableData.reduce((acc, _, index) => {
          acc[index] = isSelected;
          return acc;
        }, {})
      : {};

    setSelectedRows(selection);
  };

  const handleAddClick = () => {
    const componentsToAdd = selectedComponents;
    if (componentsToAdd.length) {
      onComponentsImport(componentsToAdd);
      trackEvent(PostHogEvents.ADD_COMPONENT_TO_PLATFORM, {
        platformId: path,
      });
      disclosure.onClose();
    } else {
      setShowNoSelectionAlert(true);
    }
  };

  const handleSetFilters = (key, newVal) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: newVal,
    }));
    setSelectedRows({});
  };

  const resetComponentCreation = () => {
    setCreatingComponent(false);
    setNewComponent(newComponentDefaultState);
  };

  // TODO use componentsTable component here
  return (
    <Box ref={containerRef}>
      <Modal
        isCentered
        size="4xl"
        isOpen={disclosure.isOpen}
        closeOnOverlayClick={false}
        onCloseComplete={onClose}
        onClose={disclosure.onClose}
        portalProps={{ containerRef }}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            padding="0"
            background={creatingComponent ? "bg.surface" : "bg.primary"}
            borderRadius="24px 24px 0 0"
          >
            {creatingComponent ? (
              <Flex alignItems="center" p="24px">
                <IconButton
                  mr="2"
                  size="sm"
                  variant="ghost"
                  color="muted"
                  aria-label="back"
                  borderRadius="8"
                  icon={<ChevronLeftIcon />}
                  onClick={resetComponentCreation}
                />

                <Text>Create a new Component</Text>
              </Flex>
            ) : (
              <Flex direction="column">
                <DebounceSearch
                  showSearchIcon={false}
                  hideDeleteButton={true}
                  inputProps={searchInputProps}
                  inputGroupProps={searchInputGroupProps}
                  onSearch={(query) => handleSetFilters("query", query)}
                />
                <Flex
                  w="100%"
                  px="6"
                  py="4"
                  position="relative"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  {selectedComponents.length > 0 && (
                    <Flex
                      flex="1"
                      top={4}
                      zIndex={1}
                      position="absolute"
                      w="calc(100% - 24px)"
                      bg="whiteAlpha.700"
                    >
                      <SelectionIndicator
                        fontSize="sm"
                        count={selectedComponents.length}
                        onResetSelection={() => {
                          setSelectedRows({});
                        }}
                      />
                    </Flex>
                  )}
                  <Flex fontSize="xs" color="muted" gap="3" alignItems="center">
                    <MultiSelectFilter
                      options={componentTypes}
                      selection={filters.type}
                      setSelection={handleSetFilters}
                      selectionKey="type"
                      filterName="Type"
                    />
                    <MultiSelectFilter
                      options={allTags}
                      searchable={true}
                      selection={filters.tags}
                      setSelection={handleSetFilters}
                      selectionKey="tags"
                      filterName="Tags"
                    />
                    {systemView && (
                      <Flex alignItems="center" gap="2">
                        Show:
                        <SwitchButtons
                          options={visibilityOptions(sourceName)}
                          value={filters.isAdded}
                          onChange={(isAdded) => {
                            setFilters((prev) => ({ ...prev, isAdded }));
                            setSelectedRows({});
                          }}
                        />
                      </Flex>
                    )}
                  </Flex>

                  <Flex gap="2" fontSize="xs" color="muted" alignItems="center">
                    Results:
                    <Box
                      px="1"
                      py="0.5"
                      bg="bg.subtle"
                      color="muted"
                      borderRadius="4px"
                      border="1px solid"
                      borderColor="blackAlpha.100"
                    >
                      {tableData.length}
                    </Box>
                  </Flex>
                </Flex>
                {showNoSelectionAlert && (
                  <Alert status="error" w="100%">
                    <AlertIcon mr="12px" />
                    <Flex fontSize="sm" fontWeight="500">
                      <AlertDescription>
                        No component is selected to add into the {sourceName}.
                        Click on a component row in the table to immediately add
                        it, or check multiple components and click Add to{" "}
                        {sourceName}
                      </AlertDescription>
                    </Flex>
                    <CloseButton
                      top={-1}
                      right={-1}
                      position="relative"
                      alignSelf="flex-start"
                      onClick={() => setShowNoSelectionAlert(false)}
                    />
                  </Alert>
                )}
              </Flex>
            )}
          </ModalHeader>
          <ModalCloseButton color="muted" zIndex="2" m="3" />
          <ModalBody p="0" flex="1">
            {creatingComponent ? (
              <Flex h="300px" p="24px">
                <Stack h="200px" w="100%" gap="4" pb="4">
                  <HStack gap="4">
                    <FormControl isRequired>
                      <FormLabel>Name</FormLabel>
                      <SlugifiedInput
                        key="name"
                        autoFocus
                        value={newComponent.name}
                        placeholder="Enter component's name"
                        onChange={handleNameChange}
                      ></SlugifiedInput>
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Type</FormLabel>
                      <Select
                        name="type"
                        value={newComponent.type}
                        onChange={handleTypeChange}
                      >
                        {Object.values(ComponentType).map((t) => (
                          <option key={t} value={t}>
                            {ComponentTypeToNameMap[t]}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </HStack>
                </Stack>
              </Flex>
            ) : (
              <Flex
                h="300px"
                direction="column"
                __css={{ ".table-wrapper .custom-scrollbar": { px: 6 } }}
              >
                <Table
                  useRowSelection
                  data={tableData}
                  columns={columns}
                  sorting={sorting}
                  selectRowOnClick={true}
                  setSorting={setSorting}
                  selectedRows={selectedRows}
                  setSelectedRows={setSelectedRows}
                  onAllRowsSelect={onAllRowsSelect}
                  noDataText="There are no components."
                />
              </Flex>
            )}
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor="border.primary">
            {creatingComponent ? (
              <>
                {" "}
                <Button
                  isDisabled={!newComponent.name}
                  onClick={handleComponentCreate}
                >
                  Create component
                </Button>
              </>
            ) : systemView ? (
              <>
                <Button
                  p="0"
                  mr="auto"
                  variant="base"
                  color="brand.500"
                  leftIcon={<PlusPolygonIcon />}
                  onClick={() => {
                    setCreatingComponent(true);
                  }}
                >
                  Create a new component
                </Button>
                <Button
                  onClick={handleAddClick}
                  isDisabled={!selectedComponents.length}
                >
                  Add to the {sourceName}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleAddClick}
                isDisabled={!selectedComponents.length}
              >
                Add to the view
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

const initialFilters = {
  type: [],
  tags: [],
  query: "",
  isAdded: false,
};

const searchInputGroupProps = {
  padding: "0",
  margin: "0",
};

const searchInputProps = {
  p: "24px",
  height: "68px",
  margin: "0",
  border: "none",
  boxShadow: "none",
  outline: "none",
  _focus: {
    border: "none",
    boxShadow: "none",
    outline: "none",
  },
  placeholder: "Search for components",
  borderRadius: "16px 16px 0px 0px",
  background: "bg.surface",
};

const componentTypes = [
  {
    label: ComponentTypeToNameMap[ComponentType.GENERIC],
    value: ComponentType.GENERIC,
  },
  {
    label: ComponentTypeToNameMap[ComponentType.CLIENT],
    value: ComponentType.CLIENT,
  },
  {
    label: ComponentTypeToNameMap[ComponentType.SERVICE],
    value: ComponentType.SERVICE,
  },
  {
    label: ComponentTypeToNameMap[ComponentType.PLATFORM],
    value: ComponentType.PLATFORM,
  },
];

const newComponentDefaultState = {
  name: "",
  tags: "",
  type: ComponentType.GENERIC,
};

const columns = [
  {
    field: "entityName",
    name: "Name",
    sortable: true,
    component: ({ entityName, type }) => (
      <Flex alignItems="center" userSelect="none">
        <NodeIcon type={type} mr="8px" />
        <Flex>{entityName}</Flex>
      </Flex>
    ),
  },
  {
    field: "type",
    name: "Type",
    width: "100px",
    component: ({ type }) =>
      type && (
        <Text userSelect="none">
          {ComponentTypeToNameMap[ComponentType[type.toUpperCase()]]}
        </Text>
      ),
  },
  {
    field: "description",
    name: "Description",
  },
  {
    field: "tags",
    name: "Tags",
    width: "150px",
    component: ({ tags }) => (
      <Flex gap="1" py="1" flexWrap="wrap">
        <DisplayTags tags={tags} />
      </Flex>
    ),
  },
];

const visibilityOptions = (
  sourceName: string
): { label: string; value: boolean }[] => [
  {
    label: "All",
    value: true,
  },
  {
    label: `Not in ${sourceName}`,
    value: false,
  },
];
export default AddComponentModal;
