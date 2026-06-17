import {
  Text,
  Flex,
  Menu,
  Input,
  Modal,
  Portal,
  MenuList,
  MenuItem,
  ModalBody,
  FormLabel,
  MenuButton,
  MenuDivider,
  ModalHeader,
  FormControl,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  Button,
  Icon,
  UseDisclosureReturn,
  ModalFooter,
  Spinner,
  MenuItemOption,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { IGitRepository, IProjectBranch } from "@multiplayer/types";

import useMessage from "shared/hooks/useMessage";
import { fetchAllData } from "shared/helpers/api.helpers";

import {
  createGitRepositoryBranch,
  getGitRepositoryBranches,
  getProjectGitRepositories,
} from "shared/services/git.service";

import EntityIcon from "../EntityIcon";
import Table from "../Table";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { ITableSorting } from "shared/models/interfaces";
import { SortingDirection } from "shared/models/enums";

interface BranchMappingModalProps {
  targetBranch: IProjectBranch;
  disclosure: UseDisclosureReturn;
  onBranchUpdate: (data: Partial<IProjectBranch>) => Promise<void>;
  onMappingChange: (gitRepositoryId: string, name: string) => Promise<void>;
}

const BranchMappingModal = ({
  disclosure,
  targetBranch,
  onBranchUpdate,
  onMappingChange,
}: BranchMappingModalProps) => {
  const { projectId } = useParams();
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState<ITableSorting>(null);
  const [repositories, setRepositories] = useState<IGitRepository[]>([]);

  const onDefaultGitBranchNameChange = async ({ target: { value } }) => {
    const defaultGitBranchName = value.trim();
    if (
      !defaultGitBranchName ||
      defaultGitBranchName === targetBranch.defaultGitBranchName
    )
      return;
    onBranchUpdate({ defaultGitBranchName });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetchAllData<IGitRepository>(
          getProjectGitRepositories.bind(null, projectId)
        );
        setRepositories(res);
      } catch (error) {}
      setLoading(false);
    };

    if (disclosure.isOpen) {
      fetchData();
    }
  }, [disclosure.isOpen]);

  const tableData = useMemo(() => {
    if (!targetBranch) return [];

    const data = repositories.map((r) => ({
      _id: r._id,
      projectId: r.project,
      type: r.gitRepository.type,
      name: r.gitRepository.name,
      owner: r.gitRepository.owner,
      defaultBranch: r.gitRepository.defaultBranch,
      projectBranch: targetBranch._id,
      isMappedTo: targetBranch.gitBranches
        ? targetBranch.gitBranches[r._id]
        : null,
      defaultGitBranchName: targetBranch.defaultGitBranchName,
      changeMapping: (name) => onMappingChange(r._id, name),
    }));

    if (sorting) {
      data.sort((a, b) => {
        const sortKeyA = `${a.owner}/${a.name}`;
        const sortKeyB = `${b.owner}/${b.name}`;
        return sorting.direction === SortingDirection.ASC
          ? sortKeyB.localeCompare(sortKeyA)
          : sortKeyA.localeCompare(sortKeyB);
      });
    }
    return data;
  }, [repositories, targetBranch, sorting, onMappingChange]);

  if (!targetBranch) return;

  return (
    <Modal size="4xl" isOpen={disclosure.isOpen} onClose={disclosure.onClose}>
      <ModalOverlay />
      <ModalContent maxW="930px">
        <ModalHeader>
          Edit your Git Branch Mapping
          <ModalCloseButton />
        </ModalHeader>
        <ModalBody pt="0" pb="6">
          <Text color="muted" mb="6" maxW="480px">
            Define where you want your imported source files to be committed
            back.
          </Text>
          <Flex mb="6" gap="2">
            <FormControl flex="1">
              <FormLabel>Multiplayer Design Branch</FormLabel>
              <Input readOnly value={targetBranch.name} />
            </FormControl>
            <FormControl flex="1">
              <FormLabel>Git Branch Default Name</FormLabel>
              <Input
                placeholder="Write a branch default name..."
                defaultValue={targetBranch.defaultGitBranchName}
                onBlur={onDefaultGitBranchNameChange}
              />
            </FormControl>
          </Flex>
          <Table
            data={tableData}
            sorting={sorting}
            loading={loading}
            columns={columns}
            setSorting={setSorting}
          />
        </ModalBody>
        <ModalFooter>
          <Button onClick={disclosure.onClose}>Done</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const columns = [
  {
    name: "Repository",
    field: "repository",
    sortable: true,
    component: ({ type, owner, name }) =>
      !name ? null : (
        <Flex alignItems="center">
          <EntityIcon name={type} mr="2" />
          <Text as="span" color="muted" mr="1">
            {owner}
          </Text>
          /
          <Text as="span" ml="1">
            {name}
          </Text>
        </Flex>
      ),
  },
  {
    field: "branch",
    name: "Branch",
    component: (row) => <BranchDropDown data={row} />,
  },
];

const BranchDropDown = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const message = useMessage();

  const handleUpdate = async (name) => {
    setLoading(true);
    await data.changeMapping(name);
    setLoading(false);
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { projectId, _id, defaultBranch, defaultGitBranchName } = data;
      const res = await createGitRepositoryBranch(projectId, _id, {
        name: defaultGitBranchName,
        parentBranch: defaultBranch,
      });
      handleUpdate(res.name);
      return res;
    } catch (error) {
      message.handleError(error);
    }
    setLoading(false);
  };

  return (
    <Menu isLazy placement="bottom-start">
      <MenuButton
        size="sm"
        as={Button}
        variant="base"
        borderRadius="lg"
        px={!data.isMappedTo ? "2" : "0"}
        bg={!data.isMappedTo ? "bg.subtle" : null}
        leftIcon={
          loading ? (
            <Spinner color="brand.500" size="sm" boxSize="5" />
          ) : (
            <Icon as={ChevronDownIcon} />
          )
        }
      >
        {data.isMappedTo || "Select branch"}
      </MenuButton>
      <Portal>
        <MenuList zIndex="2000">
          <BranchDropDownItems
            data={data}
            onCrate={handleCreate}
            onUpdate={handleUpdate}
          />
        </MenuList>
      </Portal>
    </Menu>
  );
};

const BranchDropDownItems = ({ data, onCrate, onUpdate }) => {
  const message = useMessage();
  const [items, setItems] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const { _id, projectId, isMappedTo, defaultBranch, defaultGitBranchName } =
    data;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetching(true);
        const res = await getGitRepositoryBranches(projectId, _id);
        setItems(res.data);
        cachedItems[_id] = res.data;
      } catch (error) {
        message.handleError(error);
      }
      setFetching(false);
    };

    if (cachedItems[_id]) {
      setItems(cachedItems[_id]);
    } else {
      fetchData();
    }
  }, [projectId, _id]);

  const createNewBranch = async () => {
    if (!items.some((i) => i.name === defaultGitBranchName)) {
      const res = await onCrate();
      if (res) {
        setItems((prev) => {
          const newState = [...prev, res];
          cachedItems[_id] = newState;
          return newState;
        });
      }
    } else {
      message.handleError(
        new Error(`A branch named "${defaultGitBranchName}" already exists!`)
      );
    }
  };

  return (
    <>
      {fetching ? (
        <>
          <MenuItem>Loading...</MenuItem>
        </>
      ) : (
        <>
          {items.map((item) => {
            const isDefault = item.name === defaultBranch;
            return (
              <MenuItemOption
                key={item.name}
                isDisabled={isDefault}
                isChecked={isMappedTo === item.name}
                onClick={() => !isDefault && onUpdate(item.name)}
              >
                {item.name}
              </MenuItemOption>
            );
          })}
        </>
      )}
      <MenuDivider />
      <MenuItem onClick={createNewBranch}>Create new branch</MenuItem>
    </>
  );
};

const cachedItems = {};

export default BranchMappingModal;
