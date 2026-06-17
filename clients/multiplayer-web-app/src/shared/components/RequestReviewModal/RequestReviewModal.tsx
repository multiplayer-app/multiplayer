import {
  Box,
  Text,
  Flex,
  Modal,
  Input,
  Image,
  Stack,
  Button,
  Checkbox,
  ModalBody,
  InputGroup,
  ModalHeader,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import {
  IBranchReview,
  IWorkspaceUser,
  ListBranchReviewsResponse,
} from "@multiplayer/types";

import useMessage from "shared/hooks/useMessage";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import WorkspaceUserName from "shared/components/WorkspaceUserName";
import WorkspaceUserAvatar from "shared/components/WorkspaceUserAvatar";
import { inviteBranchReviewer } from "shared/services/version.service";
import membersPreview from "assets/images/previews/request-review.svg";
import { toggleStateSet } from "shared/helpers/useState.helpers";
import { IListRes } from "shared/models/interfaces";

const RequestReviewModal = ({
  reviews,
  branchId,
  disclosure,
  afterReviewerInvite,
  canSkip = false,
}) => {
  return (
    <Modal
      isCentered
      size="4xl"
      isOpen={disclosure.isOpen}
      onClose={disclosure.onClose}
    >
      <ModalOverlay />
      <ModalContent flexDirection="row">
        <ModalCloseButton color="muted" zIndex="2" />
        <Stack flex="1" spacing={0}>
          <ModalHeader>Request a design review</ModalHeader>
          <ModalBody as={Flex} flexDirection="column" minH="0">
            <Text color="muted" mt="6" mb="6">
              Invite people to review this branch. They’ll get a notification
              instantly.
            </Text>
            <RequestOrInviteReview
              canSkip={canSkip}
              reviews={reviews}
              branchId={branchId}
              onInvite={afterReviewerInvite}
            />
          </ModalBody>
        </Stack>
        <Flex
          w="400px"
          minH="515px"
          h="100%"
          bg="bg.surface"
          borderEndRadius="3xl"
          position="relative"
          alignItems="center"
          justifyContent="center"
        >
          <Image src={membersPreview} w="240px" />
        </Flex>
      </ModalContent>
    </Modal>
  );
};

const RequestOrInviteReview = ({
  reviews,
  branchId,
  canSkip,
  onInvite,
}: {
  reviews: IListRes<ListBranchReviewsResponse>;
  branchId: string;
  canSkip: boolean;
  onInvite: (arg?: IBranchReview) => void;
}) => {
  const { user, users } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [checkedMembers, setCheckedMembers] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const message = useMessage();

  const members = useMemo<IReviewer[]>(() => {
    const reviewMap = {};
    reviews?.data?.forEach((review) => {
      reviewMap[review.workspaceUser as string] = review;
    });
    const excludedUserIds = new Set();

    excludedUserIds.add(user.data._id);

    return Object.values(users.data).reduce((acc, u) => {
      const review = reviewMap[u._id];
      if (excludedUserIds.has(u._id) || review?.vote) return acc;
      const isPending = review && !review.vote;
      acc.push({ ...u, isPending });
      return acc;
    }, []);
  }, [reviews]);

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.firstName?.toLowerCase().includes(q) ||
        m.lastName?.toLowerCase().includes(q) ||
        m.username?.toLowerCase().includes(q) ||
        m.primaryEmail?.toLowerCase().includes(q) ||
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
        `${m.lastName} ${m.firstName}`.toLowerCase().includes(q)
    );
  }, [query, members]);

  const handleInvite = async () => {
    try {
      setLoading(true);
      const res = await inviteBranchReviewer(branchId, {
        workspaceUsers: Array.from(checkedMembers),
        emails: [],
      });
      onInvite(res);
    } catch (error) {
      message.handleError(error);
    }
    setLoading(false);
  };

  return (
    <Flex flex="1" flexDirection="column" pb="2">
      <InputGroup>
        <Input
          mb="4"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          placeholder="Search a team-mate"
        />
      </InputGroup>
      <Box flex="1" maxH="227px" overflow="auto" mb="4" mx="-6" px="6">
        {filteredMembers.map((m) => (
          <Flex key={m._id} alignItems="center" gap="2" py="2" as="label">
            <Checkbox
              isDisabled={m.isPending}
              isChecked={checkedMembers.has(m._id)}
              onChange={() => setCheckedMembers(toggleStateSet(m._id))}
            />
            <WorkspaceUserAvatar size="sm" user={m} />
            <Box flex="1" minW="0">
              <Text
                lineHeight="1.2"
                overflow="hidden"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
              >
                <WorkspaceUserName user={m} />
              </Text>
              <Text
                lineHeight="1.2"
                overflow="hidden"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                color="muted"
              >
                {m.primaryEmail}
              </Text>
            </Box>
            {m.isPending && (
              <Button
                px="2"
                size="sm"
                variant="light"
                color="green.500"
                borderRadius="base"
                pointerEvents="none"
              >
                Invited!
              </Button>
            )}
          </Flex>
        ))}
      </Box>
      <Flex gap={2}>
        <Button
          isDisabled={!checkedMembers.size}
          onClick={handleInvite}
          isLoading={loading}
          w="50%"
        >
          Send invitation
        </Button>
        <Button
          variant="light"
          w="50%"
          onClick={() => onInvite()}
          isDisabled={!canSkip}
        >
          Continue
        </Button>
      </Flex>
    </Flex>
  );
};

interface IReviewer extends IWorkspaceUser {
  isPending: boolean;
  primaryEmail: string;
}

export default RequestReviewModal;
