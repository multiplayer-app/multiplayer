import { useCallback, useMemo, useState } from "react";
import { ChevronLeftIcon, HamburgerIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Spinner } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import {
  HideTraces,
  ShowTraces,
  RowViewIcon,
  CameraOnIcon,
  SystemMapIcon,
  EyeOutlineOffIcon,
  CopilotIcon,
} from "shared/icons";
import CheckAccess, { WidthAccessCheck } from "shared/components/CheckAccess";
import SwitchButtons from "shared/components/SwitchButtons";
import Icon from "shared/components/Icon";
import Toolbar, { ToolbarButton } from "shared/components/Toolbar";
import FullScreenToggleButton from "shared/components/FullScreenToggleButton";
import {
  RoleType,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  FeatureFlag,
} from "@multiplayer/types";
import { SessionPreviewMode } from "../types";
import { useDebugSession } from "../DebugSessionContext";

import { useVsCode, IS_VSCODE } from "vscode/VsCodeContext";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";
import { useDebugSessionLayout } from "../DebugSessionLayoutContext";
import { useDebugSessionNotes } from "../DebugSessionNotesContext";

import FixWithAIAssistantButton from "../FixWithAIAssistantButton";
import Visibility from "shared/components/Visibility";
import CheckFeature from "shared/components/CheckFeature";
import {
  AddToChatButton,
  buildSessionContext,
  usePanelChatOpen,
} from "shared/components/AgentChat";

const DebugSessionToolbar = () => {
  const { workspaceId, projectId } = useParams();
  const {
    session,
    currentView,
    viewsDisclosure,
    notesDrawerDisclosure,
    generateNotebookFromSession,
    eventsLoading,
    events,
  } = useDebugSession();
  const hasRecordingData = eventsLoading || (events?.length ?? 0) > 0;
  const { isSandbox } = useProjectSandbox();
  const { configs, setConfigs } = useDebugSessionLayout();
  const [isGeneratingNotebook, setIsGeneratingNotebook] = useState(false);
  const isAgentChatOpen = usePanelChatOpen();

  const getSessionContext = useCallback(() => {
    if (!session?._id) return undefined;

    return buildSessionContext({
      sessionId: session._id,
      name: session.name,
      workspaceId,
      projectId,
    });
  }, [projectId, session?._id, session?.name, workspaceId]);

  const generateNotebook = async () => {
    setIsGeneratingNotebook(true);
    try {
      await generateNotebookFromSession();
    } finally {
      setIsGeneratingNotebook(false);
    }
  };

  return (
    <Toolbar
      width="100%"
      leftContent={
        <Visibility hideBelow="md">
          {IS_VSCODE && <NavigateToSessionsButton />}
          <Button
            size="sm"
            variant="light"
            borderRadius="20px"
            onClick={viewsDisclosure.onToggle}
            leftIcon={<Icon as={HamburgerIcon} />}
          >
            Views
          </Button>
          <Flex ml="8px" alignItems="center">
            {currentView?.name || "All"}
          </Flex>
        </Visibility>
      }
      middleContent={
        isAgentChatOpen ? null : (
          <Visibility hideBelow="md">
            <FullScreenToggleButton />
            <ToolbarButton
              icon={
                <Icon
                  as={RowViewIcon}
                  color="muted"
                  transform={configs.isListView ? "rotate(0)" : "rotate(90deg)"}
                  _hover={{
                    transform: configs.isListView
                      ? "rotate(0deg)"
                      : "rotate(90deg)",
                  }}
                />
              }
              onClick={() =>
                setConfigs((prev) => {
                  return {
                    ...prev,
                    waterfall: false,
                    isListView: !prev.isListView,
                  };
                })
              }
              label={
                !configs.isListView
                  ? "Switch to Vertical Layout"
                  : "Switch to Horizontal Layout"
              }
            />
            <SessionPreviewModeToggle
              showTraces={configs.showTraces}
              hasRecordingData={hasRecordingData}
              mode={
                !hasRecordingData &&
                configs.sessionPreviewMode === SessionPreviewMode.Recording
                  ? SessionPreviewMode.Map
                  : configs.sessionPreviewMode
              }
              onChange={(value) =>
                setConfigs((prev) => ({ ...prev, sessionPreviewMode: value }))
              }
            />
            {configs.sessionPreviewMode !== SessionPreviewMode.None && (
              <ToolbarButton
                icon={
                  configs.showTraces ? (
                    <ShowTraces color="muted" />
                  ) : (
                    <HideTraces color="muted" />
                  )
                }
                onClick={() =>
                  setConfigs((prev) => ({
                    ...prev,
                    showTraces: !prev.showTraces,
                  }))
                }
                label={configs.showTraces ? "Hide Data" : "Show Data"}
              />
            )}
          </Visibility>
        )
      }
      rightContent={
        <>
          <AddToChatButton
            context={getSessionContext}
            tooltip="Attach session to chat context"
          />
          {isAgentChatOpen ? null : (
            <NotesToggle onToggle={notesDrawerDisclosure.onToggle} />
          )}

          {!IS_VSCODE ? (
            <CheckFeature feature={FeatureFlag.NOTEBOOK}>
              <WidthAccessCheck
                as={ToolbarButton}
                scope={RoleType.PROJECT}
                permission={RoleAccessAction.CREATE}
                entity={RoleProjectPermissionEntity.ENTITY}
                bypassPermissions={isSandbox}
                icon={
                  isGeneratingNotebook ? (
                    <Spinner size="sm" />
                  ) : (
                    <Icon name="FileText" />
                  )
                }
                onClick={generateNotebook}
                isDisabled={isGeneratingNotebook}
                label="Generate Notebook"
              />
            </CheckFeature>
          ) : (
            <FixWithAIAssistantButton />
          )}
        </>
      }
    />
  );
};

const NotesToggle = ({ onToggle }: { onToggle: () => void }) => {
  const { notes } = useDebugSessionNotes();

  const notesCount = useMemo(() => {
    return Object.values(notes).flat().length;
  }, [notes]);

  return (
    <CheckAccess
      scope={RoleType.PROJECT}
      permission={RoleAccessAction.READ}
      entity={RoleProjectPermissionEntity.SESSION_NOTES}
    >
      <Box position="relative">
        <ToolbarButton
          icon={<Icon as={CopilotIcon} />}
          label="Notes"
          onClick={onToggle}
        />
        {notesCount ? (
          <Box
            px="1"
            top="0"
            minW="4"
            right="1"
            zIndex="1"
            color="inverse"
            fontSize="xs"
            lineHeight="4"
            bg="brand.400"
            position="absolute"
            borderRadius="full"
            transform="translate(50%, -50%)"
          >
            {notesCount}
          </Box>
        ) : null}
      </Box>
    </CheckAccess>
  );
};

const NavigateToSessionsButton = () => {
  const { setState } = useVsCode();
  return (
    <Button
      size="sm"
      variant="light"
      borderRadius="20px"
      onClick={() => setState((prev) => ({ ...prev, sessionId: "" }))}
      leftIcon={<Icon as={ChevronLeftIcon} />}
    >
      Sessions
    </Button>
  );
};

const SessionPreviewModeToggle = ({
  mode,
  showTraces,
  hasRecordingData,
  onChange,
}: {
  mode: SessionPreviewMode;
  showTraces: boolean;
  hasRecordingData: boolean;
  onChange: (value: SessionPreviewMode) => void;
}) => {
  const options = useMemo(() => {
    return [
      hasRecordingData && {
        tooltip: "Session Recording View",
        icon: CameraOnIcon,
        value: SessionPreviewMode.Recording,
      },
      {
        tooltip: "System Map View",
        icon: SystemMapIcon,
        value: SessionPreviewMode.Map,
      },
      !!showTraces && {
        tooltip: "Hide Preview",
        icon: EyeOutlineOffIcon,
        value: SessionPreviewMode.None,
      },
    ].filter(Boolean);
  }, [showTraces, hasRecordingData]);

  return (
    <SwitchButtons
      size="md"
      hideBelow="md"
      hideLabel={true}
      options={options}
      value={mode}
      onChange={onChange}
    />
  );
};

export default DebugSessionToolbar;
