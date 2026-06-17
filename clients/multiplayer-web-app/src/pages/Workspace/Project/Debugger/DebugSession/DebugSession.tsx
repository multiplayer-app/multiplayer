import { useMemo, memo } from "react";
import { Grid } from "@chakra-ui/react";
import {
  RoleType,
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from "@multiplayer/types";
import {
  FullScreenProvider,
  FullScreenContentContainer,
} from "shared/providers/FullScreenContext";

import { ResizeHandle } from "./Resizer";
import SessionViewsDrawer from "./SessionViewsDrawer";
import DebugSessionToolbar from "./DebugSessionToolbar";
import DebugSessionDetails from "./DebugSessionDetails";
import DebugSessionSystemMap from "./DebugSessionSystemMap";
import DebugSessionRecording from "./DebugSessionRecording";
import DebugSessionNodeDrawer from "./DebugSessionNodeDrawer";
import DebugSessionNotesDrawer from "./DebugSessionNotesDrawer";

import { SessionPreviewMode } from "./types";

import {
  DebugSessionLayoutProvider,
  useDebugSessionLayout,
} from "./DebugSessionLayoutContext";
import { DebugSessionNotesProvider } from "./DebugSessionNotesContext";
import { DebugSessionProvider, useDebugSession } from "./DebugSessionContext";

import { WidthAccessCheck } from "shared/components/CheckAccess";
import Visibility from "shared/components/Visibility";

const DebugSession = ({
  sessionId,
  isPreviewMode = false,
}: {
  sessionId: string;
  isPreviewMode?: boolean;
}) => {
  return (
    <FullScreenProvider direction="column" flex="1" minH="0">
      <DebugSessionProvider sessionId={sessionId} isPreviewMode={isPreviewMode}>
        <DebugSessionLayoutProvider isPreviewMode={isPreviewMode}>
          <DebugSessionNotesProvider sessionId={sessionId}>
            <DebugSessionContent />
          </DebugSessionNotesProvider>
        </DebugSessionLayoutProvider>
      </DebugSessionProvider>
    </FullScreenProvider>
  );
};

const DebugSessionContent = () => {
  const { nodeDetailsDrawerDisclosure, isPreviewMode } = useDebugSession();
  const { resizerWrapper, configs } = useDebugSessionLayout();
  return (
    <>
      {!isPreviewMode && <DebugSessionToolbar />}
      <FullScreenContentContainer
        flex="1"
        minH="0"
        minW="0"
        position="relative"
      >
        {!isPreviewMode && (
          <Visibility hideBelow="md">
            <SessionViewsDrawer />
          </Visibility>
        )}
        <Grid p="4" minH="0" flex="1" overflow="hidden" ref={resizerWrapper}>
          <DebugSessionVisualization />
          {configs.showTraces && (
            <DebugSessionDetails readonly={isPreviewMode} />
          )}
        </Grid>
        {!isPreviewMode && (
          <>
            <WidthAccessCheck
              as={DebugSessionNotesDrawer}
              scope={RoleType.PROJECT}
              permission={RoleAccessAction.READ}
              entity={RoleProjectPermissionEntity.SESSION_NOTES}
            />
          </>
        )}
        {nodeDetailsDrawerDisclosure.isOpen && <DebugSessionNodeDrawer />}
      </FullScreenContentContainer>
    </>
  );
};

const DebugSessionVisualization = memo(() => {
  const { configs } = useDebugSessionLayout();
  const { eventsLoading, events } = useDebugSession();
  const hasRecordingData = eventsLoading || (events?.length ?? 0) > 0;

  const visualization = useMemo(() => {
    switch (configs.sessionPreviewMode) {
      case SessionPreviewMode.Recording:
        if (!hasRecordingData) return <DebugSessionSystemMap />;
        return <DebugSessionRecording />;
      case SessionPreviewMode.Map:
        return <DebugSessionSystemMap />;
      default:
        return null;
    }
  }, [configs.sessionPreviewMode, hasRecordingData]);

  if (!visualization) {
    return null;
  }

  return (
    <>
      {visualization}
      {configs.showTraces && <ResizeHandle />}
    </>
  );
});

export default DebugSession;
