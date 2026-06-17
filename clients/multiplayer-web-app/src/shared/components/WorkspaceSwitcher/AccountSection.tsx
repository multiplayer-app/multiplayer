import { useCallback, useId } from "react";
import { Box, Button, Collapse, Icon, Stack, Text } from "@chakra-ui/react";
import { IUserSession } from "@multiplayer/types";

import { ChevronRightIcon } from "shared/icons";
import { WorkspaceRow } from "./WorkspaceRow";

export type AccountSectionProps = {
  session: IUserSession;
  isExpanded: boolean;
  onToggleSession: (sessionId: string) => void;
};

export function AccountSection({
  session,
  isExpanded,
  onToggleSession,
}: AccountSectionProps) {
  const baseId = useId();
  const regionId = `${baseId}-workspaces`;
  const handleToggle = useCallback(() => {
    onToggleSession(session._id);
  }, [onToggleSession, session._id]);

  const { workspaces } = session;

  return (
    <Box>
      <Button
        type="button"
        variant="base"
        w="100%"
        h="auto"
        py="1"
        px="2"
        justifyContent="space-between"
        gap="2"
        fontWeight="normal"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls={regionId}
        rightIcon={
          <Icon
            as={ChevronRightIcon}
            color="muted"
            boxSize="3.5"
            flexShrink={0}
            transition="transform 0.2s ease"
            transform={isExpanded ? "rotate(90deg)" : undefined}
            aria-hidden
          />
        }
      >
        <Text
          as="span"
          fontSize="sm"
          color="muted"
          noOfLines={1}
          textAlign="left"
          flex="1"
          minW="0"
        >
          {session.primaryEmail}
        </Text>
      </Button>
      <Collapse in={isExpanded} unmountOnExit>
        <Stack
          id={regionId}
          role="region"
          aria-label="Workspaces for this account"
          spacing="2"
          mt="2"
          pl="0.5"
        >
          {workspaces.length ? (
            workspaces.map((ws, index) => (
              <WorkspaceRow
                key={`${session._id}:${ws._id}:${index}`}
                session={session}
                workspace={ws}
              />
            ))
          ) : (
            <Text color="muted" fontSize="xs" p="2">
              There is no workspace here!
            </Text>
          )}
        </Stack>
      </Collapse>
    </Box>
  );
}
