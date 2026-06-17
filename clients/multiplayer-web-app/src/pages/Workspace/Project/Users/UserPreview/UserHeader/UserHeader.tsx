import { useMemo } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Icon,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import {
  GlobeIcon,
  PlayCircleIcon,
  RecordingIcon,
  StopCircleIcon,
  UserEntityIcon,
} from "shared/icons";
import {
  EndUserState,
  EndUserType,
  SessionRecordingNextRecordType,
} from "@multiplayer/types";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";
import { useUser } from "shared/providers/UserContext";
import UserRecordingPopup from "shared/components/UserRecordingPopup";

const UserHeader = ({ data }) => {
  const { withSandboxCheck } = useProjectSandbox();
  const { isOpen, onOpen: onOpenRecordingSettings, onClose } = useDisclosure();
  const { startRecording, stopRecording, isRecording } = useUser();

  const statusBadge = useMemo(() => {
    if (!data) return null;

    const { online, conditionalRecordingSettings } = data;

    switch (conditionalRecordingSettings?.whenToRecord) {
      case SessionRecordingNextRecordType.ALWAYS_WHEN_ACTIVE:
      case SessionRecordingNextRecordType.N_TIMES_WHEN_ACTIVE:
      case SessionRecordingNextRecordType.ONCE_WHEN_ACTIVE:
        return (
          <Badge
            ml="2"
            px="6px"
            borderRadius="6px"
            color="blue.500"
            backgroundColor="blue.50"
            border="1px solid"
            borderColor="blue.100"
            textTransform="unset"
            fontSize="xs"
            lineHeight="20px"
            fontWeight="medium"
            display="inline-flex"
            alignItems="center"
            gap="1"
          >
            <Icon as={PlayCircleIcon} color="blue.400" boxSize={4} />
            Record when active
          </Badge>
        );
      case SessionRecordingNextRecordType.NO_AUTO_START:
        return (
          <Badge
            ml="2"
            px="6px"
            borderRadius="6px"
            color="muted"
            backgroundColor="bg.subtle"
            border="1px solid"
            borderColor="border.primary"
            textTransform="unset"
            fontSize="xs"
            lineHeight="20px"
            fontWeight="medium"
            display="inline-flex"
            alignItems="center"
            gap="1"
          >
            Manual only
          </Badge>
        );
      default:
        return online ? (
          <Badge
            ml="2"
            px="6px"
            borderRadius="6px"
            color="green.400"
            backgroundColor="green.50"
            border="1px solid"
            borderColor="green.100"
            textTransform="unset"
            fontSize="xs"
            lineHeight="20px"
            fontWeight="medium"
            display="inline-flex"
            alignItems="center"
            gap="1"
          >
            <Icon as={PlayCircleIcon} color="green.400" boxSize={4} />
            Active
          </Badge>
        ) : (
          <Badge
            ml="2"
            px="6px"
            borderRadius="6px"
            color="muted"
            backgroundColor="bg.subtle"
            border="1px solid"
            borderColor="border.primary"
            textTransform="unset"
            fontSize="xs"
            lineHeight="20px"
            fontWeight="medium"
            display="inline-flex"
            alignItems="center"
            gap="1"
          >
            <Icon as={GlobeIcon} color="muted" boxSize={4} />
            Inactive
          </Badge>
        );
    }
  }, [data]);

  const isCurrentlyRecording = useMemo(() => {
    return data?.connections?.some(
      (conn) => conn.state === EndUserState.RECORDING
    );
  }, [data?.connections]);

  if (!data) {
    return null;
  }
  const { attributes, online } = data;

  return (
    <Flex
      gap={2}
      alignItems={{ base: "flex-start", md: "center" }}
      flexDirection={{ base: "column", md: "row" }}
    >
      <Flex alignItems="center" gap={4} flex="1">
        <Flex
          p="1"
          bg="bg.surface"
          borderRadius="lg"
          alignItems="center"
          justifyContent="center"
          boxSize={16}
          position="relative"
        >
          <Icon as={UserEntityIcon} boxSize={8} color="muted" />
          {isCurrentlyRecording ? (
            <Icon
              as={RecordingIcon}
              boxSize={5}
              position="absolute"
              right="-4px"
              top="-4px"
            />
          ) : (
            online && (
              <Box
                position="absolute"
                width="14px"
                height="14px"
                border="2px solid white"
                right={-1}
                top={-1}
                borderRadius="50%"
                backgroundColor="green.400"
              />
            )
          )}
        </Flex>
        <VStack gap={1} align="left" lineHeight="normal">
          <Text
            fontSize="lg"
            fontWeight={600}
            position="relative"
            lineHeight="24px"
          >
            {attributes.name}
            {statusBadge}
          </Text>
          <Text fontSize="xs" color="muted">
            {attributes.userEmail}
          </Text>
          <Text fontSize="xs" color="muted">
            {attributes.orgName}
          </Text>
        </VStack>
      </Flex>
      {attributes.type !== EndUserType.VISITOR && (
        <Flex gap={2} alignItems="center" alignSelf="flex-end">
          <Button
            size="md"
            borderRadius="lg"
            variant={isRecording ? "danger" : "primary"}
            onClick={isRecording ? stopRecording : startRecording}
            isDisabled={!online}
            leftIcon={
              <Icon
                as={isRecording ? StopCircleIcon : PlayCircleIcon}
                color="white"
              />
            }
          >
            {isRecording ? "Stop recording" : "Record"}
          </Button>
          <Button
            size="md"
            borderRadius="lg"
            variant="light"
            onClick={withSandboxCheck(onOpenRecordingSettings)}
          >
            Recording Settings
          </Button>
        </Flex>
      )}
      <UserRecordingPopup
        isOpen={isOpen}
        type={attributes.type}
        online={online}
        onClose={onClose}
        selectedIds={[data._id]}
      />
    </Flex>
  );
};

export default UserHeader;
