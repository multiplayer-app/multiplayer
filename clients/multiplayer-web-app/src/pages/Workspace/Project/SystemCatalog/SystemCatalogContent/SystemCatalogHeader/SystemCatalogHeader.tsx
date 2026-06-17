import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Flex,
  IconButton,
  Skeleton,
  Stack,
  Text,
  Tooltip,
  Link,
  Box,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import {
  FeatureFlag,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";

import { GearIcon } from "shared/icons";
import SystemMapButton from "./SystemMapButton";
import CheckAccess from "shared/components/CheckAccess";
import { SystemCatalogTabTypes } from "shared/models/enums";
import { useSystemCatalog } from "../../SystemCatalogContext";
import { useIntegrations } from "shared/providers/IntegrationsContext";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";
import { useProjectSettingsPath } from "shared/hooks/useProjectSettingsPath";
import { usePermissions } from "shared/providers/PermissionsContext";

const SystemCatalogHeader = ({
  selectedTab,
  setSelectedTab,
  showStickyHeader,
  availableTabs,
}) => {
  const location = useLocation();
  const { isPublic } = useWorkspace();
  const navigate = useNavigate();
  const { segmentPath } = useProjectSettingsPath();
  const { hasFeature } = usePermissions();
  const { onShowObservabilityModal, onShowObservabilityUpdateModal } =
    useIntegrations();
  const { withSandboxCheck } = useProjectSandbox();
  const { counts, isCountLoading } = useSystemCatalog();
  const { openSettings } = location.state || {};
  const otelKeysTo = segmentPath("otel-keys");

  useEffect(() => {
    if (!!openSettings) {
      onShowObservabilityModal(false);
      navigate("", { state: null, replace: true });
    }
  }, [onShowObservabilityModal, openSettings, navigate]);

  return (
    <>
      <Flex direction="column" gap="4" px={{ base: "4", lg: "10" }} py="4">
        <Flex
          gap="2"
          alignItems={{ base: "flex-start", lg: "center" }}
          direction={{ base: "column", lg: "row" }}
        >
          <Stack gap="2" flex="1">
            <Text fontSize="24px" fontWeight="600">
              {isPublic
                ? "System dashboard for the “Time Travel” app"
                : "System dashboard"}
            </Text>
            <Flex justifyContent="space-between">
              {isPublic ? (
                <Text color="muted" fontSize="sm" maxW="730px">
                  As you record your sessions, we automatically discover, track
                  and document your services, dependencies, APIs, and
                  environments for an always-up-to-date, end-to-end view of your
                  system. Explore how we architected our “Time Travel” app 👇 …
                  or{" "}
                  <Link
                    isExternal
                    href="https://github.com/multiplayer-app/multiplayer-time-travel-platform"
                    color="brand.500"
                  >
                    fork the GitHub repo
                  </Link>{" "}
                  and build it yourself.{" "}
                </Text>
              ) : null}
            </Flex>
          </Stack>
          <Flex gap="2" alignSelf="flex-start" flexWrap="wrap">
            <SystemMapButton />
            <CheckAccess
              entity={RoleProjectPermissionEntity.PROXY}
              permission={RoleAccessAction.READ}
              scope={RoleType.PROJECT}
            >
              <Button
                variant="light"
                aria-label="settings"
                onClick={withSandboxCheck(onShowObservabilityModal)}
              >
                Set up Multiplayer
              </Button>
            </CheckAccess>
            {!isPublic && (
              <CheckAccess
                entity={RoleProjectPermissionEntity.PROXY}
                permission={RoleAccessAction.READ}
                scope={RoleType.PROJECT}
              >
                {hasFeature(FeatureFlag.CONDITIONAL_RECORDING) && (
                  <Button
                    variant="light"
                    aria-label="conditional recording settings"
                    onClick={() => onShowObservabilityUpdateModal()}
                  >
                    Recording settings
                  </Button>
                )}
                {otelKeysTo && (
                  <Button
                    as={RouterLink}
                    to={otelKeysTo}
                    variant="light"
                    aria-label="settings"
                    rightIcon={<GearIcon width="16px" />}
                  >
                    Configure Multiplayer
                  </Button>
                )}
              </CheckAccess>
            )}
          </Flex>
        </Flex>
        <SystemCatalogTabs
          counts={counts}
          isCountLoading={isCountLoading}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          availableTabs={availableTabs}
        />
      </Flex>
      {showStickyHeader && (
        <CompactHeader
          counts={counts}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          availableTabs={availableTabs}
          onShowObservabilityModal={withSandboxCheck(onShowObservabilityModal)}
        />
      )}
    </>
  );
};

export default SystemCatalogHeader;

type SystemCatalogTabsProps = {
  counts: Record<string, number>;
  isCountLoading: boolean;
  selectedTab: SystemCatalogTabTypes;
  setSelectedTab: (tab: SystemCatalogTabTypes) => void;
  availableTabs: SystemCatalogTabTypes[];
};

const SystemCatalogTabs = ({
  counts,
  isCountLoading,
  selectedTab,
  setSelectedTab,
  availableTabs,
}: SystemCatalogTabsProps) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  const scrollTabs = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const amount = el.clientWidth * 0.6;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    updateScrollButtons();
    const handleResize = () => updateScrollButtons();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateScrollButtons]);

  return (
    <Flex position="relative">
      <Flex
        ref={scrollContainerRef}
        flex="1"
        border="1px solid"
        borderColor="border.secondary"
        borderRadius="xl"
        color="muted"
        overflowX="auto"
        className="hidden-scrollbar"
        onScroll={updateScrollButtons}
      >
        {availableTabs.map((tabType, index) => (
          <Flex
            p="4"
            flex="1"
            minW="130px"
            direction="column"
            position="relative"
            borderLeft="1px solid"
            backgroundColor={
              selectedTab === tabType ? "transparent" : "bg.surface"
            }
            color={selectedTab === tabType ? "subtle" : "muted"}
            key={index}
            cursor="pointer"
            borderColor="border.secondary"
            borderBottomColor="brand.600"
            onClick={() => setSelectedTab(tabType)}
            _first={{
              borderBottomLeftRadius: "xl",
              borderTopLeftRadius: "xl",
              borderLeft: "none",
            }}
            _last={{
              borderBottomRightRadius: "xl",
              borderTopRightRadius: "xl",
            }}
            _after={
              selectedTab === tabType && {
                bottom: "0",
                left: "10px",
                content: '""',
                height: "2px",
                position: "absolute",
                borderRadius: "0.5px",
                backgroundColor: "brand.500",
                width: "calc(100% - 20px)",
              }
            }
          >
            <Text fontSize={{ base: "14px", lg: "18px" }} fontWeight="500">
              {tabType}
            </Text>
            <Flex fontSize={{ base: "24px", lg: "36px" }} fontWeight="500">
              {isCountLoading ? (
                <Skeleton
                  mt="2"
                  w="60px"
                  h="46px"
                  borderRadius="18px"
                  startColor="border.primary"
                  endColor="bg.muted"
                />
              ) : (
                counts[tabType]
              )}
            </Flex>
          </Flex>
        ))}
      </Flex>
      {canScrollLeft && (
        <IconButton
          aria-label="Scroll tabs left"
          icon={<ChevronLeftIcon />}
          size="sm"
          h="full"
          variant="ghost"
          position="absolute"
          left="0"
          top="0"
          onClick={() => scrollTabs("left")}
        />
      )}
      {canScrollRight && (
        <IconButton
          aria-label="Scroll tabs right"
          icon={<ChevronRightIcon />}
          size="sm"
          variant="ghost"
          position="absolute"
          right="0"
          top="0"
          h="full"
          onClick={() => scrollTabs("right")}
        />
      )}
    </Flex>
  );
};

const CompactHeader = ({
  counts,
  selectedTab,
  setSelectedTab,
  availableTabs,
  onShowObservabilityModal,
}) => {
  return (
    <Box
      h="0"
      top="0"
      px={{ base: "4", md: "10" }}
      position="sticky"
      zIndex={10}
    >
      <Flex
        h="12"
        top="0"
        zIndex={10}
        bg="bg.primary"
        position="sticky"
        borderBottom="1px solid"
        borderColor="border.primary"
        alignItems="center"
        overflowX="auto"
        className="hidden-scrollbar"
      >
        {availableTabs.map((tabType: SystemCatalogTabTypes, index: number) => {
          const isSelected = selectedTab === tabType;
          return (
            <Flex
              px="4"
              h="full"
              key={index}
              cursor="pointer"
              position="relative"
              alignItems="center"
              color={isSelected ? "brand.500" : "subtle"}
              borderBottom="2px solid"
              borderColor={isSelected ? "brand.500" : "transparent"}
              onClick={() => setSelectedTab(tabType)}
            >
              <Text fontWeight="500">{tabType}</Text>
              <Flex
                px="1"
                ml="2"
                fontSize="xs"
                bg={isSelected ? "brand.500" : "bg.subtle"}
                color={isSelected ? "inverse" : "muted"}
                border="1px solid"
                borderRadius="base"
                borderColor="blackAlpha.100"
              >
                {counts[tabType]}
              </Flex>
            </Flex>
          );
        })}

        <CheckAccess
          permission={RoleAccessAction.READ}
          entity={RoleProjectPermissionEntity.PROXY}
          scope={RoleType.PROJECT}
        >
          <Tooltip openDelay={500} label="Set up Multiplayer">
            <IconButton
              variant="light"
              ml="auto"
              aria-label="Set up Multiplayer"
              icon={<GearIcon width="16px" />}
              onClick={onShowObservabilityModal}
            />
          </Tooltip>
        </CheckAccess>
      </Flex>
    </Box>
  );
};
