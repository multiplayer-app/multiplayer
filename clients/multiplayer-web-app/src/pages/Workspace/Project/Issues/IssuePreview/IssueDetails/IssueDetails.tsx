import { Box, BoxProps, HStack, StackProps, VStack } from "@chakra-ui/react";
import { IIssue } from "@multiplayer/types";
import { ReactNode } from "react";
import MonoText from "shared/components/MonoText";
import TimeAgo from "shared/components/TimeAgo";
import { useIssue } from "shared/providers/IssueContext";

const IssueDetails = (props: StackProps) => {
  const { issue } = useIssue();

  const env = issue.service?.environment
    ? [issue.service.environment]
    : issue.service?.environments ?? [];
  const rel = issue.service?.release
    ? [issue.service.release]
    : issue.service?.releases ?? [];

  return (
    <VStack p="4" gap="4" align="stretch" {...props}>
      <DetailItem
        label="Title:"
        value={issue.title}
        textAlign="left"
        flex="1"
      />
      <DetailItem
        label="Last seen:"
        value={<TimeAgo date={issue.lastSeen} />}
      />
      {issue.service && (
        <>
          <DetailItem label="Component:" value={issue.service.serviceName} />
          {env.length > 0 && (
            <DetailItem label="Environment:" value={env.join(", ")} />
          )}
          {rel.length > 0 && (
            <DetailItem label="Release:" value={rel.join(", ")} />
          )}
        </>
      )}
      {issue.metadata && (
        <>
          {issue.metadata.filename && (
            <DetailItem label="File:" value={issue.metadata.filename} />
          )}
          {issue.metadata.httpTarget && (
            <DetailItem label="Target:" value={issue.metadata.httpTarget} />
          )}
          {issue.metadata.value && (
            <DetailItem label="Value:" value={issue.metadata.value} />
          )}
          {issue.metadata.type && (
            <DetailItem label="Type:" value={issue.metadata.type} />
          )}
          {issue.metadata.function && (
            <DetailItem label="Function:" value={issue.metadata.function} />
          )}
          {issue.metadata.culprit && (
            <DetailItem label="Culprit:" value={issue.metadata.culprit} />
          )}
          {issue.metadata.message && (
            <DetailItem
              label="Message:"
              value={issue.metadata.message}
              textAlign="left"
              flex="1"
            />
          )}
          {issue.metadata.stacktrace && (
            <>
              <VStack gap="2" align="flex-start">
                <Box fontWeight="medium">Stacktrace</Box>
                <MonoText
                  whiteSpace="pre-wrap"
                  fontSize="xs"
                  wordBreak="break-word"
                  border="1px solid"
                  borderColor="border.primary"
                  borderRadius="base"
                  bg="bg.surface"
                  p="2"
                >
                  {issue.metadata.stacktrace}
                </MonoText>
              </VStack>
            </>
          )}
        </>
      )}
    </VStack>
  );
};

export const IssueDetailsContent = ({ issue }: { issue: IIssue }) => {
  const env = issue.service?.environment
    ? [issue.service.environment]
    : issue.service?.environments ?? [];
  const rel = issue.service?.release
    ? [issue.service.release]
    : issue.service?.releases ?? [];

  return (
    <>
      <Box fontWeight="medium">Details</Box>
      {issue.service && (
        <>
          <DetailItem label="Component:" value={issue.service.serviceName} />
          {env.length > 0 && (
            <DetailItem label="Environment:" value={env.join(", ")} />
          )}
          {rel.length > 0 && (
            <DetailItem label="Release:" value={rel.join(", ")} />
          )}
        </>
      )}
      <DetailItem label="Resolved:" value={issue.resolved ? "Yes" : "No"} />
      <DetailItem label="Archived:" value={issue.archived ? "Yes" : "No"} />
      <DetailItem
        label="Created at:"
        value={<TimeAgo date={issue.createdAt} />}
      />
      {issue.metadata && (
        <>
          {issue.metadata.filename && (
            <DetailItem label="File:" value={issue.metadata.filename} />
          )}
          {issue.metadata.httpTarget && (
            <DetailItem label="Target:" value={issue.metadata.httpTarget} />
          )}
          {issue.metadata.httpUrl && (
            <DetailItem label="URL:" value={issue.metadata.httpUrl} />
          )}
          {issue.metadata.value && (
            <DetailItem label="Value:" value={issue.metadata.value} />
          )}
          {issue.metadata.type && (
            <DetailItem label="Type:" value={issue.metadata.type} />
          )}
          {issue.metadata.function && (
            <DetailItem label="Function:" value={issue.metadata.function} />
          )}
          {issue.metadata.culprit && (
            <DetailItem label="Culprit:" value={issue.metadata.culprit} />
          )}
          {issue.metadata.message && (
            <DetailItem label="Message:" value={issue.metadata.message} />
          )}
          {issue.metadata.stacktrace && (
            <>
              <VStack gap="2" align="flex-start">
                <Box fontWeight="medium">Stacktrace</Box>
                <MonoText
                  whiteSpace="pre-wrap"
                  fontSize="xs"
                  wordBreak="break-word"
                >
                  {issue.metadata.stacktrace}
                </MonoText>
              </VStack>
            </>
          )}
        </>
      )}
    </>
  );
};

const DetailItem = ({
  label,
  value,
  ...rest
}: {
  label: string;
  value: ReactNode;
} & BoxProps) => {
  return (
    <HStack gap="8" align="flex-start">
      <Box color="muted" w={120}>
        {label}
      </Box>
      <MonoText
        textAlign="right"
        wordBreak="break-word"
        whiteSpace="normal"
        {...rest}
      >
        {value}
      </MonoText>
    </HStack>
  );
};

export default IssueDetails;
