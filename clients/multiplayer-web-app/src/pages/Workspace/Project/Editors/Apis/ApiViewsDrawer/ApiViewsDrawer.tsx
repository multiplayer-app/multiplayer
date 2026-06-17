import { Flex, Box, Button } from "@chakra-ui/react";

import { useApis } from "shared/providers/ApisContext";
import HorizontalCollapse from "shared/components/HorizontalCollapse";
import NoDataPage from "shared/components/NoDataPage";
import ViewItem from "./ViewItem";
import { ViewModes } from "../Apis.types";
import NoDataImg from "assets/images/emptyStates/no-data.png";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

interface ApiViewsDrawerProps {}

const ApiViewsDrawer = (props: ApiViewsDrawerProps) => {
  const {
    readonly,
    showCustomViews,
    currentView,
    viewMode,
    systemViews,
    customViews,
    onViewChange,
    onViewCreate,
    viewsDisclosure,
  } = useApis();
  const { withSandboxCheck } = useProjectSandbox();
  const cViews = Object.values(customViews);

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
          {systemViews.map((view) => (
            <ViewItem
              view={view}
              key={view.id}
              readonly={readonly}
              isActive={currentView === view.id}
              onClick={() => onViewChange(view.id)}
            />
          ))}

          {showCustomViews && (
            <>
              <Box
                mt="6"
                mb="4"
                fontSize="12px"
                color="muted"
                fontWeight="medium"
              >
                CUSTOM VIEWS
              </Box>
              {cViews?.length ? (
                cViews.map((view) => (
                  <ViewItem
                    view={view}
                    key={view.id}
                    isActive={currentView === view.id}
                    onClick={() => onViewChange(view.id)}
                    readonly={readonly}
                  />
                ))
              ) : (
                <NoDataPage
                  imageSrc={NoDataImg}
                  message="To create a view of this session, select data and hit Create a view button below."
                  props={{ px: 0 }}
                />
              )}
            </>
          )}
        </Box>
        {!readonly && showCustomViews && (
          <Button
            m="4"
            variant="light"
            onClick={withSandboxCheck(onViewCreate)}
            isDisabled={viewMode === ViewModes.SOURCE}
          >
            Create a view
          </Button>
        )}
      </Flex>
    </HorizontalCollapse>
  );
};

export default ApiViewsDrawer;
