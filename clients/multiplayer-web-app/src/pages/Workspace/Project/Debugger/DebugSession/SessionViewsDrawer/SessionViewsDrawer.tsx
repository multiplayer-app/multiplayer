import { Flex, Box, Button } from "@chakra-ui/react";
import HorizontalCollapse from "shared/components/HorizontalCollapse";
import { useDebugSession } from "../DebugSessionContext";
import ViewItem from "./ViewItem";
import {
  RoleType,
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from "@multiplayer/types";
import CheckAccess from "shared/components/CheckAccess";
import NoDataPage from "shared/components/NoDataPage";
import NoDataImg from "assets/images/emptyStates/no-data.png";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

interface SessionViewsDrawerProps {}

const SessionViewsDrawer = (props: SessionViewsDrawerProps) => {
  const {
    onViewCreate,
    onViewChange,
    currentView,
    customViews,
    systemViews,
    viewsDisclosure,
  } = useDebugSession();
  const { withSandboxCheck, isSandbox } = useProjectSandbox();

  return (
    <HorizontalCollapse
      width="256px"
      in={viewsDisclosure.isOpen}
      onClose={viewsDisclosure.onClose}
    >
      <Flex
        h="100%"
        minW="256px"
        borderRight="1px solid"
        flexDirection="column"
        borderRightColor="border.primary"
        justifyContent="space-between"
      >
        <Box p="4" fontSize="16px" fontWeight="medium">
          All Views
        </Box>
        <Box p="4" flex="1" overflow="auto" flexDirection="column">
          <Box mb="4" fontSize="12px" color="muted" fontWeight="medium">
            SYSTEM VIEWS
          </Box>
          {systemViews.map((v) => (
            <ViewItem
              view={v}
              key={v._id}
              isSystemView={true}
              isActive={currentView._id === v._id}
              onClick={() => onViewChange(v)}
            />
          ))}

          <Box mt="6" mb="4" fontSize="12px" color="muted" fontWeight="medium">
            CUSTOM VIEWS
          </Box>
          {customViews?.length ? (
            customViews.map((view) => (
              <ViewItem
                view={view}
                key={view._id}
                isSystemView={false}
                isActive={currentView._id === view._id}
                onClick={() => onViewChange(view)}
              />
            ))
          ) : (
            <NoDataPage
              imageSrc={NoDataImg}
              message={
                isSandbox
                  ? ""
                  : "To create a view of this session, select data and hit Create a view button below."
              }
              props={{ px: 0 }}
            />
          )}
        </Box>
        <CheckAccess
          entity={RoleProjectPermissionEntity.DEBUG_SESSION}
          permission={RoleAccessAction.UPDATE}
          scope={RoleType.PROJECT}
        >
          <Button
            m="4"
            variant="light"
            onClick={withSandboxCheck(onViewCreate)}
          >
            Create a view
          </Button>
        </CheckAccess>
      </Flex>
    </HorizontalCollapse>
  );
};

export default SessionViewsDrawer;
