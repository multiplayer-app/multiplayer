import { Box, Flex, Icon, IconButton, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  IListRes,
  IGetChangesReqParams,
  IProjectBranchChange,
} from "shared/models/interfaces";
import {
  getBranchChanges,
  getBranchChangesStats,
} from "shared/services/version.service";
import { changeTypeConfigs } from "shared/configs/project.configs";
import useMessage from "shared/hooks/useMessage";
import EmptyBox from "shared/components/EmptyBox";
import { ChevronDownIcon } from "shared/icons";
import EntityIcon from "shared/components/EntityIcon";
import InfiniteScrollBox from "shared/components/InfiniteScrollBox";
import ChangeTypeIcon from "shared/components/ChangeTypeIcon";

const Changes = ({ branchId }) => {
  const message = useMessage();
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [changesStats, setChangesStats] = useState([]);
  const [params, setParams] = useState<IGetChangesReqParams>({
    skip: null,
    limit: 100,
  });

  const [changes, setChanges] = useState<IListRes<IProjectBranchChange>>({
    data: [],
    cursor: { skip: 0, limit: 0, total: 0 },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getBranchChangesStats(branchId);
        setChangesStats(res);
      } catch (error) {
        message.handleError(error);
      }
    };

    fetchData();
  }, [branchId, message]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getBranchChanges(branchId, params);
        setChanges((prev) => ({
          cursor: res.cursor,
          data: params.skip ? [...prev.data, ...res.data] : res.data,
        }));
      } catch (error) {
        message.handleError(error);
      }
      setLoading(false);
    };

    fetchData();
  }, [branchId, params, message]);

  const handleScrollEnd = () => {
    if (loading || params.skip + params.limit > changes.cursor.total) {
      return;
    }

    setParams((prevParams) => ({
      ...prevParams,
      skip: prevParams.skip + prevParams.limit,
    }));
  };

  return (
    <Box
      border="1px"
      borderRadius="lg"
      fontWeight="medium"
      borderColor="border.tertiary"
      boxShadow="0px 1px 2px 0px #0000000D"
    >
      <Flex alignItems="center" p="4">
        <Text flex="1">Changes</Text>
        <Flex alignItems="center">
          {changesStats.map(({ changeType, count }) => (
            <Flex
              key={changeType}
              px="2"
              gap="1"
              fontSize="xs"
              alignItems="center"
              color={changeTypeConfigs[changeType].color}
            >
              <ChangeTypeIcon boxSize="2" name={changeType} />
              {count}
            </Flex>
          ))}
        </Flex>
        <Box w="1px" h="4" bg="bg.muted" ml="4" mr="1" />
        <IconButton
          size="xs"
          variant="base"
          aria-label="toggle"
          onClick={() => setCollapsed((prev) => !prev)}
          icon={
            <Icon
              color="muted"
              as={ChevronDownIcon}
              transform={`rotate(${collapsed ? "0" : "180deg"})`}
            />
          }
        />
      </Flex>

      <InfiniteScrollBox
        px="4"
        pb="4"
        flex="1"
        position="relative"
        hidden={collapsed}
        isLoading={loading}
        onScrollEnd={handleScrollEnd}
      >
        {changes.data.length ? (
          changes.data.map((change) => (
            <Flex
              py="2"
              gap="4"
              alignItems="center"
              fontWeight="medium"
              key={change.entity.entityId}
              position="relative"
            >
              <EntityIcon name={change.entity.type} />
              <Text flex="1">{change.entity.key}</Text>
              <Icon
                boxSize="2"
                as={changeTypeConfigs[change.entityCommit.changeType].icon}
              />
            </Flex>
          ))
        ) : (
          <EmptyBox title="This branch doesn’t have any changes yet." />
        )}
      </InfiniteScrollBox>
    </Box>
  );
};

export default Changes;
