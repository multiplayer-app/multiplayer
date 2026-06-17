import { Box, Flex, Text, VStack, Icon } from "@chakra-ui/react";

import { useDebugSession } from "../DebugSessionContext";
import { useDebugSessionNotes } from "../DebugSessionNotesContext";

import { CopilotIcon } from "shared/icons";
import PushDrawer from "shared/components/PushDrawer";

import { ConnectionStatus } from "shared/models/enums";
import PageLoading from "shared/components/PageLoading";
import ErrorBoundary from "shared/components/ErrorBoundary";
import EmptyScreen from "shared/components/EmptyScreen";
import LazyContent, { lazyModule } from "shared/components/LazyContent";
import { SessionNoteBlockExtension } from "./DebugSessionNoteCard";
import { useMemo } from "react";
import { usePermissions } from "shared/providers/PermissionsContext";
import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
  RoleType,
} from "@multiplayer/types";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

const DocumentEditor = lazyModule(
  () => import("shared/components/Editors/DocumentEditor")
);

const DebugSessionNotesDrawer = () => {
  const { notesDrawerDisclosure } = useDebugSession();
  const onDrawerClose = () => {
    notesDrawerDisclosure.onClose();
  };

  if (!notesDrawerDisclosure.isOpen) return null;

  return (
    <PushDrawer minW={350} onClose={onDrawerClose}>
      <DebugSessionNotesContent />
    </PushDrawer>
  );
};

const DebugSessionNotesContent = () => {
  const { state } = useDebugSessionNotes();
  const { withSandboxCheck } = useProjectSandbox();
  const extensions = useMemo(() => [SessionNoteBlockExtension], []);
  const { hasAccess } = usePermissions();
  const readonly = useMemo(
    () =>
      !hasAccess(
        RoleProjectPermissionEntity.SESSION_NOTES,
        RoleAccessAction.UPDATE,
        RoleType.PROJECT
      ),
    [hasAccess]
  );

  return (
    <VStack spacing={0} minH="0" align="stretch">
      <Flex
        p={3}
        gap={4}
        align="center"
        borderBottom="1px"
        borderColor="border.secondary"
        justify="space-between"
      >
        <Icon boxSize={6} color="muted" as={CopilotIcon} />
        <Box flex="1">
          <Text fontWeight="medium">Notes</Text>
        </Box>
      </Flex>
      <ErrorBoundary>
        <Flex
          direction="column"
          flex="1"
          minH="0"
          onClick={readonly ? withSandboxCheck(() => {}) : undefined}
        >
          {state.status === ConnectionStatus.failed ? (
            <EmptyScreen
              title="Failed to load notes"
              description="Please try again later"
            />
          ) : state.status !== ConnectionStatus.connected ||
            !state.provider ||
            !state.doc ? (
            <PageLoading />
          ) : (
            <LazyContent
              element={
                <DocumentEditor
                  doc={state.doc}
                  readonly={readonly}
                  provider={state.provider}
                  extensions={extensions}
                />
              }
            />
          )}
        </Flex>
      </ErrorBoundary>
    </VStack>
  );
};

export default DebugSessionNotesDrawer;
