import { Badge, BadgeProps } from "@chakra-ui/react";
import { ProjectBranchStatus } from "@multiplayer/types";

interface StatusBadgeProps extends BadgeProps {
  status: ProjectBranchStatus;
}

const StatusBadge = ({ status, ...rest }: StatusBadgeProps) => {
  if (!statusBadgeMap[status]) return null;
  return (
    <Badge
      minW="45px"
      lineHeight="8"
      px="2"
      textAlign="center"
      borderRadius="full"
      fontWeight="medium"
      textTransform="capitalize"
      bg={statusBadgeMap[status].bg}
      color={statusBadgeMap[status].color}
      {...rest}
    >
      {statusBadgeMap[status].label}
    </Badge>
  );
};

const statusBadgeMap = {
  [ProjectBranchStatus.DRAFT]: {
    label: "Draft",
    bg: "muted",
    color: "#2E3536",
  },
  [ProjectBranchStatus.TO_REVIEW]: {
    label: "In Review",
    bg: "#FFB62A",
    color: "#2E3536",
  },
  [ProjectBranchStatus.IN_DEVELOPMENT]: {
    label: "In Development",
    bg: "green.400",
    color: "inverse",
  },
  [ProjectBranchStatus.APPROVED]: {
    label: "Approved",
    bg: "#397BF3",
    color: "inverse",
  },
};

export default StatusBadge;
