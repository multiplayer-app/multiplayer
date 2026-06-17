import { useParams } from "react-router-dom";
import {
  Box,
  Tab,
  Flex,
  Tabs,
  Text,
  Icon,
  Input,
  Button,
  TabList,
  TabPanel,
  TabPanels,
  FormLabel,
  FormControl,
} from "@chakra-ui/react";

import {
  SortOrder,
  ThreadCreatePayload,
  CommentCreatePayload,
} from "@multiplayer/types";
import { extractKeyValue } from "@multiplayer/util-shared";

import { useFlow } from "../FlowContext";
import { InfoCircleIcon } from "shared/icons";
import Threads from "shared/components/Threads";
import TagInput from "shared/components/TagInput";
import { useFlows } from "shared/providers/FlowsContext";
import { useThreads } from "shared/providers/ThreadsContext";
import ThreadForm from "shared/components/Thread/ThreadForm";
import ThreadActionsRow from "shared/components/Thread/ThreadActionsRow";

import Drawer, { DrawerContent } from "shared/components/Drawer/Drawer";
import { ProjectSourceType } from "shared/models/enums";
import { useProject } from "shared/providers/ProjectContext";

const FlowPropertiesDrawer = () => {
  const { emitUpdate } = useProject();
  const { path: flowId } = useParams();
  const { onUpdate, onDelete } = useFlows();
  const { threads, createThread, params } = useThreads();
  const { metadata, setMetadata, flowPropertiesDrawerDisclosure } = useFlow();

  const onTagsChanged = async (tags: string[]) => {
    const res = await onUpdate(flowId, {
      tags: tags.map((t) => {
        return typeof t === "string" ? extractKeyValue(t) : t;
      }),
    });
    if (res) {
      setMetadata(res);
    }
  };

  const onNameChanged = async (e) => {
    const newName = e.target.value.trim();
    if (!!newName && newName !== metadata.name) {
      const res = await onUpdate(flowId, { name: newName });
      if (res) {
        setMetadata(res);
        emitUpdate(ProjectSourceType.FLOWS, flowId, res);
      }
    }
  };

  const handleDelete = async () => {
    await onDelete(flowId);
    flowPropertiesDrawerDisclosure.onClose();
  };

  const onCreate = async (
    data: Partial<ThreadCreatePayload> | CommentCreatePayload
  ) => {
    await createThread(data);
    if (params.sortOrder === SortOrder.ASC) {
      setTimeout(() => {
        const threadItems = document.getElementsByClassName("thread-item");
        if (threadItems?.length) {
          threadItems[threadItems.length - 1].scrollIntoView();
        }
      });
    }
  };

  return (
    <Drawer isOpen={!!flowId}>
      <DrawerContent
        height="auto"
        onClose={flowPropertiesDrawerDisclosure.onClose}
      >
        <Flex direction="column" flex="1" minH="0">
          <Flex
            px="4"
            py="2"
            gap="4"
            minH="14"
            alignItems="center"
            justifyContent="space-between"
            position="sticky"
            top="0"
          >
            <Text flex="1" fontSize="lg" fontWeight="medium">
              Flow information
            </Text>
          </Flex>
          <Flex as={Tabs} isLazy direction="column" w="100%" flex="1" minH="0">
            <TabList>
              <Tab key="about" pb="2">
                About
              </Tab>
              <Tab key="comments">
                Comments
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
                  {threads.totalComments}
                </Flex>
              </Tab>
            </TabList>
            <TabPanels flex="1" minH="0" overflow="auto">
              <TabPanel key="about" p="0" h="full" as={Flex} direction="column">
                <Box flex="1" p="4" overflow="auto">
                  <Flex gap="4" direction="column" mb="6">
                    <Flex color="muted">
                      <Icon
                        as={InfoCircleIcon}
                        mr="4px"
                        color="brand.500"
                      ></Icon>
                      <Box fontWeight="500" color="brand.500">
                        Information
                      </Box>
                    </Flex>
                    <FormControl>
                      <FormLabel>Flow name</FormLabel>
                      <Input
                        placeholder="Enter a flow name..."
                        defaultValue={metadata.name}
                        onBlur={onNameChanged}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Tags</FormLabel>
                      <TagInput
                        autoFocus={false}
                        onChange={onTagsChanged}
                        value={(metadata.tags as any) || []}
                      />
                    </FormControl>
                  </Flex>
                </Box>
                <Flex
                  p="4"
                  borderTop="1px solid"
                  borderColor="border.primary"
                  justifyContent="flex-end"
                >
                  <Button variant="danger" onClick={handleDelete}>
                    Delete flow
                  </Button>
                </Flex>
              </TabPanel>
              <TabPanel
                key="comments"
                p="0"
                h="full"
                as={Flex}
                direction="column"
              >
                <ThreadActionsRow />
                <Threads />
                <Box
                  borderTop="1px solid"
                  borderTopColor="border.primary"
                  p={4}
                >
                  <ThreadForm onSubmit={onCreate} parentId="push-drawer" />
                </Box>
              </TabPanel>
            </TabPanels>
          </Flex>
        </Flex>
      </DrawerContent>
    </Drawer>
  );
};

export default FlowPropertiesDrawer;
