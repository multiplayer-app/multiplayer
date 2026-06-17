import { Button, Flex, Icon } from "@chakra-ui/react";
import { ProjectBranchReviewState } from "@multiplayer/types";
import { IconType } from "shared/models/types";

interface ReviewButtonProps {
  reviewState: ProjectBranchReviewState;
  currentState: ProjectBranchReviewState;
  onReview: (state: ProjectBranchReviewState) => void;
  icon: IconType;
  text: string;
  colorScheme: string;
  disabled: boolean;
}

const ReviewButton = ({
  reviewState,
  currentState,
  onReview,
  icon,
  text,
  colorScheme,
  disabled,
}: ReviewButtonProps) => {
  const bgColor = currentState === reviewState ? `${colorScheme}.500` : "none";
  const textColor =
    currentState === reviewState ? "inverse" : `${colorScheme}.500`;

  return (
    <Button
      flex="1"
      py={2}
      variant="base"
      height="auto"
      borderRadius="md"
      onClick={() => onReview(reviewState)}
      bg={bgColor}
      color={textColor}
      disabled={disabled}
    >
      <Flex alignItems="center" flexDirection="column">
        <Icon as={icon} mb={2} />
        {text}
      </Flex>
    </Button>
  );
};

export default ReviewButton;
