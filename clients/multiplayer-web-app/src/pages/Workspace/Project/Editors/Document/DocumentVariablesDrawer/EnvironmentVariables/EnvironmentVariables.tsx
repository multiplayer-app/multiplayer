import {
  Box,
  Button,
  Checkbox,
  Flex,
  Icon,
  IconButton,
  InputGroup,
  InputProps,
  InputRightElement,
  Tab,
  Table,
  TabList,
  Tabs,
  Tbody,
  Td,
  Thead,
  Tooltip,
  Tr,
} from "@chakra-ui/react";
import { Y } from "@multiplayer/entity";
import { Blocknote } from "@multiplayer/types";
import { useEffect, useMemo, useState } from "react";

import {
  EyeOutlineIcon,
  EyeOutlineOffIcon,
  PlusCircleFilledIcon,
  TrashIcon,
} from "shared/icons";
import { SortingDirection } from "shared/models/enums";
import { ITableSorting } from "shared/models/interfaces";
import useYArrayState from "shared/hooks/useYArrayState";
import DebounceInput from "shared/components/DebounceInput";
import ThCell from "shared/components/Table/ThCell";
import SelectionIndicator from "shared/components/SelectionIndicator";
import useSecretsManager from "shared/hooks/useSecretsManager";

interface EnvironmentVariablesProps {
  yVariables: Y.Array<Blocknote.AggregateVariable>;
  ySecrets: Y.Array<Blocknote.AggregateVariable>;
  readonly: boolean;
}

const EnvironmentVariables = ({
  yVariables,
  ySecrets,
  readonly,
}: EnvironmentVariablesProps) => {
  const secretsManager = useSecretsManager();

  const [tabIndex, setTabIndex] = useState(0);
  const [secrets, setSecrets] = useState<
    (Blocknote.AggregateVariable & { id?: number })[]
  >([]);
  const [sorting, setSorting] = useState<ITableSorting | null>(null);
  const [newItem, setNewItem] = useState<Blocknote.AggregateVariable | null>(
    null
  );
  const [storedSecrets, setSecret, removeSecret] =
    useYArrayState<Blocknote.AggregateVariable>(ySecrets);
  const [items, setItem, removeItem] =
    useYArrayState<Blocknote.AggregateVariable>(yVariables);
  const [selectedVariables, setSelectedVariables] = useState<number[]>([]);

  useEffect(() => {
    const getData = async () => {
      const localSecrets = await secretsManager.instance.getAllSecrets();
      setSecrets(
        storedSecrets.map((data) => {
          const found = localSecrets.find((v) => data.key === v.key);
          return {
            ...data,
            value: found?.value || "",
            id: found?.id || undefined,
          };
        })
      );
    };
    getData();
  }, [storedSecrets]);

  const isSecret = tabIndex === 1;

  const handleAddVariable = () => {
    setNewItem({
      key: "",
      value: "",
      source: Blocknote.SourceEnv.GLOBAL,
    });
  };

  const handleSetVariable = async (
    data: {
      key: string;
      value: string;
      secret: boolean;
      source: string;
      id?: number;
    },
    index?: number
  ) => {
    try {
      const record = {
        ...data,
      };
      if (isSecret) {
        record.value = "";
        if (data.id) {
          await secretsManager.instance.updateSecret(data.id, data);
          setSecrets(
            secrets.map((item) => (item.id === data.id ? data : item))
          );
        } else {
          const id = await secretsManager.instance.storeSecret(
            data.key,
            data.value
          );
          setSecrets([...secrets, { ...data, id }]);
        }
        setSecret(record, index);
      } else {
        setItem(record, index);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelection = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    setSelectedVariables((prev) =>
      e.target.checked ? [...prev, index] : prev.filter((i) => i !== index)
    );
  };

  const resetSelection = () => {
    setSelectedVariables([]);
  };

  const deleteSelection = () => {
    yVariables.doc.transact(async () => {
      const promises = [];
      selectedVariables.forEach((index) => {
        if (isSecret) {
          const key = ySecrets.get(index).key;
          promises.push(
            secretsManager?.instance.deleteSecretByName(ySecrets.get(index).key)
          );
          removeSecret(index);
          setSecrets(secrets.filter((item) => item.key !== key));
        } else {
          removeItem(index);
          if (index === items.length - 1) {
            setNewItem(null);
          }
        }
      });
      await Promise.all(promises);
    });
    resetSelection();
  };

  const tableData = useMemo(() => {
    const data = (isSecret ? secrets : items).map((item, index) => ({
      index,
      data: item,
      isNew: false,
    }));

    if (sorting) {
      data.sort((a, b) =>
        sorting.direction.toString() === SortingDirection.ASC
          ? b.data.key.localeCompare(a.data.key)
          : a.data.key.localeCompare(b.data.key)
      );
    }
    if (newItem) {
      data.push({ index: items.length, isNew: true, data: newItem });
    }
    return data;
  }, [sorting, isSecret, items, tabIndex, newItem, secrets]);

  const handleChange = async (e, row) => {
    const { name, value } = e.target;
    const data = { ...row.data, [name]: value };
    if (row.isNew) {
      setNewItem(data);
      if (data.key && data.value) {
        await handleSetVariable(data);
        setNewItem(null);
      }
    } else {
      await handleSetVariable(data, row.index);
    }
  };

  const selectedVariablesCount = selectedVariables.length;

  return (
    <Box px="4" overflowY="auto">
      <Tabs
        isLazy
        isFitted
        mb="6"
        flex="1"
        minH="0"
        display="flex"
        flexDir="column"
        colorScheme="brand"
        onChange={(index) => {
          setTabIndex(index);
          setNewItem(null);
        }}
      >
        <TabList borderBottomWidth="1px" px="2">
          <Tab mx="4" fontSize="sm" mb="-1px" fontWeight="medium">
            Variables
          </Tab>
          <Tab mx="4" fontSize="sm" mb="-1px" fontWeight="medium">
            Secrets
          </Tab>
        </TabList>
      </Tabs>
      <Flex mb="4">
        {selectedVariablesCount > 0 && (
          <SelectionIndicator
            count={selectedVariablesCount}
            onResetSelection={resetSelection}
            actionButtons={
              <Tooltip label="Delete selected variables" openDelay={800}>
                <IconButton
                  size="md"
                  variant="ghost"
                  aria-label="delete"
                  borderLeftRadius="0"
                  onClick={deleteSelection}
                >
                  <Icon color="muted" as={TrashIcon} />
                </IconButton>
              </Tooltip>
            }
          />
        )}
      </Flex>
      <Table>
        <Thead>
          <Tr border="none">
            <ThCell
              sortable
              colSpan={readonly ? 1 : 2}
              sortKey="key"
              sorting={sorting}
              onSortChange={setSorting}
            >
              Key
            </ThCell>
            <ThCell>Value</ThCell>
          </Tr>
        </Thead>
        <Tbody>
          {tableData.map((row) => (
            <Tr key={row.index}>
              {!readonly && (
                <Td>
                  <Checkbox
                    colorScheme="brand"
                    isChecked={selectedVariables.includes(row.index)}
                    onChange={(e) => handleSelection(e, row.index)}
                  />
                </Td>
              )}
              <Td p="0">
                <DebounceInput
                  trim
                  bg="none"
                  name="key"
                  rounded="none"
                  variant="ghost"
                  placeholder="Key"
                  value={row.data.key}
                  isDisabled={readonly}
                  _disabled={{ opacity: 1 }}
                  onChange={(e) => handleChange(e, row)}
                />
              </Td>
              <Td p="0">
                {isSecret ? (
                  <SecretInput
                    px="0"
                    bg="none"
                    name="value"
                    rounded="none"
                    variant="ghost"
                    placeholder="Value"
                    value={row.data.value}
                    isDisabled={readonly}
                    _disabled={{ opacity: 1 }}
                    onChange={(e) => handleChange(e, row)}
                  />
                ) : (
                  <DebounceInput
                    bg="none"
                    name="value"
                    rounded="none"
                    variant="ghost"
                    placeholder="Value"
                    value={row.data.value}
                    isDisabled={readonly}
                    _disabled={{ opacity: 1 }}
                    onChange={(e) => handleChange(e, row)}
                  />
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {!readonly && (
        <Flex
          pl="3"
          py="2"
          w="full"
          borderBottom="1px solid"
          borderColor="border.primary"
        >
          <Button
            variant="link"
            color="brand.500"
            onClick={handleAddVariable}
            isDisabled={newItem !== null}
            leftIcon={
              <Icon
                mr="2"
                as={PlusCircleFilledIcon}
                __css={{ path: { fill: "brand.500" } }}
              />
            }
          >
            Add new variable
          </Button>
        </Flex>
      )}
    </Box>
  );
};

const SecretInput = (props: InputProps) => {
  const [show, setShow] = useState(false);
  const handleClick = () => setShow(!show);

  return (
    <InputGroup size="md">
      <DebounceInput type={show ? "text" : "password"} {...props} />
      <InputRightElement>
        <IconButton
          size="sm"
          rounded="md"
          variant="ghost"
          aria-label="toggle password visibility"
          icon={<Icon as={show ? EyeOutlineOffIcon : EyeOutlineIcon} />}
          onClick={handleClick}
        />
      </InputRightElement>
    </InputGroup>
  );
};

export default EnvironmentVariables;
