import { useEffect, useState } from "react";
import {
  Link as RouterLink,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Button,
  Flex,
  Heading,
  Link,
  Spinner,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";
import { ITraceResolution } from "@multiplayer/types";

import { ProjectSourceType } from "shared/models/enums";
import { buildProjectBasePath } from "shared/navigation/defaultProjectPath";
import {
  FOCUS_SPAN_PARAM,
  FOCUS_TRACE_PARAM,
} from "shared/navigation/traceFocus";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import { resolveTrace } from "shared/services/radar.service";

const TRACE_ID_PATTERN = /^[0-9a-f]{32}$/i;

type ResolvedSession = ITraceResolution["sessions"][number];
type ResolvedIssue = ITraceResolution["issues"][number];

const getSessionPath = (
  basePath: string,
  session: ResolvedSession,
  traceId: string,
  spanId?: string
) => {
  const params = new URLSearchParams({ [FOCUS_TRACE_PARAM]: traceId });
  const focusSpanId = spanId || session.spanIds[0];
  if (focusSpanId) params.set(FOCUS_SPAN_PARAM, focusSpanId);

  return `${basePath}/${ProjectSourceType.DEBUGGER}/session/${session._id}?${params}`;
};

const getIssuePath = (basePath: string, issue: ResolvedIssue) =>
  `${basePath}/${ProjectSourceType.ISSUES}/issue/${
    issue.titleHash
  }?componentHash=${encodeURIComponent(issue.componentHash)}`;

const formatDate = (date?: string | Date) =>
  date ? new Date(date).toLocaleString() : "";

// The landing page of links that name a trace id - e.g. from Grafana: opens the session the trace
// is known to be in, or its issue, and lets the user choose when the trace is in several places or
// only may be in a session.
const TraceRedirect = () => {
  const { workspaceId, projectId, branchId, traceId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const spanId = searchParams.get(FOCUS_SPAN_PARAM) || undefined;
  const { isPublic } = useWorkspace();
  const navigate = useNavigate();
  const [resolution, setResolution] = useState<ITraceResolution | null>(null);
  const [failed, setFailed] = useState(false);

  const isTraceId = TRACE_ID_PATTERN.test(traceId);
  const basePath = buildProjectBasePath(
    workspaceId,
    projectId,
    branchId,
    isPublic
  );

  useEffect(() => {
    if (!isTraceId) return;
    let cancelled = false;
    // Another trace's result must not show while this one is looked up
    setResolution(null);
    setFailed(false);

    resolveTrace(workspaceId, projectId, traceId)
      .then((res) => {
        if (cancelled) return;
        // One place to go: go there. A session also shows its issues.
        const certainSessions = res.sessions.filter(({ certain }) => certain);
        if (certainSessions.length === 1) {
          navigate(
            getSessionPath(basePath, certainSessions[0], res.traceId, spanId),
            { replace: true }
          );
        } else if (!res.sessions.length && res.issues.length === 1) {
          navigate(getIssuePath(basePath, res.issues[0]), { replace: true });
        } else {
          setResolution(res);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceId, projectId, traceId, spanId, basePath, isTraceId, navigate]);

  if (isTraceId && !resolution && !failed) {
    return (
      <Flex m="auto" direction="column" alignItems="center" gap="3">
        <Spinner />
        <Text color="muted">Looking up trace {traceId}...</Text>
      </Flex>
    );
  }

  const found = !!resolution?.sessions.length || !!resolution?.issues.length;

  return (
    <Flex m="auto" direction="column" maxW="640px" w="full" p="6" gap="6">
      <Stack gap="2">
        <Heading size="md">
          {found ? "Choose where to open this trace" : "Trace not found"}
        </Heading>
        <Text color="muted" fontFamily="mono" fontSize="sm">
          {traceId}
        </Text>
        {!isTraceId && (
          <Text>A trace id is 32 hexadecimal characters.</Text>
        )}
        {failed && <Text>The trace could not be looked up. Try again later.</Text>}
        {isTraceId && resolution && !found && (
          <Text>
            This project has no session or issue with this trace. Multiplayer
            keeps the traces of recorded sessions and the traces that failed;
            other traces are not stored.
          </Text>
        )}
      </Stack>

      {!!resolution?.sessions.length && (
        <Stack gap="2">
          <Text fontWeight="medium">Sessions</Text>
          {resolution.sessions.map((session) => (
            <Link
              key={session._id}
              as={RouterLink}
              to={getSessionPath(basePath, session, resolution.traceId, spanId)}
            >
              <Flex gap="2" alignItems="center">
                <Text>{session.name || `Session ${session._id}`}</Text>
                <Text color="muted" fontSize="sm">
                  {formatDate(session.startedAt || session.createdAt)}
                </Text>
                {!!session.spanIds.length && (
                  <Tag size="sm" colorScheme="red">
                    {session.spanIds.length === 1
                      ? "1 error span"
                      : `${session.spanIds.length} error spans`}
                  </Tag>
                )}
                {!session.certain && (
                  <Tag size="sm">May contain this trace</Tag>
                )}
              </Flex>
            </Link>
          ))}
        </Stack>
      )}

      {!!resolution?.issues.length && (
        <Stack gap="2">
          <Text fontWeight="medium">Issues</Text>
          {resolution.issues.map((issue) => (
            <Link
              key={issue.hash}
              as={RouterLink}
              to={getIssuePath(basePath, issue)}
            >
              <Flex gap="2" alignItems="center">
                <Text>{issue.title}</Text>
                {issue.resolved && <Tag size="sm">Resolved</Tag>}
              </Flex>
            </Link>
          ))}
        </Stack>
      )}

      {!found && (
        <Button
          as={RouterLink}
          to={`${basePath}/${ProjectSourceType.ISSUES}`}
          alignSelf="flex-start"
          size="sm"
        >
          Go to issues
        </Button>
      )}
    </Flex>
  );
};

export default TraceRedirect;
