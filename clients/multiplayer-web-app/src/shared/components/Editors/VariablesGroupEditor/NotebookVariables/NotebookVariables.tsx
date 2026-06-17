import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Flex,
  Icon,
  IconButton,
  InputGroup,
  InputRightElement,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import * as yup from "yup";
import { v4 as uuidv4 } from "uuid";
import {
  EntityCommitChangeType,
  Variable,
  VariableGroup,
} from "@multiplayer/types";

import { IPresentUser, ITableSorting } from "shared/models/interfaces";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import { getChangeType } from "shared/helpers/changes.helpers";
import { SortingDirection } from "shared/models/enums";
import { getNestedProperty, isReservedKeyword } from "shared/utils";
import ChangedInputWrapper from "shared/components/ChangedInputWrapper";
import PresenceAvatarGroup from "shared/components/PresenceAvatarGroup";
import { InfoCircleIcon, PlusCircleFilledIcon, TrashIcon } from "shared/icons";
import SelectionIndicator from "shared/components/SelectionIndicator";
import DebounceSearch from "shared/components/DebounceSearch";
import Table from "shared/components/Table";
import useVariables from "shared/hooks/useVariables";

interface VariableRow extends Variable {
  id: string;
  isNew?: boolean;
  changeType?: EntityCommitChangeType;
}

const newVariableInitialState: VariableRow = {
  id: null,
  name: "",
  secret: false,
  description: "",
  value: "",
};

enum InvalidNameReason {
  "required" = "required",
  "DUPLICATE" = "DUPLICATE",
  "VALID_CHAR" = "VALID_CHAR",
  "JS_KEYWORD" = "JS_KEYWORD",
}

const invalidNameMessages = {
  [InvalidNameReason.required]: "Variable name cannot be empty.",
  [InvalidNameReason.VALID_CHAR]:
    "Variable name must start with a letter, underscore (_), or dollar sign ($).",
  [InvalidNameReason.JS_KEYWORD]:
    "Variable name cannot be a reserved JavaScript keyword.",
  [InvalidNameReason.DUPLICATE]: "Variable name should be unique",
};

const NotebookVariables = ({
  onChange,
  variables,
  getPresentUsers,
  setFocusedElement,
  changesDiff,
  selectedGroup,
  readonly,
}: {
  getPresentUsers: (controlName: string) => IPresentUser[];
  setFocusedElement: (elementPath: string) => void;
  onChange: (id: string, variable: Variable) => void;
  variables: Record<string, Variable>;
  changesDiff: any;
  selectedGroup: VariableGroup;
  readonly?: boolean;
}) => {
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

  useEffect(() => {
    if (
      selectedGroup?.variables &&
      Object.keys(selectedGroup.variables).length
    ) {
      setIsAdding(false);
    } else {
      setIsAdding(true);
      setNewVariable({ ...newVariableInitialState, id: uuidv4() });
    }
  }, [selectedGroup]);

  const variablesTableData: VariableRow[] = useMemo(() => {
    const deletedVariables = getDeletedVariables();

    let varArray = Object.values(variables).map((variable) => ({
      ...variable,
      _id: variable?.id,
      changeType: changesDiff && getChangeType(changesDiff[variable?.id]),
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
    if (isAdding) {
      return [
        ...varArray,
        {
          ...newVariableInitialState,
          isNew: true,
        },
      ];
    }
    return varArray;
  }, [changesDiff, variables, isAdding, sorting, searchQuery]);

  useEffect(() => {
    const invalidVars = {};
    variablesTableData.forEach(({ id, name, isNew }) => {
      if (isNameDuplicate(id, name, variablesTableData)) {
        invalidVars[id] = InvalidNameReason.DUPLICATE;
      }
      variableNameSchema.validate(name).catch((err) => {
        if (err.type === InvalidNameReason.required && isNew) {
          return;
        }
        setInvalidNames((prev) => ({
          ...prev,
          [id]: err.type,
        }));
      });
    });

    setInvalidNames(invalidVars);
  }, [variablesTableData]);

  const parseVariableName = (variable: string) => {
    return variable.trim().replace(/[^a-zA-Z0-9_$]/g, "");
  };

  const changeFieldValue = useCallback(
    (variableRow: VariableRow, fieldName: string, newVal: string) => {
      const newValue =
        fieldName === "name" ? parseVariableName(newVal) : newVal.trimStart();
      const { changeType, ...row } = variableRow;
      row[fieldName] = newValue;

      if (fieldName === "name") {
        variableNameSchema
          .validate(newValue)
          .then(() => {
            if (isNameDuplicate(row.id, newValue, variablesTableData)) {
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
              onChange(row.id, row);
            }
          })
          .catch((err) => {
            setInvalidNames((prev) => ({
              ...prev,
              [row.id]: err.type,
            }));
          });
      } else {
        onChange(row.id, row);
      }
    },
    [invalidNames, onChange, variablesTableData]
  );

  const resetFieldValue = useCallback(
    (
      variable: VariableRow,
      fieldId: string,
      changeType: EntityCommitChangeType = EntityCommitChangeType.UPDATE
    ) => {
      if (changeType === EntityCommitChangeType.UPDATE) {
        changeFieldValue(
          variable,
          fieldId,
          getPreviousFieldValue(variable.id, fieldId)
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

  const onFieldChange = (e, field: "name" | "description" | "value", row) => {
    const parsedValue =
      field === "name"
        ? parseVariableName(e.target.value)
        : e.target.value.trimStart();

    if (row.isNew) {
      setNewVariable((prev) => ({
        ...prev,
        [field]: parsedValue,
      }));
    } else {
      changeFieldValue(row, field, parsedValue);
    }
  };

  const onFieldFocus = (id: string, inputPath: string, field: string) => {
    setFocusedElement(inputPath);
    if (!(editingRow.row === id && editingRow.field === field))
      setEditingRow({
        row: id,
        field: field,
      });
  };

  const onFieldBlur = async (row, field: string) => {
    setEditingRow({
      row: "",
      field: "",
    });

    const { id: newId } = newVariable;
    const { isNew, name, id } = row;

    if (isNew && newVariable[field]) {
      onChange(newId, newVariable);
      setNewVariable(newVariableInitialState);
      setIsAdding(false);
    }

    if (!isNew && !name) {
      await onVariableDelete(null, id);
    }

    setFocusedElement(null);
  };

  const createInputColumn = ({
    row,
    field,
    placeholder,
    hasValidation = false,
  }: {
    row: VariableRow;
    field: "name" | "description" | "value";
    placeholder: string;
    hasValidation?: boolean;
  }) => {
    const { isNew, id, changeType } = row;
    const rowId = isNew ? "newRow" : id;
    const inputPath = `var-${field}-${id}`;
    const value = isNew ? newVariable[field] : row[field];
    const presentUsers = getPresentUsers(inputPath);

    const fieldChangeType =
      changeType === EntityCommitChangeType.UPDATE
        ? getChangeType(getNestedProperty(changesDiff, [id, field]))
        : changeType;

    const showTooltip = hasValidation && invalidNames[id];
    const tooltipLabel =
      hasValidation && invalidNames[id]
        ? invalidNameMessages[invalidNames[id]]
        : undefined;

    return (
      <InputGroup
        alignItems="center"
        paddingRight={fieldChangeType ? "1" : "0"}
      >
        <ChangedInputWrapper
          inputProps={{
            background: "transparent",
            placeholder,
            value,
            isReadOnly: readonly,
            disabled: changeType === EntityCommitChangeType.DELETE,
            autoFocus: editingRow.row === rowId && editingRow.field === field,
            onFocus: () => onFieldFocus(rowId, inputPath, field),
            onChange: (e) => onFieldChange(e, field, row),
            onBlur: () => onFieldBlur(row, field),
            _disabled: hasValidation
              ? { opacity: "1", cursor: "not-allowed" }
              : undefined,
          }}
          wrapperProps={{
            styleProps: {
              borderColor: "transparent",
              ...getChangedFieldStyles?.(changeType),
            },
            changeType: fieldChangeType,
            tooltipValue: getPreviousFieldValue(id, field),
            onResetValue: () => resetFieldValue(row, field, changeType),
          }}
        />
        {(showTooltip || presentUsers.length > 0) && (
          <InputRightElement
            top="auto"
            justifyContent="right"
            mr={fieldChangeType ? "32px" : "0"}
          >
            {!!presentUsers.length && (
              <PresenceAvatarGroup users={presentUsers} />
            )}
            {showTooltip && tooltipLabel && (
              <Tooltip label={tooltipLabel} openDelay={500}>
                <Icon as={InfoCircleIcon} />
              </Tooltip>
            )}
          </InputRightElement>
        )}
      </InputGroup>
    );
  };

  const columns = useMemo(() => {
    return [
      {
        field: "name",
        name: "Name",
        width: 200,
        sortable: true,
        component: (row: VariableRow) =>
          createInputColumn({
            row,
            field: "name",
            placeholder: "Enter a name",
            hasValidation: true,
          }),
      },
      {
        field: "description",
        name: "Description",
        width: 200,
        component: (row: VariableRow) =>
          createInputColumn({
            row,
            field: "description",
            placeholder: "Enter a description",
          }),
      },
      {
        field: "value",
        name: "Value",
        width: 200,
        component: (row: VariableRow) =>
          createInputColumn({
            row,
            field: "value",
            placeholder: "Enter a value",
          }),
      },
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
    getPreviousFieldValue,
    editingRow.field,
    editingRow.row,
  ]);

  return (
    <Flex flexDirection="column" w="100%" mb="6">
      <Flex pb="4" pt="2" gap="2" justifyContent="space-between">
        <Box>
          {selectedVariables.length > 0 && (
            <SelectionIndicator
              count={selectedVariables.length}
              onResetSelection={() => {
                setSelectedRows({});
              }}
              actionButtons={
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
              }
            />
          )}
        </Box>
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
        useRowSelection={!readonly}
        columns={columns}
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
          ></Icon>
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

const variableNameSchema = yup
  .string()
  .required("Variable name cannot be empty.")
  .test(
    InvalidNameReason.VALID_CHAR,
    "Variable name must start with a letter, underscore (_), or dollar sign ($).",
    (val) => /^[a-zA-Z_$]/.test(val || "")
  )
  .test(
    InvalidNameReason.JS_KEYWORD,
    "Variable name is a reserved JavaScript keyword.",
    (val) => (val ? !isReservedKeyword(val) : false)
  );

export default NotebookVariables;
