// External libraries
import { Flex, Icon, Box, Text, useDisclosure } from "@chakra-ui/react";
import {
  RoleType,
  EntityType,
  ComponentType,
  RoleAccessAction,
  FeatureFlag,
  RadarDetectionSource,
  RoleProjectPermissionEntity,
} from "@multiplayer/types";
import { useRef, useState, useEffect, useMemo } from "react";

// Internal components
import Tag from "shared/components/Tag";
import TimeAgo from "shared/components/TimeAgo";
import NodeIcon from "shared/components/NodeIcon";
import EntityIcon from "shared/components/EntityIcon";
import ApiDetailsDrawer from "shared/components/ApiDetailsDrawer";
import EndpointComponent from "shared/components/EndpointComponent";
import EntityDetailsDrawer from "shared/components/EntityDetailsDrawer";
import { ComponentStatusBadge } from "shared/components/ComponentStatusBadge";
import { ComponentDetailsDrawer } from "shared/components/PlatformComponents";

// Internal icons and models
import { FlowIcon } from "shared/icons";
import { SystemCatalogTabTypes, EntityCategories } from "shared/models/enums";

// Internal providers and utils
import { stringifyTag } from "shared/utils";
import { useEntities } from "shared/providers/EntitiesContext";
import { usePermissions } from "shared/providers/PermissionsContext";

// Local imports
import {
  columnTypes,
  columnsPerTabConfig,
  SYSTEM_CATALOG_LIMIT,
  tabToFeatureFlagMap,
} from "../systemCatalog.config";
import { useSystemCatalog } from "../SystemCatalogContext";

import SystemCatalogData from "./SystemCatalogData";
import SystemCatalogHeader from "./SystemCatalogHeader";
import SystemCatalogIntro from "./SystemCatalogIntro";
import PageLoading from "shared/components/PageLoading";
import { useTabs } from "shared/providers/TabsContext";

const SystemCatalogContent = () => {
  const {
    isRadarActive,
    setTabsState,
    isCountLoading,
    emptySystemData,
    getAPIs,
    getFlowsData,
    getComponents,
    getDependencies,
    getPlatformsData,
    getEnvironmentsData,
  } = useSystemCatalog();
  const containerRef = useRef(null);
  const { entities } = useEntities();
  const { onEntityOpen, onFlowOpen } = useTabs();
  const apisDrawerDisclosure = useDisclosure();
  const entityDrawerDisclosure = useDisclosure();
  const componentsDrawerDisclosure = useDisclosure();
  const { hasAccess, hasFeature } = usePermissions();

  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [componentInDrawer, setComponentInDrawer] = useState<string | null>(
    null
  );
  const [entityInDrawer, setEntityInDrawer] = useState<{
    entityName: string;
    entityId: string;
  } | null>(null);
  const [apiInDrawer, setApiInDrawer] = useState<{
    name: string;
    id: string;
    data: any;
  } | null>(null);

  const availableTabs = useMemo(() => {
    return Object.values(SystemCatalogTabTypes).filter((tab) => {
      const featureFlag = tabToFeatureFlagMap[tab];
      // Include the tab if there is no feature flag or if the feature flag is enabled
      return !featureFlag || hasFeature(featureFlag);
    });
  }, [hasFeature]);

  const getDefaultSelectedTab = () => {
    const recentSelectedTab = localStorage.getItem("sysCatalogTab");
    if (
      recentSelectedTab &&
      SystemCatalogTabTypes[recentSelectedTab] &&
      availableTabs.includes(recentSelectedTab as SystemCatalogTabTypes)
    ) {
      return recentSelectedTab as SystemCatalogTabTypes;
    } else {
      return SystemCatalogTabTypes.Components;
    }
  };

  const [selectedTab, setSelectedTab] = useState(getDefaultSelectedTab());

  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as HTMLDivElement).scrollTop = 0;
    }
  }, [selectedTab]);

  useEffect(() => {
    const fetchData = () => {
      switch (selectedTab) {
        case SystemCatalogTabTypes.Components:
          getComponents();
          break;
        case SystemCatalogTabTypes.Dependencies:
          getDependencies();
          break;
        case SystemCatalogTabTypes.Platforms:
          getPlatformsData();
          break;
        case SystemCatalogTabTypes.Environments:
          getEnvironmentsData();
          break;
        case SystemCatalogTabTypes.APIs:
          getAPIs();
          break;
        case SystemCatalogTabTypes.Flows:
          getFlowsData();
          break;
        default:
          break;
      }
    };
    fetchData();
  }, [
    isRadarActive,
    selectedTab,
    getAPIs,
    getFlowsData,
    getComponents,
    getDependencies,
    getPlatformsData,
    getEnvironmentsData,
  ]);

  const openComponentDrawer = (id: string) => {
    if (id) {
      setComponentInDrawer(id);
      apisDrawerDisclosure.onClose();
      componentsDrawerDisclosure.onOpen();
    }
  };

  const openAPIDrawer = (id: string, name: string, props: any) => {
    if (id) {
      setApiInDrawer({ id, name, data: props });
      componentsDrawerDisclosure.onClose();
      apisDrawerDisclosure.onOpen();
    }
  };

  const openPlatformDrawer = (entityId: string, entityName: string) => {
    if (entityId) {
      setEntityInDrawer({ entityId, entityName });
      componentsDrawerDisclosure.onClose();
      apisDrawerDisclosure.onClose();
      entityDrawerDisclosure.onOpen();
    }
  };

  const filterByTag = ([key, value]) => {
    setTabsState((prev) => {
      const tagString = stringifyTag([key, value]);
      const prevTags = prev[selectedTab].tags.filter((t) => !(t === tagString));
      return {
        ...prev,
        [selectedTab]: {
          ...prev[selectedTab],
          params: { skip: 0, limit: SYSTEM_CATALOG_LIMIT },
          tags: [...prevTags, tagString],
        },
      };
    });
  };

  const columns = useMemo(
    () => [
      {
        field: columnTypes.Component,
        name: "Component",
        sortable: true,
        minWidth: "200px",
        component: ({ componentName, id, entityId }) => {
          const componentType = entityId
            ? entities[EntityCategories.COMPONENT].find(
                (c) => c.entityId === entityId
              )?.meta?.summary?.type
            : ComponentType.GENERIC;
          return (
            <Flex key={id} flex="1" alignItems="center" userSelect="none">
              <NodeIcon type={componentType} mr="8px" />
              {componentName}
            </Flex>
          );
        },
      },
      {
        field: columnTypes.Service,
        name: "Service",
        sortable: true,
        minWidth: 200,
        component: (props: any) => {
          const { componentName, id } = props;
          return (
            <Flex key={id} flex="1" alignItems="center" py="2">
              <NodeIcon type={ComponentType.GENERIC} mr="8px" />
              {componentName}
            </Flex>
          );
        },
      },
      {
        field: columnTypes.Protocol,
        name: "Protocol",
        sortable: true,
        width: "100px",
        component: ({ endpointType }) => {
          return (
            <Text flex="1" fontSize="sm" fontWeight="500" color="muted">
              {endpointType}
            </Text>
          );
        },
      },
      {
        field: columnTypes.Tags,
        name: "Tags",
        maxWidth: "150px",
        component: ({ tags }) => {
          return tags ? (
            <Flex gap="1" flexWrap="wrap" py="1">
              {tags.map((tag: any) => {
                const { key, value } = Array.isArray(tag)
                  ? { key: tag[0], value: tag[1] }
                  : tag;

                return (
                  <Tag
                    size="sm"
                    key={key + value}
                    name={`${key ? key + ":" : ""}${value}`}
                    onClick={() => filterByTag([key, value])}
                  />
                );
              })}
            </Flex>
          ) : null;
        },
      },

      {
        field: columnTypes.DependencyProtocol,
        name: "Protocol",
        sortable: true,
        width: "100px",
        component: ({ targetEndpointType }) => (
          <Text fontSize="sm" fontWeight="500" color="muted">
            {targetEndpointType}
          </Text>
        ),
      },
      {
        field: columnTypes.Endpoint,
        name: "Endpoint",
        sortable: true,
        maxWidth: "200px",
        component: (props: any) => {
          return (
            <Flex alignItems="center">
              <EndpointComponent {...props} />
            </Flex>
          );
        },
      },
      {
        field: columnTypes.TargetEndpoint,
        name: "Target Endpoint",
        sortable: false,
        maxWidth: "200px",
        component: ({
          id,
          targetEndpointType,
          targetHttpEndpoint,
          targetHttpMethod,
          targetMessagingDestination,
          targetMessagingSystem,
          targetRpcMethod,
          targetRpcService,
          targetRpcSystem,
        }) => {
          const props = {
            id,
            endpointType: targetEndpointType,
            httpMethod: targetHttpMethod,
            httpEndpoint: targetHttpEndpoint,
            messagingSystem: targetMessagingSystem,
            messagingDestination: targetMessagingDestination,
            rpcMethod: targetRpcMethod,
            rpcSystem: targetRpcSystem,
            rpcService: targetRpcService,
          };
          return (
            <Flex alignItems="center">
              <EndpointComponent {...props} />
            </Flex>
          );
        },
      },
      {
        field: columnTypes.Radar,
        name: "Status",
        sortable: true,
        width: "130px",
        minWidth: "130px",
        component: ({ Sign }) => {
          return (
            <Flex alignItems="center">
              <ComponentStatusBadge sign={Sign} />
            </Flex>
          );
        },
      },
      {
        field: columnTypes.LastActiveComponent,
        name: "Last Active",
        sortable: true,
        minWidth: "130px",
        component: ({ Timestamp, Sign }) => {
          return Sign !== RadarDetectionSource.DOCS.toString() ? (
            <Text
              fontSize="sm"
              fontWeight="500"
              color="muted"
              userSelect="none"
            >
              <TimeAgo date={Timestamp} />
            </Text>
          ) : null;
        },
      },
      {
        field: columnTypes.LastActiveFlow,
        name: "Last Active",
        sortable: true,
        component: ({ updatedAt }) => (
          <Text fontSize="sm" fontWeight="500" color="muted" userSelect="none">
            <TimeAgo date={updatedAt} />
          </Text>
        ),
      },
      {
        field: columnTypes.Platform,
        name: "Platform",
        sortable: false,
        component: ({ key }) => (
          <Flex gap={2} alignItems="center">
            <EntityIcon color="muted" name={EntityType.PLATFORM} />
            <Text fontSize="sm" fontWeight="500" color="muted">
              {key}
            </Text>
          </Flex>
        ),
      },
      {
        field: columnTypes.Flow,
        name: "Flow",
        sortable: true,
        component: ({ name }) => {
          return (
            <Flex alignItems="center" gap={2}>
              <Icon as={FlowIcon} />
              {name}
            </Flex>
          );
        },
      },
      {
        field: columnTypes.Environment,
        name: "Environment",
        sortable: true,
        component: ({ key }) => <Text fontSize="sm">{key}</Text>,
      },
      {
        field: columnTypes.Environments,
        name: "Environments",
        sortable: false,
        component: ({ environmentNames }) => (
          <Text fontSize="sm" fontWeight="500" color="muted">
            {environmentNames?.map((env, index) =>
              index === 0 ? env : ", " + env
            )}
          </Text>
        ),
      },
      {
        field: columnTypes.Target,
        name: "Target",
        sortable: true,
        component: ({ targetComponentName }) => {
          return (
            <Flex flex="1" alignItems="center">
              <Flex>
                <NodeIcon type={ComponentType.GENERIC} mr="8px" />
                {targetComponentName}
              </Flex>
            </Flex>
          );
        },
      },
      {
        field: columnTypes.Source,
        name: "Source",
        sortable: true,
        component: ({ sourceComponentName }) => {
          return (
            <Flex flex="1" alignItems="center">
              <Flex direction="column" flex="1" py="2" gap="1">
                <Flex>
                  <NodeIcon type={ComponentType.GENERIC} mr="8px" />
                  {sourceComponentName}
                </Flex>
              </Flex>
            </Flex>
          );
        },
      },
    ],
    [entities]
  );

  const filteredAndSortedColumns = useMemo(() => {
    const columnsSet = columnsPerTabConfig[selectedTab];
    const columnsArray = Array.from(columnsSet);
    return (columns.filter(({ field }) => columnsSet.has(field)) || []).sort(
      (a, b) => {
        return columnsArray.indexOf(a.field) - columnsArray.indexOf(b.field);
      }
    );
  }, [selectedTab, columns]);

  const handleScroll = (e) => {
    if (e.target.scrollTop > 220) {
      setShowStickyHeader(true);
    } else {
      setShowStickyHeader(false);
    }
  };

  const handleTableRowClick = (data: any) => {
    switch (selectedTab) {
      case SystemCatalogTabTypes.Components:
        if (data.entityId) {
          openComponentDrawer(data.entityId);
        }
        break;
      case SystemCatalogTabTypes.APIs:
        const { id, componentName } = data;
        if (id) {
          openAPIDrawer(id, componentName, data);
        }
        break;
      case SystemCatalogTabTypes.Platforms:
        const { entityId, key } = data;
        openPlatformDrawer(entityId, key);
        break;
      case SystemCatalogTabTypes.Environments:
        onEntityOpen(data);
        break;
      case SystemCatalogTabTypes.Flows:
        const { id: flowId, name } = data;
        onFlowOpen({ id: flowId, name });
        break;
      default:
        return;
    }
  };

  const access = useMemo(() => {
    return {
      entityDelete: hasAccess(
        RoleProjectPermissionEntity.ENTITY,
        RoleAccessAction.DELETE,
        RoleType.PROJECT
      ),
      entityUpdate: hasAccess(
        RoleProjectPermissionEntity.ENTITY,
        RoleAccessAction.UPDATE,
        RoleType.PROJECT
      ),
    };
  }, [hasAccess]);

  return (
    <Box
      ref={containerRef}
      flex="1"
      minH="full"
      overflow="scroll"
      position="relative"
      onScroll={handleScroll}
    >
      {isCountLoading ? (
        <PageLoading />
      ) : !isCountLoading && emptySystemData ? (
        <SystemCatalogIntro />
      ) : (
        <Flex flex="1" pb="4" direction="column">
          <SystemCatalogHeader
            selectedTab={selectedTab}
            availableTabs={availableTabs}
            showStickyHeader={showStickyHeader}
            setSelectedTab={(tab: SystemCatalogTabTypes) => {
              setSelectedTab(tab);
              localStorage.setItem("sysCatalogTab", tab);
              componentsDrawerDisclosure.onClose();
              entityDrawerDisclosure.onClose();
              apisDrawerDisclosure.onClose();
            }}
          />
          <SystemCatalogData
            selectedTab={selectedTab}
            readonly={!access.entityDelete}
            columns={filteredAndSortedColumns}
            onRowClick={handleTableRowClick}
          />
        </Flex>
      )}
      {componentsDrawerDisclosure.isOpen && (
        <ComponentDetailsDrawer
          readonly={!access.entityUpdate}
          containerRef={containerRef.current}
          preSelectedComponentId={componentInDrawer}
          onClose={componentsDrawerDisclosure.onClose}
        />
      )}
      {apisDrawerDisclosure.isOpen && (
        <ApiDetailsDrawer
          {...apiInDrawer}
          containerRef={containerRef.current}
          key={
            hasFeature(FeatureFlag.RADAR_DETECT_ENDPOINT_PAYLOAD)
              ? "with-payload"
              : "without-payload"
          }
          onClose={() => apisDrawerDisclosure.onClose()}
        />
      )}
      {entityDrawerDisclosure.isOpen && (
        <EntityDetailsDrawer
          {...entityInDrawer}
          showNewTabButton={true}
          readonly={!access.entityUpdate}
          entityType={EntityType.PLATFORM}
          containerRef={containerRef.current}
          onClose={() => entityDrawerDisclosure.onClose()}
        />
      )}
    </Box>
  );
};

export default SystemCatalogContent;
