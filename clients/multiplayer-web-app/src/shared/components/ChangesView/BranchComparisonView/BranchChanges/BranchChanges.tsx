import { useMemo } from "react";
import { Button, Icon, Flex, Box } from "@chakra-ui/react";

import { BranchPointIcon } from "shared/icons";

import ChangeItem from "./ChangeItem";
import AllToggleCheckbox from "./AllToggleCheckbox";

import EmptyBox from "shared/components/EmptyBox";
import ChangeTypeIcon from "shared/components/ChangeTypeIcon";
import { changeTypeConfigs } from "shared/configs/project.configs";

import { EntityCommitChangeType } from "@multiplayer/types";

const BranchChanges = ({
  ids,
  branch,
  changes,
  hovered,
  onClick,
  onHover,
  endpoint,
}) => {
  const counter = useMemo(() => {
    const counts = {};
    changes.forEach(({ entity }) => {
      const type = entity.typeOfChangeInBranch;
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [changes]);

  return (
    <Box flex="1">
      <Button
        my="6"
        size="sm"
        w="full"
        bg="bg.subtle"
        variant="base"
        borderColor="border.secondary"
        justifyContent="flex-start"
        leftIcon={<Icon as={BranchPointIcon} />}
      >
        {branch.name}
      </Button>
      <Box
        py="4"
        bg="bg.primary"
        border="1px"
        borderRadius="lg"
        borderColor="border.secondary"
      >
        <Flex px="4" mb="4" h="6">
          <Box mr="auto">
            <AllToggleCheckbox endpoint={endpoint} />
          </Box>
          {Object.keys(counter).map((type: EntityCommitChangeType) => (
            <Flex
              key={type}
              ml="4"
              gap="1"
              fontSize="xs"
              alignItems="center"
              color={changeTypeConfigs[type].color}
            >
              <ChangeTypeIcon boxSize="2" name={type} />
              {counter[type]}
            </Flex>
          ))}
        </Flex>
        {ids.map((id) => (
          <ChangeItem
            id={id}
            key={id}
            endpoint={endpoint}
            change={changes.get(id)}
            isHovered={hovered === id}
            onClick={onClick}
            onHover={onHover}
          />
        ))}
        {!ids.length && (
          <EmptyBox title="There are no changes!" bg="none" mb="10" />
        )}
      </Box>
    </Box>
  );
};

export default BranchChanges;
