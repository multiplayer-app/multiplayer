import {
  Box,
  Flex,
  Text,
  IconButton,
  UseDisclosureReturn,
} from "@chakra-ui/react";
import { CloseIcon } from "shared/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Drawer, { DrawerContent } from "shared/components/Drawer/Drawer";
import InfiniteScrollBox from "shared/components/InfiniteScrollBox";
import useMessage from "shared/hooks/useMessage";
import { useVersion } from "shared/providers/VersionContext";
import {
  getEntityCommitContents,
  getEntityCommits,
  updateEntityCommit,
} from "shared/services/version.service";
import VersionsHistoryItem from "./VersionsHistoryItem";
import {
  IEntity,
  EntityEvents,
  IEntityCommit,
  EntityTypeToNameMap,
} from "@multiplayer/types";
import { IListRes } from "shared/models/interfaces";
import { useEntities } from "shared/providers/EntitiesContext";
import {
  AlertTypes,
  useAlertDialog,
} from "shared/providers/AlertDialogContext";
import { useSocket } from "shared/providers/SocketContext";
import VersionHistoryFilter from "./VersionHistoryFilter";
import { EntityConverter } from "@multiplayer/entity";

interface VersionsHistoryDrawerProps {
  disclosure: UseDisclosureReturn;
}

const VersionsHistoryDrawer = ({ disclosure }: VersionsHistoryDrawerProps) => {
  const message = useMessage();
  const { path } = useParams();
  const { currentBranchId } = useVersion();
  const [params, setParams] = useState(null);
  const [filter, setFilter] = useState("all");
  const { openAlertDialog } = useAlertDialog();
  const { subscribe, unsubscribe } = useSocket();
  const { entityCommits, onEntityReset, onEntityCopy } = useEntities();
  const [commits, setCommits] = useState<IListRes<IEntityCommit>>({
    data: [],
    cursor: { total: 0, skip: 0, limit: 0 },
  });
  const [fetching, setFetching] = useState(true);
  const scrollRef = useRef<HTMLDivElement>();

  const fetchData = useCallback(async (branchId, entityId, query) => {
    try {
      setFetching(true);
      const res = await getEntityCommits(branchId, entityId, query);
      setCommits((prev) =>
        query.skip === 0
          ? res
          : { data: [...prev.data, ...res.data], cursor: res.cursor }
      );
      if (query.skip === 0) {
        scrollRef.current?.scrollTo(0, 0);
      }
    } catch (error) {
      message.handleError(error);
    }
    setFetching(false);
  }, []);

  const onScrollEnd = () => {
    setParams((prev) => {
      if (fetching || prev.skip + prev.limit > commits.cursor.total) {
        return prev;
      }
      return { ...prev, skip: prev.skip + prev.limit };
    });
  };

  const handleRestore = async (commit: IEntityCommit) => {
    try {
      const confirm = await openAlertDialog({
        type: AlertTypes.WARNING,
        title: "Restore version",
        closeBtnLabel: "Cancel",
        confirmBtnLabel: "Restore",
        description: `Are you certain you wish to revert the ${EntityTypeToNameMap[
          commit.entityType
        ].toLowerCase()} to this version?`,
      });
      if (!confirm) return;
      const { branchId, entityId } = params;
      await onEntityReset({ branchId, entityId, entityCommitId: commit._id });
    } catch (error) {
      message.handleError(error);
    }
  };

  const handleCopy = async (commit: IEntityCommit) => {
    try {
      const { branchId, entityId } = params;
      const entity = (await onEntityCopy({
        branchId,
        entityId,
        entityCommitId: commit._id,
      })) as IEntity;
      message.success(`${entity.key} was successfully created`);
    } catch (error) {
      message.handleError(error);
    }
  };

  const handleRename = async (commit: IEntityCommit, name: string) => {
    try {
      const { branchId, entityId } = params;
      await updateEntityCommit(branchId, entityId, commit._id, {
        status: commit.status,
        name,
      });
      setCommits((prev) => ({
        cursor: { ...prev.cursor, total: prev.cursor.total + 1 },
        data: prev.data.map((d) =>
          d._id === commit._id
            ? {
                ...d,
                name,
              }
            : d
        ),
      }));
    } catch (error) {
      message.handleError(error);
    }
  };
  const printContent = async (commit: IEntityCommit) => {
    try {
      const { branchId, entityId } = params;
      const res = await getEntityCommitContents(branchId, entityId, commit._id);
      console.log(
        "COMMIT CONTENT:",
        EntityConverter.convertStateToData(commit.entityType, res)
      );
    } catch (error) {
      message.handleError(error);
    }
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setParams((prev) => ({
      ...prev,
      skip: 0,
      namedOnly: value === "named" ? true : undefined,
    }));
  };

  useEffect(() => {
    if (params) {
      const { branchId, entityId, ...query } = params;
      fetchData(branchId, entityId, query);
    }
  }, [params]);

  useEffect(() => {
    if (disclosure.isOpen) {
      if (
        !params ||
        params.entityId !== path ||
        params.branchId !== currentBranchId
      ) {
        setParams({
          skip: 0,
          limit: 30,
          entityId: path,
          branchId: currentBranchId,
        });
      }
    }
  }, [disclosure.isOpen, path, currentBranchId]);

  useEffect(() => {
    const onEntityCommit = (commit: IEntityCommit) => {
      if (commit.entity === path) {
        setCommits((prev) => ({
          cursor: { ...prev.cursor, total: prev.cursor.total + 1 },
          data: [commit, ...prev.data],
        }));
      }
    };

    if (disclosure.isOpen) {
      subscribe(EntityEvents.ENTITY_COMMIT, onEntityCommit);
    }
    return () => {
      unsubscribe(EntityEvents.ENTITY_COMMIT, onEntityCommit);
    };
  }, [subscribe, unsubscribe, disclosure.isOpen, path]);

  const currentCommit = entityCommits[path];

  return (
    <Drawer isOpen={disclosure.isOpen}>
      {/* <DrawerOverlay onClick={disclosure.onClose} /> */}
      <DrawerContent>
        <Flex
          px="4"
          py="2"
          gap="4"
          minH="14"
          alignItems="center"
          borderBottom="solid 1px"
          borderColor="border.secondary"
        >
          <Box minW="10">
            <IconButton
              size="sm"
              variant="base"
              aria-label="close"
              icon={<CloseIcon />}
              onClick={disclosure.onClose}
            />
          </Box>
          <Text flex="1" fontSize="md" fontWeight="medium" textAlign="center">
            Version History
          </Text>
          <Box minW="10"></Box>
        </Flex>
        <Box px="4" pt="6" pb="4">
          <VersionHistoryFilter value={filter} onChange={handleFilterChange} />
        </Box>
        <InfiniteScrollBox
          p="4"
          gap="3"
          flex="1"
          minH="0"
          display="flex"
          flexDir="column"
          ref={scrollRef}
          isLoading={fetching}
          onScrollEnd={onScrollEnd}
        >
          {commits.data.map((item) => (
            <VersionsHistoryItem
              key={item._id}
              data={item}
              onRename={handleRename}
              onRestore={handleRestore}
              onCopy={handleCopy}
              printContent={printContent}
              isActive={item._id === currentCommit?._id}
            />
          ))}
        </InfiniteScrollBox>
      </DrawerContent>
    </Drawer>
  );
};

export default VersionsHistoryDrawer;
