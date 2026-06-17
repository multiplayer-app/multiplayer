import { Box, Icon, Tag, useColorModeValue } from "@chakra-ui/react";
import {
  GlobeIcon,
  PlayCircleIcon,
} from "shared/icons";
import {
  EndUserState,
  IEndUser,
  SessionRecordingNextRecordType,
} from "@multiplayer/types";
import { ArrowUpRightIcon } from "lucide-react";

const isRecording = (connections: IEndUser["connections"]) =>
  connections.some((conn) => conn.state === EndUserState.RECORDING);

type Props = {
  connections: IEndUser["connections"];
  online: boolean;
  conditionalRecordingSettings?: {
    whenToRecord?: SessionRecordingNextRecordType;
  } | null;
  onRecordingClick?: () => void;
};

const EndUserStatusBadge = ({
  connections,
  online,
  conditionalRecordingSettings,
  onRecordingClick,
}: Props) => {
  const recordingColors = {
    bg: useColorModeValue("red.50", "red.900"),
    border: useColorModeValue("red.100", "red.700"),
    text: useColorModeValue("red.500", "red.200"),
    dot: useColorModeValue("red.500", "red.300"),
  };

  const recordWhenActiveColors = {
    bg: useColorModeValue("blue.50", "blue.900"),
    border: useColorModeValue("blue.100", "blue.700"),
    text: useColorModeValue("blue.500", "blue.200"),
    icon: useColorModeValue("blue.400", "blue.200"),
  };

  const activeColors = {
    bg: useColorModeValue("green.50", "green.900"),
    border: useColorModeValue("green.100", "green.700"),
    text: useColorModeValue("green.500", "green.200"),
    icon: useColorModeValue("green.500", "green.200"),
  };

  const inactiveColors = {
    bg: useColorModeValue("gray.50", "gray.900"),
    border: useColorModeValue("gray.100", "gray.700"),
    text: useColorModeValue("gray.500", "gray.300"),
    icon: useColorModeValue("gray.500", "gray.300"),
  };

  if (isRecording(connections)) {
    return (
      <Tag
        size="sm"
        bg={recordingColors.bg}
        border="1px"
        color={recordingColors.text}
        fontWeight={500}
        borderRadius="6px"
        borderColor={recordingColors.border}
        px={1}
        py="1px"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onRecordingClick?.();
        }}
      >
        <Box
          width="6px"
          height="6px"
          backgroundColor={recordingColors.dot}
          borderRadius="50%"
          mx={1}
        />{" "}
        Recording
        <Icon as={ArrowUpRightIcon} />
      </Tag>
    );
  }

  switch (conditionalRecordingSettings?.whenToRecord) {
    case SessionRecordingNextRecordType.ALWAYS_WHEN_ACTIVE:
    case SessionRecordingNextRecordType.N_TIMES_WHEN_ACTIVE:
    case SessionRecordingNextRecordType.ONCE_WHEN_ACTIVE:
      return (
        <Tag
          size="sm"
          bg={recordWhenActiveColors.bg}
          whiteSpace="nowrap"
          border="1px"
          color={recordWhenActiveColors.text}
          fontWeight={500}
          borderRadius="6px"
          borderColor={recordWhenActiveColors.border}
          px={1}
          py="1px"
        >
          <Icon
            as={PlayCircleIcon}
            color={recordWhenActiveColors.icon}
            mr={2}
          />
          Record when active
        </Tag>
      );
    default:
      return online ? (
        <Tag
          size="sm"
          bg={activeColors.bg}
          border="1px"
          color={activeColors.text}
          fontWeight={500}
          borderRadius="6px"
          borderColor={activeColors.border}
          px={1}
          py="1px"
        >
          <Icon as={GlobeIcon} color={activeColors.icon} mr={2} /> Active
        </Tag>
      ) : (
        <Tag
          size="sm"
          bg={inactiveColors.bg}
          border="1px"
          color={inactiveColors.text}
          fontWeight={500}
          borderRadius="6px"
          borderColor={inactiveColors.border}
          px={1}
          py="1px"
        >
          <Icon as={GlobeIcon} color={inactiveColors.icon} mr={2} /> Inactive
        </Tag>
      );
  }
};

export default EndUserStatusBadge;

