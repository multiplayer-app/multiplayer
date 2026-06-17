import * as Y from "yjs";
import debounce from "lodash.debounce";
import {
  Group,
  Component,
  EntityType,
  ObjectTypeEnum,
} from "@multiplayer/types";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Tab,
  Flex,
  Text,
  Tabs,
  Input,
  Tooltip,
  TabList,
  TabPanel,
  TabPanels,
  FormLabel,
  FormControl,
} from "@chakra-ui/react";

import { EntityComponentIcon, InfoCircleIcon } from "shared/icons";
import Title from "shared/components/Title";
import ComponentIcon from "shared/components/ComponentIcon";
import ComponentColor from "shared/components/ComponentColor";
import { ThreadsProvider } from "shared/providers/ThreadsContext";
import { CommentsTabPanel, CommentsTab } from "shared/components/CommentsTab";
import TagInput from "shared/components/TagInput";
import { useEntities } from "shared/providers/EntitiesContext";
import { EntityCategories } from "shared/models/enums";
import { EntityWithMeta, ITableSorting } from "shared/models/interfaces";
import { getNodeData } from "shared/components/Editors/PixiDiagram/Editor/utils/getPlatformInstances";
import Table from "shared/components/Table";
import EntityMetaIcon from "shared/components/EntityMetaIcon";
import { getSlugifiedName, sortByName } from "shared/utils";
import SlugifiedInput from "shared/components/SlugifiedInput";
import Drawer, { DrawerContent } from "shared/components/Drawer/Drawer";

const modifiers = {
  trim: (str: string) => str.trim(),
  slugify: getSlugifiedName,
};
const requiredProps = {
  name: true,
};
let timeout;
const GroupDetailsDrawer = ({
  onClose,
  groupId,
  doc,
}: {
  onClose: () => void;
  groupId: string;
  doc: Y.Doc;
}) => {
  const { entities } = useEntities();
  const groups$ = useRef<Y.Map<Group>>(null);
  const components$ = useRef<Y.Map<Component>>(null);

  const [group, setGroup] = useState(null);
  const [components, setComponents] = useState([]);
  const [sorting, setSorting] = useState<ITableSorting | null>(null);

  useEffect(() => {
    const syncData = () => {
      const group = groups$.current.get(groupId);
      setGroup(group);
    };

    const groupsObserver = ({
      keysChanged,
      transaction,
    }: Y.YMapEvent<Group>) => {
      if (
        keysChanged.has(groupId) &&
        (!transaction.local || transaction.origin)
      ) {
        syncData();
      }
    };

    const componentsObserver = () => {
      const arr = [];
      components$.current.forEach((c) => {
        if (groupId === c.groupId) {
          arr.push(c);
        }
      });
      setComponents(arr);
    };

    if (groupId) {
      const data$ = doc.getMap("object");
      groups$.current = data$.get("groups") as Y.Map<Group>;
      components$.current = data$.get("components") as Y.Map<Component>;

      groups$.current.observe(groupsObserver);
      components$.current.observe(componentsObserver);
      syncData();
      componentsObserver();
    } else {
      setGroup(null);
    }
    return () => {
      groups$.current.unobserve(groupsObserver);
      components$.current.unobserve(componentsObserver);
    };
  }, [doc, groupId]);

  const debounceUpdate = debounce(
    (newState) => {
      groups$.current.set(groupId, newState);
    },
    200,
    { leading: false }
  );

  const handleChange = (
    key: string,
    value: any,
    modifier?: (val: string) => string
  ) => {
    clearTimeout(timeout);
    setGroup((prev) => {
      const newState = { ...prev, [key]: value };
      const modifiedState = modifier
        ? { ...newState, [key]: modifier(value) }
        : newState;
      if (!requiredProps[key] || modifiedState[key]) {
        debounceUpdate(modifiedState);
      }
      return newState;
    });
    if (modifier) {
      timeout = setTimeout(() => {
        setGroup((prev) => ({ ...prev, [key]: modifier(value) }));
      }, 1000);
    }
  };

  const platformComponents = useMemo(() => {
    return new Map<string, EntityWithMeta>(
      entities[EntityCategories.COMPONENT].map((e) => [e.entityId, e])
    );
  }, [entities]);

  const componentsWithMeta = useMemo(() => {
    const data = components.reduce((acc, component) => {
      const entity = platformComponents.get(component.linkedTo);
      if (!entity) return acc;
      acc.push(getNodeData({ component, entity }));
      return acc;
    }, []);
    if (sorting) {
      sortByName(data, sorting.direction);
    }
    return data;
  }, [platformComponents, components, sorting]);

  if (!group) return null;

  return (
    <Drawer isOpen={!!groupId}>
      <DrawerContent height="auto" onClose={onClose}>
        <ThreadsProvider
          objectId={groupId}
          objectType={ObjectTypeEnum.PLATFORM_GROUP}
        >
          <Tabs flex="1" display="flex" flexDirection="column" minH="0" isLazy>
            <Box p="4" pb="0">
              <Flex alignItems="center" mb="8" gap="4">
                <ComponentIcon
                  type="group"
                  boxSize="64px"
                  iconUrl={group.iconUrl}
                  onIconChange={(iconUrl) => handleChange("iconUrl", iconUrl)}
                />
                <Text
                  mr="8px"
                  fontSize="lg"
                  alignItems="center"
                  fontWeight="semibold"
                >
                  {modifiers.slugify(group.name) ||
                    groups$.current.get(groupId)?.name}
                </Text>
              </Flex>

              <TabList>
                <Tab>Information</Tab>
                <CommentsTab />
              </TabList>
            </Box>
            <TabPanels
              flex="1"
              minH="0"
              display="flex"
              overflow="auto"
              flexDirection="column"
            >
              <TabPanel>
                <Title icon={InfoCircleIcon}>Information</Title>
                <Flex direction="column" gap="4" mb="10">
                  <FormControl>
                    <FormLabel>Name</FormLabel>
                    <SlugifiedInput
                      maxLength={60}
                      value={group.name || ""}
                      onChange={(newName) => {
                        handleChange("name", newName);
                      }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Short description</FormLabel>
                    <Input
                      value={group.shortDescription || ""}
                      placeholder="Enter short description..."
                      onChange={(e) => {
                        handleChange(
                          "shortDescription",
                          e.target.value,
                          modifiers.trim
                        );
                      }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Color</FormLabel>
                    <ComponentColor
                      value={group.color}
                      onChange={(color) => handleChange("color", color)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Tags</FormLabel>
                    <TagInput
                      autoFocus={false}
                      onChange={(tags) => handleChange("tags", tags)}
                      value={group.tags || []}
                    />
                  </FormControl>
                </Flex>
                <Title icon={EntityComponentIcon}>Components</Title>

                <Table
                  columns={[
                    {
                      name: "Name",
                      field: "name",
                      sortable: true,
                      component: ComponentRowItem,
                    },
                  ]}
                  sorting={sorting}
                  showNoData={false}
                  setSorting={setSorting}
                  tableWrapperHeight={"auto"}
                  data={componentsWithMeta}
                />
              </TabPanel>
              <CommentsTabPanel />
            </TabPanels>
          </Tabs>
        </ThreadsProvider>
      </DrawerContent>
    </Drawer>
  );
};

const ComponentRowItem = ({ name, id, data }) => {
  return (
    <Flex
      mr="-2"
      flex="1"
      key={id}
      alignItems="center"
      justifyContent="space-between"
    >
      <Flex gap="2">
        <EntityMetaIcon metadata={data} type={EntityType.PLATFORM_COMPONENT} />
        <Tooltip maxW="400px" label={name} openDelay={800}>
          <Text
            flex="1"
            maxW="330px"
            overflow="hidden"
            whiteSpace="nowrap"
            textOverflow="ellipsis"
          >
            {name}
          </Text>
        </Tooltip>
      </Flex>
    </Flex>
  );
};

export default GroupDetailsDrawer;
