import { useMemo } from "react";
import { Box, Button, Flex, IconButton, keyframes } from "@chakra-ui/react";
import { sortAlphabetically } from "shared/helpers/general.helpers";
import {
  useDiagramActions,
  useDiagramState,
} from "shared/providers/DiagramContext";
import useMessage from "shared/hooks/useMessage";
import NoDataPage from "shared/components/NoDataPage";
import { CloseIcon } from "shared/icons";
import ViewListItem from "./ViewListItem";
import { UsePlatformDiagramReturn } from "shared/components/Editors/PixiDiagram/Editor/Platform/usePlatformDiagram";
import { SystemViewTypes } from "shared/models/enums";
import NoDataImg from "assets/images/emptyStates/no-data.png";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

const ViewsDrawer = ({
  readonly,
  editor,
  onClose,
  renamingView,
}: {
  readonly: boolean;
  editor: UsePlatformDiagramReturn;
  onClose: () => void;
  renamingView: string;
}) => {
  const message = useMessage();
  const actions = useDiagramActions();
  const { isSandbox, withSandboxCheck } = useProjectSandbox();
  const { selectedNodes, selectedGroups, currentViewId, views } =
    useDiagramState();

  const createView = () => {
    if (!selectedNodes.size && !selectedGroups.size) {
      message.handleError({
        message:
          " You need to select at least one component to create a new view.",
      });
      return;
    } else {
      actions.onViewCreate();
      return;
    }
  };

  const deleteView = (id) => {
    if (editor.instance?.currentViewId === id) {
      editor.instance.setCurrentViewId(SystemViewTypes.ALL);
    }
    actions.onViewDelete(id);
  };

  const customViews = useMemo(() => {
    return views && Object.keys(views)?.length
      ? Object.keys(views).filter((v) => !v.startsWith("_"))
      : [];
  }, [views]);

  return (
    <Flex
      width="0"
      minWidth="0"
      overflow="hidden"
      animation={animation}
      borderRight="1px solid"
      borderRightColor="border.primary"
    >
      <Flex
        h="100%"
        minW="256px"
        p="12px 16px"
        flexDirection="column"
        justifyContent="space-between"
      >
        <Flex flexDirection="column">
          <Flex
            flex="1"
            fontSize="16px"
            fontWeight="medium"
            justifyContent="space-between"
          >
            All Views
            <IconButton
              size="xs"
              variant="base"
              color="muted"
              cursor="pointer"
              aria-label="close"
              icon={<CloseIcon />}
              onClick={onClose}
            />
          </Flex>
          <Box
            flex="1"
            fontSize="12px"
            color="muted"
            fontWeight="600"
            p="24px 0 0"
          >
            SYSTEM VIEWS
          </Box>
          <Box mt="16px">
            {views &&
              Object.keys(views).map((v) => {
                if (v.startsWith("_")) {
                  return (
                    <ViewListItem
                      key={v}
                      view={views[v]}
                      isRenaming={renamingView === v}
                      isSystemView={true}
                      readonly={readonly}
                      selected={currentViewId === v}
                      onDelete={deleteView}
                      onClick={actions.onViewSelect}
                      onSetDefault={actions.onViewSetDefault}
                      onViewCreate={actions.onViewCreate}
                    ></ViewListItem>
                  );
                }
                return null;
              })}
          </Box>
          <Box
            flex="1"
            fontSize="12px"
            color="muted"
            fontWeight="600"
            p="24px 0 0"
          >
            CUSTOM VIEWS
          </Box>
          <Box mt="16px">
            {customViews?.length ? (
              customViews
                .sort((a, b) => {
                  return sortAlphabetically(
                    views[a].name.toLowerCase(),
                    views[b].name.toLowerCase()
                  );
                })
                .map((v) => {
                  return (
                    <ViewListItem
                      key={v}
                      view={views[v]}
                      readonly={readonly}
                      isRenaming={renamingView === v}
                      isSystemView={false}
                      selected={currentViewId === v}
                      onDelete={deleteView}
                      onClick={() => {
                        actions.onViewSelect(v);
                      }}
                      onRename={actions.onViewRename}
                      onViewCreate={actions.onViewCreate}
                      onSetDefault={actions.onViewSetDefault}
                    />
                  );
                })
            ) : (
              <NoDataPage
                imageSrc={NoDataImg}
                message="To create a view of this session, select data and hit Create a view button below."
                props={{ px: 0 }}
              />
            )}
          </Box>
        </Flex>
        {(!readonly || isSandbox) && (
          <Button variant="light" onClick={withSandboxCheck(createView)}>
            Create a view
          </Button>
        )}
      </Flex>
    </Flex>
  );
};

export default ViewsDrawer;

const slideInAnimation = keyframes`
  0% { width: 0; min-width: 0;}
  100% { width: 256px; min-width: 256px; }
`;

const animation = `${slideInAnimation} 0.2s ease-in 0s 1 normal forwards`;
