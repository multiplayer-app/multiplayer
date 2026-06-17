import { Flex, Text, Box } from "@chakra-ui/react";
import EntityIcon from "shared/components/EntityIcon";
import { changeTypeConfigs } from "shared/configs/project.configs";
import ChangeItemCheckbox from "./ChangeItemCheckbox";
import ChangeTypeIcon from "shared/components/ChangeTypeIcon";

const ChangeItem = ({ id, change, endpoint, onClick, onHover, isHovered }) => {
  const changeType = change && change.entity.typeOfChangeInBranch;

  return (
    <Flex
      h="9"
      pr="4"
      pl="2"
      gap="4"
      cursor="pointer"
      alignItems="center"
      fontWeight="medium"
      position="relative"
      onClick={() => onClick(id)}
      onPointerEnter={() => onHover(id)}
      onPointerLeave={() => onHover(null)}
      bg={isHovered ? "blackAlpha.50" : "none"}
    >
      {change ? (
        <>
          <Box
            as="label"
            w="8"
            p="2"
            mr="-2"
            onClick={(e) => e.stopPropagation()}
          >
            <ChangeItemCheckbox id={id} endpoint={endpoint} />
          </Box>
          <EntityIcon name={change.entity.type} />
          <Text noOfLines={1}>
            {change.entityCommit.meta.entityName || change.entity.key}
          </Text>
          <Flex
            gap="1"
            ml="auto"
            fontSize="xs"
            alignItems="center"
            color={changeTypeConfigs[changeType].color}
          >
            <ChangeTypeIcon boxSize="2" name={changeType} />
            {changeTypeConfigs[changeType].label}
          </Flex>
        </>
      ) : null}
    </Flex>
  );
};

export default ChangeItem;
