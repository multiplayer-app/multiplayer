import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Flex,
  Text,
  MenuDivider,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { VisualizationType } from "@multiplayer/types";
import { SystemViewTypes } from "shared/models/enums";
import { useDiagramActions } from "shared/providers/DiagramContext";
import { DiagramViewIcon, TableViewIcon } from "shared/icons";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";

interface ViewTypeMenuProps {
  disabled: boolean;
  currentViewId: string;
  currentViewName: string;
  visualizationType: VisualizationType;
  onVisualizationTypeSelect: (visualizationType: VisualizationType) => void;
  onViewRename: () => void;
}

const VisualizationTypeMenu = ({
  disabled,
  visualizationType,
  onVisualizationTypeSelect,
  currentViewName,
  currentViewId,
  onViewRename,
}: ViewTypeMenuProps) => {
  const { onViewDelete, onViewCreate } = useDiagramActions();
  const { withSandboxCheck } = useProjectSandbox();
  return (
    <Menu>
      <MenuButton
        px="2"
        as={Button}
        variant="ghost"
        isDisabled={disabled}
        rightIcon={<ChevronDownIcon />}
        leftIcon={
          visualizationType === VisualizationType.DIAGRAM ? (
            <DiagramViewIcon color="#0091FF" height="16px" />
          ) : (
            <TableViewIcon color="#0091FF" height="16px" />
          )
        }
      >
        {currentViewName}
      </MenuButton>
      <MenuList w="330px" zIndex="5">
        <Flex borderRadius="8px" bg="bg.subtle" w="100%" gap="1" mb="1" p="2">
          <MenuItem
            as={Button}
            py="3"
            px="6"
            gap="2"
            flex="1"
            height="auto"
            variant="ghost"
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            transition="background .2s cubic-bezier(.87, 0, .13, 1)"
            fontWeight={
              visualizationType === VisualizationType.DIAGRAM ? "600" : "400"
            }
            backgroundColor={
              visualizationType === VisualizationType.DIAGRAM
                ? "bg.primary"
                : "transparent"
            }
            icon={
              <DiagramViewIcon
                height="20px"
                color={
                  visualizationType === VisualizationType.DIAGRAM
                    ? "#0091FF"
                    : "muted"
                }
              />
            }
            _hover={{ bg: "bg.primary" }}
            onClick={() => {
              onVisualizationTypeSelect(VisualizationType.DIAGRAM);
            }}
          >
            Diagram View
          </MenuItem>

          <MenuItem
            as={Button}
            py="3"
            px="6"
            gap="2"
            flex="1"
            height="auto"
            variant="ghost"
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            transition="background .2s cubic-bezier(.87, 0, .13, 1)"
            fontWeight={
              visualizationType === VisualizationType.TABLE ? "600" : "400"
            }
            icon={
              <TableViewIcon
                height="20px"
                color={
                  visualizationType === VisualizationType.TABLE
                    ? "#0091FF"
                    : "muted"
                }
              />
            }
            backgroundColor={
              visualizationType === VisualizationType.TABLE
                ? "bg.primary"
                : "transparent"
            }
            _hover={{ bg: "bg.primary" }}
            onClick={() => {
              onVisualizationTypeSelect(VisualizationType.TABLE);
            }}
          >
            Table View
          </MenuItem>
        </Flex>

        <MenuItem
          onClick={() => {
            withSandboxCheck(() => onViewCreate(true))();
          }}
        >
          Duplicate view
        </MenuItem>
        <MenuItem
          onClick={onViewRename}
          isDisabled={currentViewId === SystemViewTypes.ALL}
        >
          Rename view
        </MenuItem>
        <MenuDivider />
        <MenuItem
          isDisabled={currentViewId === SystemViewTypes.ALL}
          onClick={() => {
            onViewDelete(currentViewId);
          }}
        >
          <Text color="red.700">Delete this view</Text>
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default VisualizationTypeMenu;
