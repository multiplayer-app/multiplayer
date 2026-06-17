import { Flex, Icon, Text, useColorModeValue } from "@chakra-ui/react";
import { SessionType } from "@multiplayer-app/session-recorder-react";
import { DebugSessionCreationReasonType } from "@multiplayer/types";
import { SessionTypeAutoIcon, SessionTypeManualIcon } from "shared/icons";

export const CreationTypeLabels = {
  [DebugSessionCreationReasonType.AUTO.toString()]: "Auto",
  [DebugSessionCreationReasonType.MANUAL.toString()]: "Manual",
};

export const SessionTypeLabels = {
  [SessionType.CONTINUOUS.toString()]: "Continuous",
  [SessionType.PLAIN.toString()]: "On Demand",
};

const SessionTypeMap = {
  [SessionType.CONTINUOUS]: {
    label: "Continuous",
    color: "purple",
  },
  [SessionType.MANUAL]: {
    label: "On Demand",
    color: "blue",
  },
  [SessionType.SESSION_CACHE]: {
    label: "Auto",
    color: "orange",
  },
};

const CreationTypeMap = {
  [DebugSessionCreationReasonType.AUTO]: {
    label: "Auto",
    icon: SessionTypeAutoIcon,
    color: "purple",
  },
  [DebugSessionCreationReasonType.MANUAL]: {
    label: "Manual",
    icon: SessionTypeManualIcon,
    color: "blue",
  },
  [DebugSessionCreationReasonType.ISSUE]: {
    label: "Issue",
    icon: SessionTypeAutoIcon,
    color: "orange",
  },
};

const useBadgeColorScheme = (color: string) => {
  const bg = useColorModeValue(`${color}.100`, `${color}.900`);
  const borderColor = useColorModeValue(`${color}.200`, `${color}.700`);
  const textColor = useColorModeValue(`${color}.600`, `${color}.200`);
  return { bg, borderColor, textColor };
};

const DebugSessionTypeBadge = ({
  creationType,
  sessionType,
}: {
  creationType?: DebugSessionCreationReasonType;
  sessionType?: SessionType;
}) => {
  const resolvedColor =
    (creationType && CreationTypeMap[creationType]?.color) ||
    (sessionType && SessionTypeMap[sessionType]?.color) ||
    "gray";
  const { bg, borderColor, textColor } = useBadgeColorScheme(resolvedColor);

  if (!creationType && !sessionType) {
    return null;
  }
  if (creationType && CreationTypeMap[creationType]) {
    const creationTypeData = CreationTypeMap[creationType];
    return (
      <Flex
        px="1"
        py="0.5"
        gap="1"
        width="fit-content"
        bg={bg}
        alignItems="center"
        border="1px solid"
        borderRadius="md"
        userSelect="none"
        borderColor={borderColor}
        color={textColor}
      >
        <Icon as={creationTypeData.icon} />
        <Text fontSize="xs" whiteSpace="nowrap">
          {creationTypeData.label}
        </Text>
      </Flex>
    );
  }
  if (sessionType && SessionTypeMap[sessionType]) {
    const sessionTypeData = SessionTypeMap[sessionType];
    return (
      <Flex
        px="1"
        py="0.5"
        gap="1"
        width="fit-content"
        alignItems="center"
        border="1px solid"
        borderRadius="md"
        userSelect="none"
        bg={bg}
        borderColor={borderColor}
      >
        <Text fontSize="xs" color={textColor} whiteSpace="nowrap">
          {sessionTypeData.label}
        </Text>
      </Flex>
    );
  }
  return null;
};

export default DebugSessionTypeBadge;
