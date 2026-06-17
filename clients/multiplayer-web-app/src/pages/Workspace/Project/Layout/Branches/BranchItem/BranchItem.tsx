import { Flex, Text, Box, FlexProps, Tag } from "@chakra-ui/react";
import { ProjectBranchStatus } from "@multiplayer/types";
import TimeAgo from "shared/components/TimeAgo";
import { branchFilterStatuses } from "shared/configs/project.configs";

const BranchItem = ({
  name,
  owner,
  date,
  status,
  leftIcon,
  rightIcon,
  isActive,
  isDefault,
  isArchived,
  onClick,
}: {
  name: string;
  isDefault: boolean;
  date: string | Date;
  status?: ProjectBranchStatus;
  leftIcon: React.ReactElement;
  rightIcon: React.ReactElement;
  isActive: boolean;
  isArchived?: boolean;
  onClick?: () => void;
  owner?: any;
}) => {
  return (
    <Container
      isActive={isActive}
      px="4"
      py="2"
      gap="2"
      position="relative"
      alignItems="center"
      border="solid 1px"
      borderColor="border.primary"
      onClick={onClick}
      cursor={onClick ? "pointer" : "default"}
    >
      {leftIcon}
      <Box flex="1" fontSize="sm" minW="0">
        <Text mb="0.5" wordBreak="break-word">
          {name}
          {isArchived ? (
            <Tag
              ml="2"
              size="sm"
              border="1px"
              rounded="full"
              borderColor="blackAlpha.50"
            >
              Archived
            </Tag>
          ) : !isDefault && branchFilterStatuses[status] ? (
            <Tag
              ml="2"
              size="sm"
              border="1px"
              rounded="full"
              borderColor="blackAlpha.50"
              {...branchFilterStatuses[status].tag}
            >
              {branchFilterStatuses[status].label}
            </Tag>
          ) : null}
        </Text>
        {date && (
          <Flex minW="0" whiteSpace="nowrap" color="muted" gap="2">
            {owner && (
              <>
                <Text
                  overflow="hidden"
                  wordBreak="break-word"
                  textOverflow="ellipsis"
                >
                  {owner}
                </Text>
                {" · "}
              </>
            )}
            <Text>
              {isDefault && "Last update "}
              <TimeAgo date={date} />
            </Text>
          </Flex>
        )}
      </Box>
      {rightIcon}
    </Container>
  );
};

interface ContainerProps extends FlexProps {
  isActive: boolean;
}
const Container = ({ isActive, children, ...rest }: ContainerProps) => {
  return isActive ? (
    <Flex
      {...rest}
      borderBottomRadius="lg"
      borderColor="brand.500"
      boxShadow="0 0 0 1px var(--chakra-colors-brand-500)"
      _before={{
        px: "4",
        top: "-10px",
        left: "-2px",
        right: "-2px",
        color: "inverse",
        fontSize: "2xs",
        bg: "brand.500",
        borderTopRadius: "lg",
        position: "absolute",
        fontWeight: "semibold",
        content: '"ACTIVE BRANCH"',
      }}
    >
      {children}
    </Flex>
  ) : (
    <Flex {...rest} borderRadius="lg">
      {children}
    </Flex>
  );
};
export default BranchItem;
