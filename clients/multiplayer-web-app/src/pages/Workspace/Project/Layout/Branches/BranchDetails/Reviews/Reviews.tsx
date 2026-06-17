import { useEffect, useState } from "react";
import {
  ListBranchReviewsResponse,
  ProjectBranchReviewState,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";
import {
  AvatarGroup,
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import {
  AddReviewIcon,
  ChevronDownIcon,
  RequestReviewIcon,
  ThumbUpIcon,
} from "shared/icons";

import { useWorkspace } from "shared/providers/WorkspaceContext";
import {
  addReview,
  deleteReviewer,
  getBranchReviews,
  updateReview,
} from "shared/services/version.service";

import useMessage from "shared/hooks/useMessage";
import PageLoading from "shared/components/PageLoading";
import RequestReviewModal from "shared/components/RequestReviewModal";
import WorkspaceUserAvatar from "shared/components/WorkspaceUserAvatar";

import ReviewItem from "./ReviewItem";
import ReviewButton from "./ReviewButton";
import ThreadInput from "shared/components/Thread/ThreadInput";
import InfiniteScrollBox from "shared/components/InfiniteScrollBox";
import { IListRes } from "shared/models/interfaces";
import CheckAccess from "shared/components/CheckAccess";
import { useMemo } from "react";
import { usePermissions } from "shared/providers/PermissionsContext";

const Reviews = ({ branchId }) => {
  const [reviews, setReviews] = useState<IListRes<ListBranchReviewsResponse>>({
    cursor: { skip: null, limit: 100, total: 0 },
    data: [],
  });
  const [params, setParams] = useState({
    skip: 0,
    limit: 100,
  });
  const [myReview, setMyReview] = useState<ListBranchReviewsResponse>();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const message = useMessage();
  const { user } = useWorkspace();
  const modalDisclosure = useDisclosure();
  const { hasAccess } = usePermissions();
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getBranchReviews(branchId, params);
        const myReview = res.data.find(
          (review) => review.workspaceUser === user.data._id
        );
        setReviews(res);
        setMyReview(myReview);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchData();
  }, [branchId, user.data._id, params]);

  const afterReviewerInvite = (reviewer: ListBranchReviewsResponse[]) => {
    setReviews((prev) => ({
      cursor: {
        ...prev.cursor,
        total: prev.cursor.total + 1,
      },
      data: [...prev.data, ...reviewer],
    }));
    modalDisclosure.onClose();
  };

  const createNewReview = (
    state: ProjectBranchReviewState,
    value: string
  ): ListBranchReviewsResponse => ({
    state,
    _id: "",
    workspaceUser: user.data?._id,
    createdAt: "",
    updatedAt: "",
    thread: null,
    ...(value !== null && { comments: [{ content: value.trim() }] }),
  });

  const updateReviewComments = (
    review,
    value: string
  ): ListBranchReviewsResponse => {
    if (value !== null) {
      return {
        ...review,
        comments: [...(review.comments || []), { content: value?.trim() }],
      };
    }
    return review;
  };

  const updateReviewsData = (
    state: ProjectBranchReviewState,
    value: string = null
  ): void => {
    if (!reviews.data.length) {
      setReviews((prev) => ({
        cursor: {
          ...prev.cursor,
          total: 1,
        },
        data: [createNewReview(state, value)],
      }));
      return;
    }

    // Check if the user already has a review
    const userReviewExists = reviews.data.some(
      (review) => review.workspaceUser === user.data._id
    );

    if (!userReviewExists) {
      setReviews((prev) => ({
        cursor: {
          ...prev.cursor,
          total: prev.cursor.total + 1,
        },
        data: [...prev.data, createNewReview(state, value)],
      }));
      return;
    }

    setReviews((prev) => ({
      cursor: prev.cursor,
      data: prev.data.map((review) =>
        review.workspaceUser === user.data._id
          ? updateReviewComments({ ...review, state }, value)
          : review
      ),
    }));
  };

  const handleDeleteReview = async () => {
    try {
      await deleteReviewer(branchId, {
        workspaceUser: user.data._id,
      });
      setMyReview(null);
      setReviews((prev) => ({
        cursor: {
          ...prev.cursor,
          total: prev.cursor.total + 1,
        },
        data: prev.data.filter((d) => d.workspaceUser !== user.data._id),
      }));
    } catch (error) {
      message.handleError(error);
    }
  };

  const onRequestSubmit = async (state: ProjectBranchReviewState) => {
    const reviewMethod = myReview ? updateReview : addReview;
    try {
      await reviewMethod(branchId, {
        state,
      });
      setMyReview({
        ...myReview,
        state,
      });
      updateReviewsData(state);
    } catch (error) {
      message.handleError(error);
    }
  };

  const onRequestCommentSubmit = async (value: string, cb: Function) => {
    const state = ProjectBranchReviewState.REJECTED;
    try {
      await updateReview(branchId, {
        state,
        comment: value.trim(),
      });
      setMyReview({
        ...myReview,
        state,
      });
      updateReviewsData(state, value.trim());
    } catch (error) {
      message.handleError(error);
    }
    cb();
  };

  const handleScrollEnd = () => {
    if (loading || params.skip + params.limit > reviews.cursor.total) {
      return;
    }

    setParams((prevParams) => ({
      ...prevParams,
      skip: prevParams.skip + prevParams.limit,
    }));
  };

  const access = useMemo(
    () => ({
      read: hasAccess(
        RoleProjectPermissionEntity.PROJECT_BRANCH_REVIEW,
        RoleAccessAction.READ,
        RoleType.PROJECT
      ),
      create: hasAccess(
        RoleProjectPermissionEntity.PROJECT_BRANCH_REVIEW,
        RoleAccessAction.CREATE,
        RoleType.PROJECT
      ),
      update: hasAccess(
        RoleProjectPermissionEntity.PROJECT_BRANCH_REVIEW,
        RoleAccessAction.UPDATE,
        RoleType.PROJECT
      ),
      delete: hasAccess(
        RoleProjectPermissionEntity.PROJECT_BRANCH_REVIEW,
        RoleAccessAction.DELETE,
        RoleType.PROJECT
      ),
    }),
    [hasAccess]
  );

  return (
    <Box
      border="1px"
      borderRadius="lg"
      fontWeight="medium"
      borderColor="border.tertiary"
      boxShadow="0px 1px 2px 0px #0000000D"
    >
      <Flex alignItems="center" p="4">
        <Text flex="1">Reviews</Text>
        <AvatarGroup size="xs" max={4} spacing="-2">
          {reviews.data?.map(({ _id, workspaceUser }) => (
            <WorkspaceUserAvatar
              key={_id}
              showTooltip={false}
              user={workspaceUser}
            />
          ))}
        </AvatarGroup>
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
      <Box hidden={collapsed} p="4">
        {loading ? (
          <PageLoading />
        ) : (
          <>
            <Box
              pb="4"
              mb="6"
              borderBottom="1px"
              borderBottomColor="border.secondary"
            >
              <Flex alignItems="center" gap="2" mb="4">
                <WorkspaceUserAvatar user={user.data} size="xs" />
                Your review
              </Flex>
              <Flex borderRadius="lg" gap="1" p="1" bg="blackAlpha.50">
                <ReviewButton
                  reviewState={ProjectBranchReviewState.APPROVED}
                  currentState={myReview?.state}
                  onReview={onRequestSubmit}
                  icon={ThumbUpIcon}
                  text="Approved"
                  colorScheme="green"
                  disabled={!access.update}
                />
                <ReviewButton
                  reviewState={ProjectBranchReviewState.REJECTED}
                  currentState={myReview?.state}
                  onReview={onRequestSubmit}
                  icon={AddReviewIcon}
                  text="Request changes"
                  colorScheme="orange"
                  disabled={!access.update}
                />
              </Flex>
              {myReview?.state === ProjectBranchReviewState.REJECTED && (
                <ThreadInput
                  placeholder="Leave a comment"
                  onSubmit={onRequestCommentSubmit}
                  groupProps={{ mt: 2 }}
                />
              )}
              {myReview?.state && (
                <Button
                  mt="4"
                  w="full"
                  variant="link"
                  onClick={handleDeleteReview}
                >
                  Clear your review
                </Button>
              )}
            </Box>
            {reviews.data?.length ? (
              <>
                <InfiniteScrollBox
                  mb="4"
                  hidden={collapsed}
                  isLoading={loading}
                  onScrollEnd={handleScrollEnd}
                >
                  {reviews.data.map((review, index) => (
                    <ReviewItem data={review} key={index} />
                  ))}
                </InfiniteScrollBox>
                <CheckAccess
                  entity={RoleProjectPermissionEntity.PROJECT_BRANCH_REVIEW}
                  permission={RoleAccessAction.CREATE}
                  scope={RoleType.PROJECT}
                >
                  <Button
                    variant="link"
                    onClick={modalDisclosure.onOpen}
                    leftIcon={<Icon as={RequestReviewIcon} />}
                  >
                    Request a review
                  </Button>
                </CheckAccess>
              </>
            ) : (
              <CheckAccess
                entity={RoleProjectPermissionEntity.PROJECT_BRANCH_REVIEW}
                permission={RoleAccessAction.CREATE}
                scope={RoleType.PROJECT}
              >
                <Button onClick={modalDisclosure.onOpen} variant="link">
                  <Icon as={AddReviewIcon} mr={3} /> Request a review
                </Button>
              </CheckAccess>
            )}
          </>
        )}
      </Box>

      <RequestReviewModal
        reviews={reviews}
        branchId={branchId}
        disclosure={modalDisclosure}
        afterReviewerInvite={afterReviewerInvite}
      />
    </Box>
  );
};

export default Reviews;
