import { v4 as uuidv4 } from "uuid";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EntityCommitChangeType,
  EnvironmentVariable,
} from "@multiplayer/types";
import {
  Flex,
  Icon,
  IconButton,
  InputGroup,
  InputRightElement,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { InfoCircleIcon, PlusCircleFilledIcon, TrashIcon } from "shared/icons";
import Table from "shared/components/Table";
import { getNestedProperty } from "shared/utils";
import DebounceSearch from "shared/components/DebounceSearch";
import { useEntities } from "shared/providers/EntitiesContext";
import { getChangeType } from "shared/helpers/changes.helpers";
import MultiSelectFilter from "shared/components/MultiSelectFilter";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import SelectionIndicator from "shared/components/SelectionIndicator";
import { IPresentUser, ITableSorting } from "shared/models/interfaces";
import ChangedInputWrapper from "shared/components/ChangedInputWrapper";
import PresenceAvatarGroup from "shared/components/PresenceAvatarGroup";
import { EntityCategories, SortingDirection } from "shared/models/enums";
import ChangedSwitchWrapper from "shared/components/ChangedSwitchWrapper";
import useVariables from "shared/hooks/useVariables";

interface VariableRow extends EnvironmentVariable {
  _id?: string;
  isNew?: boolean;
  changeType?: EntityCommitChangeType;
}

const newVariableInitialState: VariableRow = {
  id: "",
  name: "",
  required: false,
  description: "",
  defaultValue: "",
  environments: {},
};

enum InvalidNameReason {
  "EMPTY" = "EMPTY",
  "DUPLICATE" = "DUPLICATE",
}

const invalidNameMessages = {
  [InvalidNameReason.EMPTY]: "Name is required",
  [InvalidNameReason.DUPLICATE]: "Name should be unique",
};

const Variables = ({
  onChange,
  variables,
  getPresentUsers,
  setFocusedElement,
  readonly,
  changesDiff,
}: {
  getPresentUsers: (controlName: string) => IPresentUser[];
  setFocusedElement: (elementPath: string) => void;
  onChange: (id: string, variable: EnvironmentVariable) => void;
  variables: { [id: string]: EnvironmentVariable };
  changesDiff: any;
  readonly: boolean;
}) => {
  const { entities } = useEntities();
  const { openAlertDialog } = useAlertDialog();
  const {
    getChangedFieldStyles,
    getPreviousFieldValue,
    getDeletedVariables,
    disabledRows,
    isNameDuplicate,
  } = useVariables({
    changesDiff,
  });
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [environmentsToShow, setEnvironmentsToShow] = useState([]);
  const [newVariable, setNewVariable] = useState<VariableRow>(
    newVariableInitialState
  );

  const [selectedRows, setSelectedRows] = useState({});
  const [sorting, setSorting] = useState<ITableSorting | null>(null);

  const [editingRow, setEditingRow] = useState({
    row: null,
    field: "",
  });

  const [invalidNames, setInvalidNames] = useState<{
    [id: string]: InvalidNameReason;
  }>({});

  const variablesTableData: VariableRow[] = useMemo(() => {
    const deletedVariables = getDeletedVariables();

    let varArray = Object.values(variables).map((variable) => ({
      ...variable,
      _id: variable.id,
      changeType: changesDiff && getChangeType(changesDiff[variable.id]),
    }));

    deletedVariables && varArray.push(...deletedVariables);

    if (searchQuery?.length > 0) {
      varArray = varArray.filter((v) =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sorting) {
      varArray.sort((a, b) =>
        sorting.direction.toString() === SortingDirection.ASC
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name)
      );
    }
    if (!isAdding && !varArray?.length && !searchQuery) {
      setIsAdding(true);
      setNewVariable({ ...newVariableInitialState, id: uuidv4() });
      return;
    }
    return isAdding
      ? [
          ...varArray,
          {
            ...newVariableInitialState,
            isNew: true,
          },
        ]
      : varArray;
  }, [changesDiff, variables, isAdding, sorting, searchQuery]);

  useEffect(() => {
    const invalidVars = {};
    variablesTableData.forEach(({ id, name, isNew }) => {
      if (!isNew && !name) {
        invalidVars[id] = InvalidNameReason.EMPTY;
      }
      if (isNameDuplicate(id, name, variablesTableData)) {
        invalidVars[id] = InvalidNameReason.DUPLICATE;
      }
    });

    setInvalidNames(invalidVars);
  }, [variablesTableData]);

  const changeFieldValue = useCallback(
    (variableRow: VariableRow, fieldName: string, newVal: string | boolean) => {
      const newValue = typeof newVal === "string" ? newVal.trimStart() : newVal;
      const { changeType, ...row } = variableRow;
      if (fieldName.startsWith("env-")) {
        const envId = fieldName.split("-")[1];
        onChange(row.id, {
          ...row,
          environments: {
            ...row.environments,
            [envId]: newValue.toString(),
          },
        });
      } else {
        row[fieldName] = newValue;
        onChange(row.id, row);
      }

      if (fieldName === "name") {
        if (!newValue.toString().trim()) {
          setInvalidNames((prev) => ({
            ...prev,
            [row.id]: InvalidNameReason.EMPTY,
          }));
        } else {
          if (
            isNameDuplicate(row.id, newValue.toString(), variablesTableData)
          ) {
            setInvalidNames((prev) => ({
              ...prev,
              [row.id]: InvalidNameReason.DUPLICATE,
            }));
          } else {
            if (invalidNames[row.id]) {
              setInvalidNames((prev) => {
                delete prev[row.id];
                return { ...prev };
              });
            }
          }
        }
      }
    },
    [invalidNames, onChange, variablesTableData]
  );

  const resetFieldValue = useCallback(
    (
      variable: VariableRow,
      fieldId: string,
      isEnvironment: boolean = false,
      changeType: EntityCommitChangeType = EntityCommitChangeType.UPDATE
    ) => {
      if (changeType === EntityCommitChangeType.UPDATE) {
        changeFieldValue(
          variable,
          isEnvironment ? "env-" + fieldId : fieldId,
          getPreviousFieldValue(variable.id, fieldId, isEnvironment)
        );
      } else {
        if (changeType === EntityCommitChangeType.DELETE) {
          onChange(variable.id, variable);
        } else {
          onChange(variable.id, undefined);
        }
      }
    },
    [onChange, getPreviousFieldValue, changeFieldValue]
  );

  const onAllRowsSelect = useCallback(
    (isSelected: boolean) => {
      const selection = isSelected
        ? variablesTableData.reduce((acc, _, index) => {
            acc[index] = isSelected;
            return acc;
          }, {})
        : {};

      setSelectedRows(selection);
    },
    [variablesTableData, setSelectedRows]
  );

  const existingEnvironments = useMemo(() => {
    return entities[EntityCategories.ENVIRONMENT].map(({ key, entityId }) => ({
      label: key,
      value: entityId,
    }));
  }, [entities]);

  useEffect(() => {
    setEnvironmentsToShow(existingEnvironments);
  }, [existingEnvironments]);

  const selectedVariables = useMemo(() => {
    return Object.keys(selectedRows)
      .filter((k) => !!selectedRows[k])
      .map((index) => {
        return variablesTableData[index]?._id;
      });
  }, [selectedRows, variablesTableData]);

  const deleteSelectedVariables = useCallback(() => {
    selectedVariables.forEach((id) => {
      onChange(id, undefined);
    });

    setSelectedRows({});
  }, [onChange, selectedVariables]);

  const onVariableDelete = useCallback(
    async (event: any, variableId?: string) => {
      const result = await openAlertDialog({
        title: "Delete variables",
        description: `Are you sure you want to delete ${
          variableId
            ? "this variable? Variables cannot exist without a name."
            : "selected variables?"
        }`,
      });
      if (result) {
        variableId
          ? onChange(variableId, undefined)
          : deleteSelectedVariables();
      }
    },
    [onChange, deleteSelectedVariables, openAlertDialog]
  );

  const columns = useMemo(() => {
    const environments = environmentsToShow.map(({ label, value: envId }) => ({
      field: "env-" + envId,
      name: label,
      width: 250,
      component: (row: VariableRow) => {
        const { isNew, id, environments, changeType } = row;
        const rowId = isNew ? "newRow" : id;
        const inputPath = `var-env-${envId}-${id}`;
        const presentUsers = getPresentUsers(inputPath);

        const fieldChangeType =
          changeType === EntityCommitChangeType.UPDATE &&
          changesDiff[id]?.environments &&
          changesDiff[id]?.environments[envId]
            ? EntityCommitChangeType.UPDATE
            : undefined;

        return (
          <InputGroup
            alignItems="center"
            paddingRight={fieldChangeType ? "1" : "0"}
          >
            <ChangedInputWrapper
              inputProps={{
                isReadOnly: readonly,
                background: "transparent",
                placeholder: "Enter a value",
                value: isNew
                  ? newVariable.environments[envId] || ""
                  : environments[envId],
                autoFocus:
                  editingRow.row === rowId &&
                  editingRow.field === "env-" + envId,
                disabled: changeType === EntityCommitChangeType.DELETE,
                onFocus: () => {
                  setFocusedElement(inputPath);
                  if (
                    !(
                      editingRow.row === rowId &&
                      editingRow.field === "env-" + envId
                    )
                  ) {
                    setEditingRow({
                      row: rowId,
                      field: "env-" + envId,
                    });
                  }
                },
                onChange: (e) => {
                  const newValue = e.target.value;
                  if (isNew) {
                    setNewVariable((prev) => ({
                      ...prev,
                      environments: {
                        ...prev.environments,
                        [envId]: newValue,
                      },
                    }));
                  } else {
                    changeFieldValue(row, "env-" + envId, newValue);
                  }
                },
              }}
              wrapperProps={{
                styleProps: {
                  borderColor: "transparent",
                  ...getChangedFieldStyles(changeType),
                },
                changeType: fieldChangeType,
                tooltipValue: getPreviousFieldValue(id, envId, true),
                onResetValue: () => {
                  resetFieldValue(row, envId, true);
                },
              }}
            />
            {!!presentUsers.length && (
              <InputRightElement
                top="auto"
                justifyContent="right"
                mr={fieldChangeType ? "40px" : "8px"}
              >
                <PresenceAvatarGroup users={getPresentUsers(inputPath)} />
              </InputRightElement>
            )}
          </InputGroup>
        );
      },
    }));
    return [
      {
        field: "name",
        name: "Name",

        width: 200,
        sortable: true,
        component: (row: VariableRow) => {
          const { isNew, name, id, changeType } = row;
          const rowId = isNew ? "newRow" : id;
          const inputPath = `var-name-${id}`;
          const presentUsers = getPresentUsers(inputPath);

          const fieldChangeType =
            changeType === EntityCommitChangeType.UPDATE
              ? getChangeType(getNestedProperty(changesDiff, [id, "name"]))
              : changeType;

          return (
            <InputGroup
              alignItems="center"
              paddingRight={fieldChangeType ? "1" : "0"}
            >
              <ChangedInputWrapper
                inputProps={{
                  isReadOnly: readonly,
                  background: "transparent",
                  placeholder: "Enter a name",
                  autoFocus:
                    editingRow.row === rowId && editingRow.field === "name",
                  onFocus: () => {
                    setFocusedElement(inputPath);
                    if (
                      !(editingRow.row === rowId && editingRow.field === "name")
                    )
                      setEditingRow({
                        row: rowId,
                        field: "name",
                      });
                  },
                  value: isNew ? newVariable.name : name,
                  disabled: changeType === EntityCommitChangeType.DELETE,
                  _disabled: { opacity: "1", cursor: "not-allowed" },
                  onBlur: async () => {
                    setEditingRow({
                      row: "",
                      field: "",
                    });

                    const { id: newId, name: newName } = newVariable;

                    if (isNew && newName) {
                      onChange(newId, newVariable);
                      setNewVariable(newVariableInitialState);
                      setIsAdding(false);
                    }

                    if (!isNew && !name) {
                      await onVariableDelete(null, id);
                    }
                  },
                  onChange: (e) => {
                    const newName = e.target.value;
                    if (isNew) {
                      setNewVariable((prev) => ({
                        ...prev,
                        name: newName,
                      }));
                    } else {
                      changeFieldValue(row, "name", newName);
                    }
                  },
                }}
                wrapperProps={{
                  styleProps: { borderColor: "transparent" },
                  changeType: fieldChangeType,
                  tooltipValue: getPreviousFieldValue(id, "name"),
                  onResetValue: () => {
                    resetFieldValue(row, "name", false, changeType);
                  },
                }}
              />
              {(invalidNames[id] || !!presentUsers.length) && (
                <InputRightElement
                  top="auto"
                  justifyContent="right"
                  mr={fieldChangeType ? "32px" : "0"}
                >
                  <PresenceAvatarGroup users={presentUsers} />
                  {invalidNames[id] && (
                    <Tooltip
                      label={invalidNameMessages[invalidNames[id]]}
                      openDelay={500}
                    >
                      <Icon as={InfoCircleIcon} />
                    </Tooltip>
                  )}
                </InputRightElement>
              )}
            </InputGroup>
          );
        },
      },
      {
        field: "required",
        name: "Required",
        width: 100,
        component: (row: VariableRow) => {
          const { required, isNew, changeType, id } = row;

          const fieldChangeType =
            changeType === EntityCommitChangeType.UPDATE &&
            getChangeType(getNestedProperty(changesDiff, [id, "required"]));

          return (
            <Flex paddingRight={fieldChangeType ? "1" : "0"} w="100%" h="100%">
              <ChangedSwitchWrapper
                switchProps={{
                  isReadOnly: readonly,
                  colorScheme: "brand",
                  background: "transparent",
                  isChecked: isNew ? newVariable.required : required,
                  disabled: changeType === EntityCommitChangeType.DELETE,
                  onChange: (e) => {
                    if (isNew) {
                      setNewVariable((prev) => ({
                        ...prev,
                        required: e.target.checked,
                      }));
                    } else {
                      changeFieldValue(row, "required", e.target.checked);
                    }
                  },
                }}
                wrapperProps={{
                  styleProps: {
                    borderColor: "transparent",
                    ...getChangedFieldStyles(changeType),
                  },
                  tooltipValue: getPreviousFieldValue(id, "required"),
                  changeType: fieldChangeType,
                  onResetValue: () => {
                    resetFieldValue(row, "required");
                  },
                }}
              />
            </Flex>
          );
        },
      },
      {
        field: "description",
        name: "Description",
        width: 200,
        component: (row: VariableRow) => {
          const { isNew, id, description, changeType } = row;
          const rowId = isNew ? "newRow" : id;
          const inputPath = `var-description-${id}`;
          const presentUsers = getPresentUsers(inputPath);

          const fieldChangeType =
            changeType === EntityCommitChangeType.UPDATE &&
            getChangeType(getNestedProperty(changesDiff, [id, "description"]));

          return (
            <InputGroup
              alignItems="center"
              paddingRight={fieldChangeType ? "1" : "0"}
            >
              <ChangedInputWrapper
                inputProps={{
                  isReadOnly: readonly,
                  background: "transparent",
                  placeholder: "Enter a description",
                  value: isNew ? newVariable.description : description,
                  disabled: changeType === EntityCommitChangeType.DELETE,
                  autoFocus:
                    editingRow.row === rowId &&
                    editingRow.field === "description",
                  onFocus: () => {
                    setFocusedElement(inputPath);
                    if (
                      !(
                        editingRow.row === rowId &&
                        editingRow.field === "description"
                      )
                    ) {
                      setEditingRow({
                        row: rowId,
                        field: "description",
                      });
                    }
                  },
                  onChange: (e) => {
                    const newValue = e.target.value;
                    if (isNew) {
                      setNewVariable((prev) => ({
                        ...prev,
                        description: newValue,
                      }));
                    } else {
                      changeFieldValue(row, "description", newValue);
                    }
                  },
                }}
                wrapperProps={{
                  styleProps: {
                    borderColor: "transparent",
                    ...getChangedFieldStyles(changeType),
                  },
                  changeType: fieldChangeType,
                  tooltipValue: getPreviousFieldValue(id, "description"),
                  onResetValue: () => {
                    resetFieldValue(row, "description");
                  },
                }}
              />
              {!!presentUsers.length && (
                <InputRightElement
                  top="auto"
                  justifyContent="right"
                  mr={fieldChangeType ? "32px" : "0"}
                >
                  <PresenceAvatarGroup users={getPresentUsers(inputPath)} />
                </InputRightElement>
              )}
            </InputGroup>
          );
        },
      },
      {
        field: "defaultValue",
        name: "Default Value",
        width: 200,
        component: (row: VariableRow) => {
          const { isNew, defaultValue, id, changeType } = row;
          const rowId = isNew ? "newRow" : id;
          const inputPath = `var-defaultValue-${id}`;
          const presentUsers = getPresentUsers(inputPath);

          const fieldChangeType =
            changeType === EntityCommitChangeType.UPDATE &&
            getChangeType(getNestedProperty(changesDiff, [id, "defaultValue"]));

          return (
            <InputGroup
              alignItems="center"
              paddingRight={fieldChangeType ? "1" : "0"}
            >
              <ChangedInputWrapper
                inputProps={{
                  isReadOnly: readonly,
                  background: "transparent",
                  placeholder: "Enter a default value",
                  value: isNew ? newVariable.defaultValue : defaultValue,
                  disabled: changeType === EntityCommitChangeType.DELETE,
                  autoFocus:
                    editingRow.row === rowId &&
                    editingRow.field === "defaultValue",
                  onFocus: () => {
                    setFocusedElement(inputPath);
                    if (
                      !(
                        editingRow.row === rowId &&
                        editingRow.field === "defaultValue"
                      )
                    ) {
                      setEditingRow({
                        row: rowId,
                        field: "defaultValue",
                      });
                    }
                  },
                  onChange: (e) => {
                    const newValue = e.target.value;
                    if (isNew) {
                      setNewVariable((prev) => ({
                        ...prev,
                        defaultValue: newValue,
                      }));
                    } else {
                      changeFieldValue(row, "defaultValue", newValue);
                    }
                  },
                }}
                wrapperProps={{
                  styleProps: {
                    borderColor: "transparent",
                    ...getChangedFieldStyles(changeType),
                  },
                  changeType: fieldChangeType,
                  tooltipValue: getPreviousFieldValue(id, "defaultValue"),
                  onResetValue: () => {
                    resetFieldValue(row, "defaultValue");
                  },
                }}
              />
              {!!presentUsers.length && (
                <InputRightElement
                  top="auto"
                  justifyContent="right"
                  mr={fieldChangeType ? "32px" : "0"}
                >
                  <PresenceAvatarGroup users={getPresentUsers(inputPath)} />
                </InputRightElement>
              )}
            </InputGroup>
          );
        },
      },
      ...environments,
    ];
  }, [
    onChange,
    newVariable,
    changesDiff,
    invalidNames,
    getPresentUsers,
    resetFieldValue,
    onVariableDelete,
    changeFieldValue,
    setFocusedElement,
    environmentsToShow,
    getPreviousFieldValue,
    editingRow,
    readonly,
  ]);

  return (
    <Flex flexDirection="column" w="100%" mb="6">
      <Flex gap="1" mb="2" paddingTop="8" color="brand.500" alignItems="center">
        <Icon as={InfoCircleIcon} />
        <Text fontSize="sm" fontWeight="medium">
          Environment Variables
        </Text>
      </Flex>
      <Flex pb="4" pt="2" gap="2">
        {selectedVariables.length > 0 && (
          <SelectionIndicator
            count={selectedVariables.length}
            onResetSelection={() => {
              setSelectedRows({});
            }}
            actionButtons={
              // add more action buttons here when needed
              <>
                <Tooltip label="Delete selected variables" openDelay={800}>
                  <IconButton
                    size="md"
                    variant="ghost"
                    aria-label="delete"
                    borderLeftRadius="0"
                    onClick={onVariableDelete}
                  >
                    <Icon color="muted" as={TrashIcon} />
                  </IconButton>
                </Tooltip>
              </>
            }
          />
        )}
        <MultiSelectFilter
          buttonProps={{
            ml: "auto",
          }}
          setSelection={(_, selected) => {
            setEnvironmentsToShow(selected);
          }}
          selection={environmentsToShow}
          options={existingEnvironments}
          searchable
          filterName="Environments"
          selectionKey="environments"
        />
        <DebounceSearch
          hideDeleteButton={true}
          showSearchIcon={true}
          inputGroupProps={{
            padding: "0",
            margin: "0",
            maxWidth: "240px",
          }}
          inputProps={{
            placeholder: "Search...",
            defaultValue: searchQuery,
          }}
          onSearch={setSearchQuery}
        />
      </Flex>
      <Table
        showNoData={false}
        noCellPadding={true}
        columns={columns}
        useRowSelection={!readonly}
        sorting={sorting}
        setSorting={setSorting}
        data={variablesTableData}
        disabledRows={disabledRows}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        onAllRowsSelect={onAllRowsSelect}
      />
      {!readonly && (
        <Flex
          pl="3"
          py="2"
          w="full"
          cursor="pointer"
          borderBottom="1px solid"
          borderColor="border.primary"
        >
          <Icon
            as={PlusCircleFilledIcon}
            mr="2"
            __css={{
              path: {
                fill: isAdding ? "muted" : "brand.500",
              },
            }}
          />
          <Text
            color={isAdding ? "muted" : "brand.500"}
            fontWeight="500"
            onPointerDown={() => {
              if (!isAdding) {
                setIsAdding(true);
                setNewVariable({ ...newVariableInitialState, id: uuidv4() });
              }
            }}
          >
            Add a variable
          </Text>
        </Flex>
      )}
    </Flex>
  );
};

export default Variables;
