import {
  Box,
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import { EntityType } from "@multiplayer/types";
import EntityIcon from "shared/components/EntityIcon";
import VariableGroupTreePanel from "shared/components/VariableGroupTreePanel";
import NotebookVariables from "shared/components/Editors/VariablesGroupEditor/NotebookVariables";
import usePresenceState from "shared/hooks/usePresenceState";

const VariablesGroupEditor = ({
  entityName,
  provider,
  clients,
  groupData,
  readonly,
}: {
  entityName: string;
  provider: any;
  clients: any;
  groupData: any;
  readonly?: boolean;
}) => {
  const {
    groups,
    setGroup,
    yVariables,
    changesDiff,
    onNameUpdate,
    selectedGroup,
    onVariableChange,
    onOpenVariablesGroup,
  } = groupData;

  const variables = yVariables?.toJSON() || {};
  const { getPresentUsers } = usePresenceState(clients);
  const setFocusedElement = (formControlName: string | null) => {
    provider?.awareness.setLocalStateField("focusedElement", formControlName);
  };

  return (
    <>
      <Box m={3} mt="32px" height="calc(100% - 44px)">
        <VariableGroupTreePanel
          data={groups}
          readonly={readonly}
          onChange={setGroup}
          onNameUpdate={onNameUpdate}
          selectedGroup={selectedGroup}
          onOpen={onOpenVariablesGroup}
        />
      </Box>
      <Flex
        p="3"
        pt="32px"
        w="full"
        flex="1"
        overflow="auto"
        gap={9}
        alignItems="flex-start"
      >
        <Box w="full" mx="auto" maxW="848px">
          <Flex alignItems="center" mb="8" gap="4">
            <EntityIcon
              name={EntityType.VARIABLE_GROUP}
              boxSize="100px"
              bg="bg.subtle"
              borderRadius="2xl"
              p={6}
              alignItems="center"
              justifyContent="center"
            />
            <Flex direction="column">
              <Flex fontSize="lg" fontWeight="semibold" alignItems="center">
                <Box mr="8px">{selectedGroup?.name || entityName}</Box>
              </Flex>
              <Box color="muted" fontSize="sm" fontWeight="500">
                Notebook Variables
              </Box>
            </Flex>
          </Flex>
          <Tabs>
            <TabList>
              <Tab>
                Variables{" "}
                <Flex
                  px="1"
                  ml="2"
                  fontSize="xs"
                  bg="bg.subtle"
                  color="muted"
                  border="1px solid"
                  borderRadius="base"
                  borderColor="blackAlpha.100"
                >
                  {yVariables?.size + "" || "0"}
                </Flex>
              </Tab>
              {/* <Tab>Secrets</Tab>*/}
            </TabList>
            <TabPanels
              flex="1"
              minH="0"
              display="flex"
              overflow="auto"
              flexDirection="column"
              px="1px"
            >
              <TabPanel
                flex="1"
                minH="0"
                display="flex"
                flexDirection="column"
                p="0"
              >
                <NotebookVariables
                  readonly={readonly}
                  variables={variables}
                  changesDiff={changesDiff?.variables}
                  setFocusedElement={setFocusedElement}
                  getPresentUsers={getPresentUsers}
                  onChange={onVariableChange}
                  selectedGroup={selectedGroup}
                />
              </TabPanel>
              <TabPanel
                flex="1"
                minH="0"
                display="flex"
                flexDirection="column"
                p="0"
              >
                Secrets
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Flex>
    </>
  );
};

export default VariablesGroupEditor;
