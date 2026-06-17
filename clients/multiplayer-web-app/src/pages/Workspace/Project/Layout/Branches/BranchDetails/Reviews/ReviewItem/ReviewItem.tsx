import { Flex, Text, Icon, Stack } from "@chakra-ui/react";
import WorkspaceUserName from "shared/components/WorkspaceUserName";
import WorkspaceUserAvatar from "shared/components/WorkspaceUserAvatar";
import { TimeIcon, ThumbUpIcon, AddReviewIcon } from "shared/icons";
import { ProjectBranchReviewState } from "@multiplayer/types";

const ReviewItem = ({ data }) => {
  const userId = data.workspaceUser as string;
  return (
    <Flex key={data._id} gap="2" mt="2">
      <WorkspaceUserAvatar size="xs" user={userId} />
      <Stack width="full" gap={3}>
        <Flex alignItems="center">
          <Text
            flex="1"
            minW="0"
            overflow="hidden"
            whiteSpace="nowrap"
            textOverflow="ellipsis"
            color="subtle"
          >
            <WorkspaceUserName user={userId} />
          </Text>
          {data.state === undefined ? (
            <Icon as={TimeIcon} />
          ) : data.state === ProjectBranchReviewState.APPROVED ? (
            <Icon color="green.500" as={ThumbUpIcon} />
          ) : (
            <Icon color="orange.500" as={AddReviewIcon} />
          )}
        </Flex>
        {data.comments?.map((comment) => (
          <Text color="muted" fontSize="xs" fontWeight="normal">
            {comment.content}
          </Text>
        ))}
      </Stack>
    </Flex>
  );
};

export default ReviewItem;
