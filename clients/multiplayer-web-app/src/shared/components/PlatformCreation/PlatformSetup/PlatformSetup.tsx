import { ComponentType, ComponentTypeToNameMap } from "@multiplayer/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { extractKeyValue } from "@multiplayer/util-shared";
import { v4 as uuidv4 } from "uuid";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import cs from "classnames";

import useMessage from "shared/hooks/useMessage";
import TagInput from "shared/components/TagInput";
import NodeIcon from "shared/components/NodeIcon";
import DisplayTags from "shared/components/DisplayTags";
import SlugifiedInput from "shared/components/SlugifiedInput";

import { useVersion } from "shared/providers/VersionContext";
import { useEntities } from "shared/providers/EntitiesContext";
import { IExtractedTableData } from "shared/models/interfaces";
import ComponentsTable from "shared/components/ComponentsTable";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import { createEntitiesBulkAI } from "shared/services/version.service";

import { groupBy } from "shared/utils";
import {
  ComponentTypeEnum,
  EntityCategories,
  PostHogEvents,
} from "shared/models/enums";
import {
  COLUMN_WIDTH,
  ROW_HEIGHT,
} from "shared/components/Editors/PixiDiagram/Editor/configs";
import { InfoCircleIcon, PlusCircleFilledIcon } from "shared/icons";

interface PlatformSetupProps {
  onPlatformSubmit?: (entityId: string) => void;
}

const PlatformSetup = ({ onPlatformSubmit }: PlatformSetupProps) => {
  const message = useMessage();
  const { trackEvent } = useAnalytics();

  const { currentBranchId } = useVersion();
  const { entities } = useEntities();
  const { openAlertDialog } = useAlertDialog();

  const [platformName, setPlatformName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showError, setShowError] = useState(false);
  const [selectedRows, setSelectedRows] = useState<{
    [key: string]: boolean;
  }>({});
  const [tableData, setTableData] = useState<IExtractedTableData[]>([]);
  const [editingRow, setEditingRow] = useState({
    row: null,
    field: "",
  });

  useEffect(() => {
    if (entities[EntityCategories.COMPONENT]?.length) {
      setTableData(
        entities[EntityCategories.COMPONENT].map((component) => {
          return {
            name: component.key,
            position: {
              x: 0,
              y: 0,
            },
            type: ComponentTypeEnum[component.metadata?.type?.toUpperCase()],
            fileId: null,
            isSystem: true,
            _id: component.entityId,
            entityId: component.entityId,
            description: component.metadata?.shortDescription,
            dependencies: [],
            tags: component.tags || [],
          };
        })
      );
    }
  }, [entities]);

  const onFieldUpdate = useCallback(
    (field: string, value: unknown, row: IExtractedTableData): void => {
      setTableData((prevData) => {
        const rowIndex = prevData.findIndex((i) => i._id === row._id);
        if (rowIndex === -1) return prevData;
        const updatedData = [...prevData];
        updatedData[rowIndex][field] = value;
        return updatedData;
      });
    },
    []
  );

  const filterPlatformData = (UID: string, field: string): void => {
    const filteredData = tableData.filter((data) => data[field] !== UID);
    const selectionObject = filteredData.reduce((acc, num, index) => {
      acc[index] = !!selectedRows[index];
      return acc;
    }, {});

    setSelectedRows(selectionObject);

    setTableData(filteredData);
  };

  const onValidSubmit = async (): Promise<void> => {
    try {
      setSubmitting(true);
      const selectedComponents = Object.keys(selectedRows)
        .filter((k) => !!selectedRows[k])
        .map((index) => {
          return tableData[index];
        });

      const response = await createEntitiesBulkAI(currentBranchId, {
        name: platformName,
        components: Object.values(groupBy(selectedComponents, "type"))
          .map((group, x) =>
            group.map(({ name, type, dependencies, tags, description }, y) => ({
              name,
              type,
              tags,
              dependencies,
              position: { x: x * COLUMN_WIDTH, y: y * ROW_HEIGHT },
              metadata: description ? { shortDescription: description } : {},
            }))
          )
          .flat(),
      });

      const createdPlatformId = response.platform.entityId;

      trackEvent(PostHogEvents.CREATE_PLATFORM, {
        platformName,
        platformId: createdPlatformId,
        actionSource: "Project platform modal",
      });

      onPlatformSubmit(createdPlatformId);
      setSubmitting(false);
      setShowError(false);
    } catch (error) {
      message.handleError(error);
      setSubmitting(false);
    }
  };

  const genericComponentValue = (
    key: string,
    id: string
  ): IExtractedTableData => {
    return {
      name: key,
      position: {
        x: 0,
        y: 0,
      },
      type: ComponentTypeEnum.SERVICE,
      fileId: null,
      _id: id,
      entityId: id,
      dependencies: [],
      isSystem: false,
      description: "",
      tags: [],
    };
  };

  const onComponentDelete = useCallback(
    async (UID: string) => {
      const result = await openAlertDialog({
        title: "Delete component",
        description:
          "Are you sure you want to delete this component? Components cannot exist without a name.",
      });
      if (result) {
        filterPlatformData(UID, "_id");
        setShowError(false);
      }
    },
    [tableData, openAlertDialog, selectedRows, setShowError, filterPlatformData]
  );

  useEffect(() => {
    setIsAdding(!!tableData.find((row) => row.name === ""));
  }, [tableData, setIsAdding, selectedRows]);

  const columns = useMemo(() => {
    return [
      {
        field: "name",
        name: "Name",
        sortable: true,
        component: (row: IExtractedTableData) => {
          const fieldName = "entityName";
          return (
            <Flex
              alignItems="center"
              w="full"
              pl="2px"
              ml="-2px"
              wordBreak="break-word"
              userSelect="none"
            >
              <NodeIcon type={row.type?.toLowerCase() || "generic"} mr={2} />
              {row.isSystem ? (
                row[fieldName]
              ) : (
                <InputGroup>
                  <Input
                    placeholder="Enter name"
                    fontSize="sm"
                    p={0}
                    height="38px"
                    border="unset"
                    boxShadow="none"
                    backgroundColor="transparent"
                    fontWeight="medium"
                    defaultValue={row[fieldName]}
                    autoFocus={
                      editingRow.row === row._id &&
                      editingRow.field === fieldName
                    }
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      if (isAdding && !showError && e.target.value) {
                        setShowError(true);
                      }
                    }}
                    onFocus={() => {
                      setTimeout(() => {
                        if (
                          !(
                            editingRow.row === row._id &&
                            editingRow.field === fieldName
                          )
                        ) {
                          setEditingRow({
                            row: row._id,
                            field: fieldName,
                          });
                        }
                      });
                    }}
                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                    onBlur={async (e) => {
                      setEditingRow({
                        row: "",
                        field: "",
                      });
                      onFieldUpdate("name", e.target.value, row);
                      if (
                        !e.target.value &&
                        editingRow.row === row._id &&
                        showError
                      ) {
                        await onComponentDelete(row._id);
                      }
                    }}
                    _placeholder={{ color: "muted" }}
                    _hover={{ border: "unset" }}
                    _focusVisible={{ border: "unset", boxShadow: "none" }}
                  />
                  {isAdding && !row[fieldName] && showError && (
                    <InputRightElement top="auto" justifyContent="right">
                      <Tooltip label="Name is required" openDelay={500}>
                        <Icon as={InfoCircleIcon}></Icon>
                      </Tooltip>
                    </InputRightElement>
                  )}
                </InputGroup>
              )}
            </Flex>
          );
        },
      },
      {
        field: "type",
        name: "Type",
        width: "150px",
        sortable: true,
        component: (row: IExtractedTableData) => {
          return (
            <Box w="full" onClick={(e) => e.stopPropagation()}>
              {row.isSystem ? (
                ComponentTypeToNameMap[row.type?.toLowerCase()]
              ) : (
                <Select
                  name="type"
                  backgroundColor="transparent"
                  size="sm"
                  border="none"
                  fontWeight="500"
                  rootProps={{ marginLeft: "-12px" }}
                  cursor="pointer"
                  _focus={{
                    boxShadow: "none",
                  }}
                  value={row.type}
                  onChange={(e) => {
                    onFieldUpdate("type", e.target.value, row);
                    setEditingRow({ row: null, field: "" });
                  }}
                >
                  {Object.values(ComponentType).map((t) => (
                    // Ai prompt requires uppercase type
                    <option key={t} value={t.toUpperCase()}>
                      {ComponentTypeToNameMap[t]}
                    </option>
                  ))}
                </Select>
              )}
            </Box>
          );
        },
      },
      {
        field: "description",
        name: "Description",
        sortable: false,
        component: (row: IExtractedTableData) => {
          return row.isSystem ? (
            <Box>{row.description}</Box>
          ) : (
            <Input
              placeholder="Enter description"
              fontSize="sm"
              p={0}
              border="unset"
              boxShadow="none"
              backgroundColor="transparent"
              fontWeight="medium"
              value={row.description}
              autoFocus={
                editingRow.row === row._id && editingRow.field === "description"
              }
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                onFieldUpdate("description", e.target.value, row);
              }}
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              onFocus={() => {
                if (
                  !(
                    editingRow.row === row._id &&
                    editingRow.field === "description"
                  )
                ) {
                  setEditingRow({
                    row: row._id,
                    field: "description",
                  });
                }
              }}
              onBlur={() => {
                setEditingRow({
                  row: "",
                  field: "",
                });
              }}
              _placeholder={{ color: "muted" }}
              _hover={{ border: "unset" }}
              _focusVisible={{ border: "unset", boxShadow: "none" }}
            />
          );
        },
      },
      {
        field: "tags",
        name: "Tags",
        width: "150px",
        sortable: false,
        component: (row: IExtractedTableData) => {
          const fieldName = "tags";
          return row.isSystem ? (
            <Flex py="1" gap="1" flexWrap="wrap">
              <DisplayTags tags={row.tags} visibleTagsCount={3} />
            </Flex>
          ) : (
            <TagInput
              onChange={(tags: string[]) => {
                onFieldUpdate(
                  fieldName,
                  tags.map((t) => {
                    return typeof t === "string" ? extractKeyValue(t) : t;
                  }),
                  row
                );
                setEditingRow({
                  row: row._id,
                  field: fieldName,
                });
              }}
              onClick={(e) => e.stopPropagation()}
              value={(row.tags as any) || []}
              autoFocus={
                editingRow.row === row._id && editingRow.field === fieldName
              }
              showIcon={false}
              boxProps={{
                border: "none",
                px: 0,
                backgroundColor: "inherit",
              }}
            />
          );
        },
      },
    ];
  }, [editingRow.field, editingRow.row, onFieldUpdate]);

  const rowClasses = (row: IExtractedTableData) =>
    cs({
      is_system: row.isSystem,
    });

  const onAddNewComponentRow = () => {
    if (!isAdding) {
      const newId = uuidv4();
      setShowError(false);
      setTableData([...tableData, genericComponentValue("", newId)]);
      setEditingRow({
        row: newId,
        field: "entityName",
      });
    }
  };

  return (
    <Stack>
      {tableData.length || platformName ? (
        <Stack my="6" spacing={4} direction="row" w="full">
          <FormControl isRequired>
            <FormLabel>Platform name</FormLabel>
            <SlugifiedInput
              width="full"
              autoFocus={true}
              value={platformName}
              placeholder="Enter platform name"
              onChange={(a) => setPlatformName(a)}
              onFocus={() => setEditingRow({ row: null, field: "" })}
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            />
            <Text fontSize="xs" mt="1" color="muted">
              The name may contain only lowercase letters, numbers or dashes.
              Must start with a letter only. E.g. 'main-platform-v1',
              'multiplayer-app'.
            </Text>
          </FormControl>
        </Stack>
      ) : null}

      <Box
        className="platform-component-table"
        sx={{
          "tr:not(.is_system)": {
            background: "#f7f8fe",
          },
        }}
      >
        <ComponentsTable
          height="auto"
          data={tableData}
          columns={columns}
          selectedRows={selectedRows}
          isAIExtracted={true}
          setSelectedRows={setSelectedRows}
          rowClasses={rowClasses}
          searchProps={{
            hideDelete: true,
            showSearchIcon: true,
            inputProps: {},
          }}
          customTags={true}
          tableWrapperHeight={tableData.length > 5 ? "300px" : "auto"}
        />
        <Flex
          width="full"
          alignItems="center"
          cursor="pointer"
          pl="3"
          py="2"
          borderBottom="1px solid"
          borderColor="border.primary"
          onClick={onAddNewComponentRow}
        >
          <Icon
            as={PlusCircleFilledIcon}
            width={4}
            height={4}
            mr={2}
            __css={{
              path: {
                fill: submitting ? "muted" : "brand.500",
              },
            }}
          />
          <Text color={isAdding ? "muted" : "brand.500"} fontWeight="500">
            Add a component
          </Text>
        </Flex>
      </Box>
      <Flex gap={4} justifyContent="flex-end" py={6}>
        <Button
          colorScheme="blue"
          isLoading={submitting}
          isDisabled={!platformName || submitting || (isAdding && showError)}
          onClick={() => onValidSubmit()}
        >
          Create a platform
        </Button>
      </Flex>
    </Stack>
  );
};

export default PlatformSetup;
