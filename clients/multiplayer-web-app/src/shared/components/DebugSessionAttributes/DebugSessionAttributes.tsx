import {
  Box,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Link,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { IDebugSession } from "@multiplayer/types";
import { ResourceAttributesToNameMap } from "pages/Workspace/Project/Debugger/DebugSession/types";
import {
  UserIcon,
  GlobeIcon,
  EntityPlatformIcon,
  InfoCircleIcon,
  LockIcon,
} from "shared/icons";
import { DetailList, DetailListHeader, DetailItem } from "../Details";
import DebounceInput from "../DebounceInput";
import DebugSessionTypeBadge from "../DebugSessionTypeBadge";
import TagInput from "../TagInput";
import TraceIcon from "../TraceIcon";
import { SessionType } from "@multiplayer-app/session-recorder-react";
import { useState, useEffect } from "react";
import { getLatestSessionRecorderReactVersion } from "shared/services/radar.service";
import { WarningTwoIcon } from "@chakra-ui/icons";
import { getReporterName } from "shared/utils";

interface DebugSessionAttributesProps {
  session: IDebugSession;
  metadata?: any;
  readonly?: boolean;
  rootClient?: {
    serviceName: string;
    host: string;
    meta: any;
  };
  onSessionNameChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTagChange?: (tags: string[]) => void;
}

const DebugSessionAttributes = ({
  session,
  metadata,
  rootClient,
  readonly = true,
  onTagChange,
  onSessionNameChange,
}: DebugSessionAttributesProps) => {
  if (!session) return null;

  return (
    <Box h="full" flex="1" p="4" overflow="auto">
      <Flex gap="4" direction="column" mb="6">
        {rootClient?.serviceName && (
          <Flex>
            <TraceIcon
              trace={rootClient.meta}
              color="brand.500"
              mr={2}
              boxSize="20px"
            />
            <Box>{rootClient.serviceName}</Box>
          </Flex>
        )}
        {rootClient?.host && (
          <Flex>
            <Icon as={EntityPlatformIcon} mr={2} color="brand.500"></Icon>
            <Box>{rootClient.host}</Box>
          </Flex>
        )}
        <Flex color="muted">
          <Icon as={InfoCircleIcon} mr={2} color="brand.500"></Icon>
          <Box fontWeight="500" color="brand.500">
            Information
          </Box>
        </Flex>
        {metadata && (
          <Flex gap="2" flex="2" minWidth="0" alignItems="center">
            <Icon
              as={LockIcon}
              color={
                metadata.data.href.startsWith("https:")
                  ? "green.300"
                  : "red.300"
              }
              boxSize="4"
            />
            <Link
              fontSize="small"
              color="muted"
              noOfLines={1}
              wordBreak="break-all"
              target="_blank"
              href={metadata.data.href}
            >
              {metadata.data.href}
            </Link>
          </Flex>
        )}
        <FormControl>
          <FormLabel>Session Name</FormLabel>
          <DebounceInput
            placeholder="Enter a session name..."
            key={session._id}
            value={session.name}
            onChange={onSessionNameChange}
            readOnly={readonly || !onSessionNameChange}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Tags</FormLabel>
          <TagInput
            autoFocus={false}
            readonly={readonly}
            value={(session.tags as unknown as string[]) || []}
            onChange={onTagChange}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Recording Mode</FormLabel>
          <DebugSessionTypeBadge
            sessionType={
              session.continuousDebugSession
                ? SessionType.CONTINUOUS
                : SessionType.PLAIN
            }
          />
        </FormControl>
        <FormControl>
          <FormLabel>Creation Type</FormLabel>
          <DebugSessionTypeBadge creationType={session.creationReason} />
        </FormControl>
        <FormControl>
          <FormLabel>Comment</FormLabel>
          <Text mt="2" color="subtle" fontStyle="italic">
            {session.sessionAttributes?.comment || "No comments available"}
          </Text>
        </FormControl>
      </Flex>
      <DetailList mb="6">

        <DetailListHeader icon={<Icon as={UserIcon} />} title="Reporter" />
        <DetailItem
          label="Username"
          value={getReporterName(session, "Unknown")}
        />
      </DetailList>
      <DetailList>
        <DetailListHeader
          icon={<Icon as={GlobeIcon} />}
          title="Session details"
        />

       <DetailItem
          label="Started at"
          value={
            session.startedAt
              ? new Date(session.startedAt).toLocaleString("en-US", {
                  month: "long",
                  year: "numeric",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : null
          }
        />
        <DetailItem
          label="Stopped at"
          value={
            session.stoppedAt
              ? new Date(session.stoppedAt).toLocaleString("en-US", {
                  month: "long",
                  year: "numeric",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "Recording in progress"
          }
        />
        {session.resourceAttributes &&
          Object.keys(ResourceAttributesToNameMap).map((key) => (
            <DetailItem
              key={key}
              label={ResourceAttributesToNameMap[key] || key}
              value={
                <>
                  {key === "packageVersion" && (
                    <SessionRecorderReactVersion
                      packageVersion={session.resourceAttributes[key]}
                    />
                  )}{" "}
                  {session.resourceAttributes[key]}
                </>
              }
            />
          ))}
      </DetailList>
    </Box>
  );
};

const SessionRecorderReactVersion = ({
  packageVersion,
}: {
  packageVersion: string;
}) => {
  const [latest, setLatest] = useState<string | null>(null);

  useEffect(() => {
    getLatestSessionRecorderReactVersion().then(setLatest);
  }, []);

  if (!latest || packageVersion === latest) {
    return null;
  }

  return (
    <Tooltip
      label={`Your session recorder library version is out of date. Please update it to the latest (${latest}) version.`}
    >
      <Icon as={WarningTwoIcon} color="orange.400" boxSize="4" />
    </Tooltip>
  );
};
export default DebugSessionAttributes;
