import {
  Icon,
  Text,
  Flex,
  Modal,
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalContent,
  useDisclosure,
  ModalCloseButton,
  Box,
} from "@chakra-ui/react";
import { IGitRepository } from "@multiplayer/types";

import { CommitIcon, PencilIcon } from "shared/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import {
  IProjectBranchState,
  ITableSorting,
  IUpdateBranchReqBody,
} from "shared/models/interfaces";
import { getMap } from "shared/utils";
import Table from "shared/components/Table";
import useMessage from "shared/hooks/useMessage";
import FormField from "shared/components/FormField";
import EntityIcon from "shared/components/EntityIcon";
import BlueButton from "shared/components/BlueButton";
import { fetchAllData } from "shared/helpers/api.helpers";
import { useEntities } from "shared/providers/EntitiesContext";
import { useVersion } from "shared/providers/VersionContext";
import { getBranchState } from "shared/services/version.service";
import BranchMappingModal from "shared/components/BranchMappingModal";
import { getProjectGitRepositories } from "shared/services/git.service";
import { SortingDirection } from "shared/models/enums";

interface CommitChangesModalProps {}

const CommitChangesModal = (props: CommitChangesModalProps) => {
  const message = useMessage();
  const { onMergePreparation } = useEntities();
  const { currentBranch, onBranchUpdate, onBranchMappingUpdate } = useVersion();
  const branchMappingModal = useDisclosure();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { projectId, branchId, path: entityId } = useParams();

  const { onEntityGitCommit } = useEntities();
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [repositories, setRepositories] = useState<Map<string, any>>(new Map());
  const [selectedRows, setSelectedRows] = useState({});
  const [sorting, setSorting] = useState<ITableSorting>(null);

  const {
    reset,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    shouldFocusError: false,
    resolver: yupResolver(
      yup
        .object({
          commitMessage: yup.string().required("This field is required"),
        })
        .required()
    ),
  });

  const onSubmit = async ({ commitMessage }) => {
    try {
      await onEntityGitCommit({
        entityIds: Object.keys(selectedRows).filter((key) => selectedRows[key]),
        branchId: branchId,
        commitMessage,
      });
      onClose();
      reset();
      message.success(
        "Success! Your commit has been successfully recorded in the repository."
      );
    } catch (error) {
      message.handleError(error);
    }
  };

  const updateBranch = async (body: Partial<IUpdateBranchReqBody>) => {
    return onBranchUpdate(currentBranch.data._id, body);
  };

  const updateMapping = useCallback(
    (gitRepositoryId: string, name: string) => {
      return onBranchMappingUpdate(
        currentBranch.data._id,
        gitRepositoryId,
        name
      );
    },
    [onBranchMappingUpdate]
  );

  const getUncommittedEntities = useCallback(async () => {
    try {
      setLoading(true);
      const stateParams = { hasUncommittedSource: true };
      const [states, repositories] = await Promise.all([
        fetchAllData<IProjectBranchState>(
          getBranchState.bind(null, branchId),
          stateParams
        ),
        fetchAllData<IGitRepository>(
          getProjectGitRepositories.bind(null, projectId),
          {}
        ),
      ]);
      setStates(states);
      setRepositories(getMap(repositories, "_id"));
    } catch (error) {
      message.handleError(error);
      setRepositories(new Map());
      setStates([]);
    }
    setLoading(false);
  }, [branchId, currentBranch.data, entityId]);

  useEffect(() => {
    let isCurrentEntityEnabled = false;
    const gitBranches = currentBranch.data.gitBranches || {};
    const changesState = states.map(({ entity }) => {
      const repo = repositories.get(entity.gitRef?.repositoryId);
      if (entity.entityId === entityId && repo && gitBranches[repo._id]) {
        isCurrentEntityEnabled = true;
      }
      return {
        _id: entity.entityId,
        entityName: entity.key,
        entityType: entity.type,
        gitRepository: repo
          ? {
              type: repo.gitRepository.type,
              name: repo.gitRepository.name,
              owner: repo.gitRepository.owner,
              branch: gitBranches[repo._id],
            }
          : null,
      };
    });
    if (sorting) {
      changesState.sort((a, b) => {
        const sortKeyA =
          sorting.key === "entity"
            ? a.entityName
            : a.gitRepository
            ? `${a.gitRepository.owner}/${a.gitRepository.name}`
            : "";
        const sortKeyB =
          sorting.key === "entity"
            ? b.entityName
            : b.gitRepository
            ? `${b.gitRepository.owner}/${b.gitRepository.name}`
            : "";

        return sorting.direction === SortingDirection.ASC
          ? sortKeyB.localeCompare(sortKeyA)
          : sortKeyA.localeCompare(sortKeyB);
      });
    }
    setChanges(changesState);
    if (isCurrentEntityEnabled && !sorting) {
      setSelectedRows({ [entityId]: true });
    }
  }, [states, sorting, repositories, currentBranch.data]);

  useEffect(() => {
    const fetchChanges = async () => {
      await onMergePreparation(currentBranch.data._id);
      getUncommittedEntities();
    };
    if (isOpen) {
      fetchChanges();
    }
  }, [isOpen, currentBranch.data._id]);

  const onRowSelect = (selection) => {
    setSelectedRows((prevState) => ({
      ...prevState,
      ...selection,
    }));
  };

  const onAllRowsSelect = (isSelected: boolean) => {
    const selection = changes.reduce((acc, num) => {
      acc[num._id] = !!num.gitRepository?.branch && isSelected;
      return acc;
    }, {});
    setSelectedRows(selection);
  };

  const disabledRows = useMemo(() => {
    return changes.reduce((acc, num) => {
      acc[num._id] = !num.gitRepository?.branch;
      return acc;
    }, {});
  }, [changes]);

  const isCommitEnabled = useMemo(() => {
    return Object.values(selectedRows).some((v) => v);
  }, [selectedRows]);

  if (currentBranch.data.default) return null;

  return (
    <>
      <BlueButton leftIcon={<Icon as={CommitIcon} />} onClick={onOpen}>
        Commit
      </BlueButton>
      <Modal size="4xl" isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent
          as="form"
          noValidate
          maxW="930px"
          onSubmit={handleSubmit(onSubmit)}
        >
          <ModalHeader>
            Commit back the changes to their repositories
            <ModalCloseButton />
          </ModalHeader>
          <ModalBody pt="0">
            <Text color="muted" mb="6" maxW="480px">
              Please confirm that you want to commit the changes of this back to
              repository.
            </Text>
            <FormField
              mb="6"
              name="commitMessage"
              label="Commit message"
              placeholder="Write a message..."
              errors={errors}
              registerFn={register}
            />

            <Table
              useRowSelection
              data={changes}
              loading={loading}
              columns={columns}
              sorting={sorting}
              setSorting={setSorting}
              disabledRows={disabledRows}
              selectedRows={selectedRows}
              onRowSelect={onRowSelect}
              onAllRowsSelect={onAllRowsSelect}
            />
          </ModalBody>
          <ModalFooter justifyContent="space-between">
            <Button
              variant="link"
              leftIcon={<Icon as={PencilIcon} />}
              onClick={() => branchMappingModal.onOpen()}
            >
              Edit Git Branch Map
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              isDisabled={!isCommitEnabled}
            >
              Commit selected
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <BranchMappingModal
        onBranchUpdate={updateBranch}
        onMappingChange={updateMapping}
        disclosure={branchMappingModal}
        targetBranch={currentBranch.data}
      />
    </>
  );
};

const columns = [
  {
    field: "entity",
    sortable: true,
    name: "Source files with changes",
    component: ({ entityName, type }) => (
      <Flex gap="2" alignItems="center">
        <EntityIcon name={type} />
        {entityName}
      </Flex>
    ),
  },
  {
    sortable: true,
    name: "Repository",
    field: "repository",
    component: ({ gitRepository }) =>
      gitRepository ? (
        <Flex alignItems="center">
          <EntityIcon name={gitRepository.type} mr="2" />
          <Box>
            <Text as="span" color="muted" mr="1">
              {gitRepository.owner}
            </Text>
            /
            <Text as="span" ml="1">
              {gitRepository.name}
            </Text>
          </Box>
        </Flex>
      ) : (
        <Text as="span" color="muted" mr="1">
          Unavailable
        </Text>
      ),
  },
  {
    field: "branch",
    name: "Commit to this branch",
    component: ({ gitRepository }) => gitRepository?.branch || "",
  },
];

export default CommitChangesModal;
