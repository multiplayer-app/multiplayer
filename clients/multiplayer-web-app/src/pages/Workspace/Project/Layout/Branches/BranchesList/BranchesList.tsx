import { IProjectBranch } from "@multiplayer/types";
import { useRef, useEffect } from "react";
import {
  Avatar,
  IconButton,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  CheckboxGroup,
  Checkbox,
  Box,
  MenuDivider,
  Image,
} from "@chakra-ui/react";

import {
  branchFilterStatuses,
  defaultBranchFilterStatuses,
} from "shared/configs/project.configs";

import BranchItem from "../BranchItem";
import EmptyScreen from "shared/components/EmptyScreen";
import { ChevronRightIcon, MoreDotesIcon } from "shared/icons";
import { useVersion } from "shared/providers/VersionContext";
import InfiniteScrollBox from "shared/components/InfiniteScrollBox";
import DebounceSearch from "shared/components/DebounceSearch/DebounceSearch";
import EmptyBranches from "assets/images/emptyStates/branches-empty-list.png";

const BranchesList = ({
  currentBranchId,
  onBranchOpen,
  onBranchSelect,
}: {
  currentBranchId: string;
  onBranchOpen: (arg: IProjectBranch) => void;
  onBranchSelect: (arg: IProjectBranch) => void;
}) => {
  const scrollElement = useRef<HTMLDivElement>();

  const {
    branches: { data: branches, params, fetching },
    getBranches,
    setBranchParams,
  } = useVersion();

  useEffect(() => {
    setBranchParams({
      skip: null,
      name: null,
      limit: 100,
      default: false,
      archived: false,
      status: defaultBranchFilterStatuses,
    });
    return () => {
      setBranchParams(null);
    };
  }, [setBranchParams]);

  useEffect(() => {
    if (params) getBranches(params);
  }, [params, getBranches]);

  const onScrollEnd = () => {
    if (fetching || params.skip + params.limit > branches.cursor.total) {
      return;
    }
    setBranchParams({ skip: params.skip + params.limit });
  };

  const onQueryChange = (query: string) => {
    setBranchParams({ skip: null, name: query || null });
  };

  const onArchiveChange = (e) => {
    setBranchParams({
      skip: null,
      archived: e.target.checked === true ? null : false,
    });
  };

  const onStatusChange = (status) => {
    if (!status.length) return;
    setBranchParams({ skip: null, status });
  };

  return (
    <Flex
      minH="0"
      flex="1"
      flexDir="column"
      borderTop="1px"
      borderTopColor="bg.muted"
    >
      <Flex alignItems="center" gap="2" px="4" pt="4">
        <DebounceSearch inputGroupProps={{ m: 0 }} onSearch={onQueryChange} />
        <Menu placement="bottom-end" isLazy>
          <IconButton
            size="sm"
            variant="base"
            as={MenuButton}
            textAlign="center"
            aria-label="close"
            icon={
              <Icon
                color="muted"
                as={MoreDotesIcon}
                transform="rotate(90deg)"
              />
            }
          />
          <MenuList>
            <CheckboxGroup onChange={onStatusChange} value={params?.status}>
              {Object.values(branchFilterStatuses).map((tab) => {
                return (
                  <MenuItem as="label" key={tab.value} closeOnSelect={false}>
                    <Box flex="1">{tab.label}</Box>
                    <Checkbox value={tab.value} />
                  </MenuItem>
                );
              })}
            </CheckboxGroup>
            <MenuDivider />
            <MenuItem as="label" closeOnSelect={false}>
              <Box flex="1">Show archived</Box>
              <Checkbox
                value="archived"
                onChange={onArchiveChange}
                isChecked={params?.archived === null}
              />
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>

      <InfiniteScrollBox
        p="4"
        gap="4"
        flex="1"
        minH="0"
        display="flex"
        flexDir="column"
        isLoading={fetching}
        onScrollEnd={onScrollEnd}
        ref={scrollElement}
      >
        {!branches.data.length ? (
          <EmptyScreen
            title="You don't have any active design branches."
            description="Design branches give you immense flexibility and visibility into how you architect your software."
            icon={<Image w="180px" src={EmptyBranches} />}
          ></EmptyScreen>
        ) : (
          branches.data.map((b) => {
            const user = b.lastCommitMeta?.workspaceUsers?.[0];
            const fullName = user
              ? user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.username
              : "";

            return (
              <BranchItem
                key={b._id}
                name={b.name}
                owner={fullName}
                status={b.status}
                isDefault={b.default}
                isArchived={b.archived}
                date={b.lastCommitMeta?.date}
                onClick={() => onBranchSelect(b)}
                isActive={currentBranchId === b._id}
                rightIcon={
                  <IconButton
                    as="div"
                    bg="bg.muted"
                    variant="base"
                    aria-label="lock"
                    borderRadius="full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBranchOpen(b);
                    }}
                    icon={<ChevronRightIcon />}
                  />
                }
                leftIcon={
                  user && (
                    <Avatar
                      size={"sm"}
                      bg={user.color}
                      name={fullName}
                      src={user.iconUrl}
                      borderColor={user.color}
                    />
                  )
                }
              />
            );
          })
        )}
      </InfiniteScrollBox>
    </Flex>
  );
};

export default BranchesList;
