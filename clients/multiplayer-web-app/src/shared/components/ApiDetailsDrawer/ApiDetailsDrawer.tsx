import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Flex,
  Icon,
  IconButton,
  Image,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
} from "@chakra-ui/react";

import {
  ComponentType,
  ComponentTypeToNameMap,
  FeatureFlag,
  RadarDetectionEndpointType,
  RadarDetectionParamDirection,
  RadarDetectionParamSource,
} from "@multiplayer/types";

import { ClipboardCopyIcon, CloseIcon } from "shared/icons";
import useMessage from "shared/hooks/useMessage";
import NodeIcon from "shared/components/NodeIcon";
import LazyContent, { lazyModule } from "shared/components/LazyContent";
import { getAPIDetails } from "shared/services/radar.service";
import EndpointComponent from "shared/components/EndpointComponent";
import Drawer, { DrawerContent } from "shared/components/Drawer/Drawer";
import { usePermissions } from "shared/providers/PermissionsContext";

import EmptyTable from "assets/images/emptyStates/table-empty.png";
import { clone } from "shared/utils";

const JSONView = lazyModule(() => import("shared/components/JSONView"));

const APIDrawerTabs = [
  { label: "Headers", type: "header" },
  { label: "Params", type: "query" },
];
const APIDrawerPayloadTabs = [
  { label: "Request", type: "request" },
  { label: "Response", type: "response" },
];
const initialApiData = {
  header: [],
  query: [],
  request: [],
  response: [],
};

const ApiDetailsDrawer = ({
  id,
  name,
  data,
  onClose,
  containerRef,
}: {
  data: any;
  id: string;
  name: string;
  onClose: () => void;
  containerRef?: any;
}) => {
  const message = useMessage();
  const { workspaceId, projectId } = useParams();
  const { hasFeature } = usePermissions();
  const canViewPayload = hasFeature(FeatureFlag.RADAR_DETECT_ENDPOINT_PAYLOAD);
  const defaultTabIndex = canViewPayload ? 3 : 0;

  const [apiData, setApiData] = useState(initialApiData);
  const [tabIndex, setTabIndex] = useState(defaultTabIndex);

  const getApiData = useCallback(async () => {
    if (!workspaceId || !projectId || !id) return;

    try {
      const { data = [] } = await getAPIDetails(workspaceId, projectId, id);
      const result = clone(initialApiData);

      for (const item of data) {
        const { paramPath, paramType, Timestamp, paramSource, paramDirection } =
          item;
        const parsed = { paramPath, paramType, Timestamp };

        if (paramSource === RadarDetectionParamSource.HEADER) {
          result.header.push(parsed);
        } else if (paramSource === RadarDetectionParamSource.QUERY) {
          result.query.push(parsed);
        } else if (paramSource === RadarDetectionParamSource.BODY) {
          if (paramDirection === RadarDetectionParamDirection.REQUEST) {
            result.request.push(parsed);
          } else if (paramDirection === RadarDetectionParamDirection.RESPONSE) {
            result.response.push(parsed);
          }
        }
      }

      result.request.sort((a, b) => a.paramPath.localeCompare(b.paramPath));
      result.response.sort((a, b) => a.paramPath.localeCompare(b.paramPath));

      setApiData(result);
    } catch (error) {
      message.handleError(error);
    }
  }, [workspaceId, projectId, id]);

  useEffect(() => {
    getApiData();
  }, [getApiData]);

  const onApiEndpointCopy = (e) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(data?.httpEndpoint);
      message.success("Endpoint successfully copied!");
    } catch (error) {
      message.handleError({ message: "Something went wrong!" });
    }
  };
  const tabsList = useMemo(() => {
    const tabs = canViewPayload
      ? [...APIDrawerTabs, ...APIDrawerPayloadTabs]
      : APIDrawerTabs;
    return tabs.map((tab) => <Tab key={tab.type}>{tab.label}</Tab>);
  }, [canViewPayload]);

  const tabsContent = useMemo(() => {
    const tabs = canViewPayload
      ? [...APIDrawerTabs, ...APIDrawerPayloadTabs]
      : APIDrawerTabs;
    return tabs.map((tab) => (
      <TabPanel key={tab.type}>
        <DetailsTabContent data={apiData[tab.type]} type={tab.type} />
      </TabPanel>
    ));
  }, [apiData, canViewPayload]);

  return (
    <Drawer isOpen={!!id}>
      <DrawerContent parentContainer={containerRef}>
        <Box w="full" mx="auto" maxW="848px" gap="4">
          <Flex justifyContent="space-between" m="4">
            <Flex alignItems="center" gap="4">
              <NodeIcon type={ComponentType.SERVICE} boxSize="64px" />

              <Flex direction="column">
                <Flex fontSize="lg" fontWeight="semibold" alignItems="center">
                  <Box mr="8px">{name}</Box>
                </Flex>
                <Box color="muted" fontSize="sm" fontWeight="500">
                  {ComponentTypeToNameMap[ComponentType.SERVICE]}
                </Box>
              </Flex>
            </Flex>
            <Box minW="10">
              <IconButton
                size="sm"
                variant="base"
                aria-label="close"
                icon={<CloseIcon />}
                onClick={onClose}
              />
            </Box>
          </Flex>
          <Flex gap="2" m="4" w="100%" alignItems="center">
            <Flex maxW="calc(100% - 56px)">
              {data && <EndpointComponent {...data} />}
            </Flex>
            {data.endpointType === RadarDetectionEndpointType.HTTP && (
              <Tooltip label="Copy Endpoint">
                <Icon
                  cursor="pointer"
                  boxSize="4"
                  onClick={onApiEndpointCopy}
                  as={ClipboardCopyIcon}
                />
              </Tooltip>
            )}
          </Flex>

          <Tabs isLazy index={tabIndex} onChange={setTabIndex}>
            <TabList>{tabsList}</TabList>
            <TabPanels>{tabsContent}</TabPanels>
          </Tabs>
        </Box>
      </DrawerContent>
    </Drawer>
  );
};

const DetailsTabContent = ({ data, type }) => {
  const jsonView = useMemo(() => {
    return data?.length ? buildJSONSchemaFromTypeMap(data) : null;
  }, [data]);

  return jsonView ? (
    <LazyContent
      element={
        <JSONView
          name={null}
          data={jsonView}
          searchable={true}
          displayDataTypes={false}
          jsonViewHeight="calc(100vh - 360px)"
          viewProps={{ backgroundColor: "bg.surface", py: 2 }}
        />
      }
    />
  ) : (
    <EmptyTab type={type} />
  );
};

const EmptyTab = ({ type }) => {
  return (
    <Flex
      py="6"
      gap="4"
      w="full"
      h="full"
      direction="column"
      alignItems="center"
      justifyContent="center"
    >
      <Image w="180px" src={EmptyTable} />
      <Text>No {type} params are available for this endpoint.</Text>
    </Flex>
  );
};

const buildJSONSchemaFromTypeMap = (typeMap: any[]) => {
  if (!typeMap) {
    return {};
  }

  const finalTypeMap: {
    [key: string]: { type: string };
  } = typeMap.reduce((acc, item) => {
    const { paramPath, paramType } = item;
    acc[paramPath] = {
      type: paramType,
    };
    return acc;
  }, {});

  const result = { type: "object", properties: {} };

  Object.entries(finalTypeMap).forEach(([key, { type }]) => {
    const parts = key.split(/\[\]|\./).filter((p) => p !== ""); // Split by [] or . and remove empty parts
    let current = result.properties;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const partIndex = key.indexOf(part);
      const isPartAnArray = key.slice(partIndex + part.length).startsWith("[]");

      // Last part of the key, assign the type
      if (i === parts.length - 1) {
        if (!current[part]) {
          current[part] = {};
        }
        if (isPartAnArray) {
          current[part] = {
            ...current[part],
            type: "array",
            items: { type },
          };
        } else {
          current[part] = { ...current[part], type };
        }
      } else {
        // Intermediate part, handle arrays and objects properly
        if (!current[part]) {
          current[part] = isPartAnArray
            ? {
                type: "array",
                items: { type: "object", properties: {} },
              }
            : { type: "object", properties: {} };
        }

        current = isPartAnArray
          ? current[part].items.properties
          : current[part].properties;
      }
    }
  });

  return result;
};
export default ApiDetailsDrawer;
