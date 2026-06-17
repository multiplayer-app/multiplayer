import {
  Tabs,
  Text,
  Box,
  Tab,
  Flex,
  Badge,
  Switch,
  TabList,
  TabPanel,
  Checkbox,
  TabPanels,
  UseDisclosureReturn,
  Button,
  ButtonGroup,
} from "@chakra-ui/react";

import { useMemo, useState, ChangeEvent } from "react";
import { PlatformRadarData } from "@multiplayer/types";
import TimeAgo from "shared/components/TimeAgo";
import Drawer, { DrawerContent } from "shared/components/Drawer/Drawer";

import {
  ComponentDetection,
  PlatformDetections,
  DependencyDetection,
} from "../types";
import { EmptyScreen } from "./EmptyScreen";
import { ComponentListItem } from "./ComponentListItem";
import { DependencyListItem } from "./DependencyListItem";
import { EnableRadarScreen } from "./EmptyScreen/EmptyScreen";

interface PlatformRadarDrawerProps {
  detections: PlatformDetections;
  isRadarActive?: boolean;
  radarData: PlatformRadarData;
  disclosure?: UseDisclosureReturn;
  parentContainer?: HTMLDivElement;
  onApplyAll: () => void;
  setRadarData: <K extends keyof PlatformRadarData>(
    key: K,
    val: PlatformRadarData[K]
  ) => void;
  onApply: (c: ComponentDetection[], d: DependencyDetection[]) => void;
  onIgnore: (c: ComponentDetection[], d: DependencyDetection[]) => void;
}

interface SelectionState {
  components: Set<string>;
  dependencies: Set<string>;
}

const PlatformRadarDrawer = ({
  radarData,
  disclosure,
  detections,
  parentContainer,
  isRadarActive,
  onApply,
  onIgnore,
  onApplyAll,
  setRadarData,
}: PlatformRadarDrawerProps) => {
  return (
    <Drawer isOpen={disclosure.isOpen}>
      <DrawerContent
        height="auto"
        onClose={disclosure.onClose}
        parentContainer={parentContainer}
      >
        {isRadarActive ? (
          <ActiveRadarContent
            radarData={radarData}
            onApply={onApply}
            onIgnore={onIgnore}
            onApplyAll={onApplyAll}
            setRadarData={setRadarData}
            detections={detections}
          />
        ) : (
          <EnableRadarScreen />
        )}
      </DrawerContent>
    </Drawer>
  );
};

const ActiveRadarContent = ({
  detections,
  radarData,
  onIgnore,
  onApply,
  onApplyAll,
  setRadarData,
}: PlatformRadarDrawerProps) => {
  const [selection, setSelection] = useState<SelectionState>({
    components: new Set(),
    dependencies: new Set(),
  });

  const lastActiveTime = useMemo(() => {
    const { components, dependencies } = detections;
    return Math.max(
      ...components.map((c) => Number(c.timestamp)),
      ...dependencies.map((c) => c.timestamp)
    );
  }, [detections]);
  const { components, dependencies } = detections;

  const componentNameToIdMap = useMemo(() => {
    const map = new Map<string, string>();
    components.forEach((c) => map.set(c.componentName, c.id));
    return map;
  }, [components]);

  const idToComponentMap = useMemo(() => {
    const map = new Map(components.map((c) => [c.id, c]));
    return map;
  }, [components]);

  const idToDependencyMap = useMemo(() => {
    const map = new Map(dependencies.map((d) => [d.id, d]));
    return map;
  }, [dependencies]);

  const handleComponentSelect = (componentId: string) => {
    const component = idToComponentMap.get(componentId);
    if (!component) return;

    setSelection((prev) => {
      const newComponents = new Set(prev.components);
      const newDependencies = new Set(prev.dependencies);

      const isSelected = newComponents.has(componentId);
      if (isSelected) {
        newComponents.delete(componentId);

        if (radarData.linkEnabled) {
          const connectedDeps = getConnectedDependencyIds(
            component.componentName,
            dependencies
          );

          for (const depId of connectedDeps) {
            const dep = idToDependencyMap.get(depId);
            if (!dep || !newDependencies.has(depId)) continue;

            const stillConnected = Array.from(newComponents).some((otherId) => {
              const otherComp = idToComponentMap.get(otherId);
              return (
                otherComp &&
                (dep.source === otherComp.componentName ||
                  dep.target === otherComp.componentName)
              );
            });

            if (!stillConnected) {
              newDependencies.delete(depId);
            }
          }
        }
      } else {
        newComponents.add(componentId);

        if (radarData.linkEnabled) {
          const connectedDeps = getConnectedDependencyIds(
            component.componentName,
            dependencies
          );

          for (const depId of connectedDeps) {
            newDependencies.add(depId);
            const dep = idToDependencyMap.get(depId);
            if (dep) {
              const compIds = getConnectedComponentIds(
                dep,
                componentNameToIdMap
              );
              compIds.forEach((id) => newComponents.add(id));
            }
          }
        }
      }

      return { components: newComponents, dependencies: newDependencies };
    });
  };

  const handleDependencySelect = (dependencyId: string) => {
    const dep = idToDependencyMap.get(dependencyId);
    if (!dep) return;

    setSelection((prev) => {
      const newDependencies = new Set(prev.dependencies);
      const newComponents = new Set(prev.components);
      const isSelected = newDependencies.has(dependencyId);

      if (isSelected) {
        newDependencies.delete(dependencyId);

        if (radarData.linkEnabled) {
          const componentIds = getConnectedComponentIds(
            dep,
            componentNameToIdMap
          );

          componentIds.forEach((compId) => {
            const stillConnected = Array.from(newDependencies).some(
              (otherDepId) => {
                const otherDep = idToDependencyMap.get(otherDepId);
                return (
                  otherDep &&
                  (otherDep.source ===
                    idToComponentMap.get(compId)?.componentName ||
                    otherDep.target ===
                      idToComponentMap.get(compId)?.componentName)
                );
              }
            );

            if (!stillConnected) {
              newComponents.delete(compId);
            }
          });
        }
      } else {
        newDependencies.add(dependencyId);

        if (radarData.linkEnabled) {
          const componentIds = getConnectedComponentIds(
            dep,
            componentNameToIdMap
          );
          componentIds.forEach((compId) => newComponents.add(compId));
        }
      }

      return { components: newComponents, dependencies: newDependencies };
    });
  };

  const handleSelectAllComponents = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const newComponents = new Set(components.map((c) => c.id));

      let newDependencies = new Set(selection.dependencies);
      if (radarData.linkEnabled) {
        components.forEach((component) => {
          dependencies.forEach((dep) => {
            if (
              dep.source === component.componentName ||
              dep.target === component.componentName
            ) {
              newDependencies.add(dep.id);
            }
          });
        });
      }

      setSelection({
        components: newComponents,
        dependencies: newDependencies,
      });
    } else {
      if (radarData.linkEnabled) {
        setSelection({ components: new Set(), dependencies: new Set() });
      } else {
        setSelection((prev) => ({ ...prev, components: new Set() }));
      }
    }
  };

  const handleSelectAllDependencies = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const newDependencies = new Set(dependencies.map((d) => d.id));

      let newComponents = new Set(selection.components);
      if (radarData.linkEnabled) {
        dependencies.forEach((dep) => {
          const sourceComponent = components.find(
            (c) => c.componentName === dep.source
          );
          const targetComponent = components.find(
            (c) => c.componentName === dep.target
          );

          if (sourceComponent) newComponents.add(sourceComponent.id);
          if (targetComponent) newComponents.add(targetComponent.id);
        });
      }

      setSelection({
        components: newComponents,
        dependencies: newDependencies,
      });
    } else {
      if (radarData.linkEnabled) {
        setSelection({ components: new Set(), dependencies: new Set() });
      } else {
        setSelection((prev) => ({ ...prev, dependencies: new Set() }));
      }
    }
  };

  const getSelectedItems = () => {
    const selectedComponents = components.filter((c) =>
      selection.components.has(c.id)
    );
    const selectedDependencies = dependencies.filter((d) =>
      selection.dependencies.has(d.id)
    );
    return { selectedComponents, selectedDependencies };
  };

  const handleAction = (action: "apply" | "ignore") => {
    const { selectedComponents, selectedDependencies } = getSelectedItems();

    if (action === "ignore") {
      onIgnore(selectedComponents, selectedDependencies);
    } else {
      onApply(selectedComponents, selectedDependencies);
    }

    setSelection({ components: new Set(), dependencies: new Set() });
  };

  const hasSelection =
    selection.components.size > 0 || selection.dependencies.size > 0;

  return (
    <Flex direction="column" h="full">
      <Flex justifyContent="space-between" px="4" pt="4">
        <Box>
          <Text fontSize="16px" fontWeight="medium">
            Auto-Docs
          </Text>
          {lastActiveTime && (
            <Text fontSize="small" color="muted">
              Last activity: <TimeAgo date={lastActiveTime} />
            </Text>
          )}
        </Box>
      </Flex>

      <Flex
        p="4"
        m="4"
        gap="4"
        bg="bg.surface"
        direction="column"
        borderRadius="2xl"
        border="solid 1px"
        borderColor="border.primary"
      >
        <Flex alignItems="center" justifyContent="space-between">
          Show Auto-Docs
          <Switch
            isChecked={radarData.enabled}
            onChange={(e) => setRadarData("enabled", e.target.checked)}
            colorScheme="brand"
          />
        </Flex>

        <Flex alignItems="center" justifyContent="space-between">
          Auto-select dependents
          <Switch
            isChecked={radarData.linkEnabled}
            onChange={(e) => setRadarData("linkEnabled", e.target.checked)}
            colorScheme="brand"
          />
        </Flex>
      </Flex>

      <Tabs
        isLazy
        isFitted
        flex="1"
        minH="0"
        display="flex"
        flexDir="column"
        colorScheme="brand"
      >
        <TabList borderBottomWidth="1px" px="2" pt="2">
          <Tab mx="4" fontSize="sm" mb="-1px" fontWeight="medium">
            Components
            <Badge ml="2">{components.length}</Badge>
          </Tab>
          <Tab mx="4" fontSize="sm" mb="-1px" fontWeight="medium">
            Dependencies
            <Badge ml="2">{dependencies.length}</Badge>
          </Tab>
        </TabList>
        <TabPanels
          flex="1"
          minH="0"
          display="flex"
          overflow="auto"
          flexDirection="column"
        >
          <TabPanel minH="full" display="flex" flexDirection="column">
            {components.length ? (
              <Flex gap="2" direction="column">
                <Flex
                  pl="4"
                  gap="2"
                  pb="2"
                  color="muted"
                  fontSize="small"
                  justifyContent="space-between"
                >
                  <Flex alignItems="center">
                    <Checkbox
                      mr="2"
                      bg="bg.primary"
                      isChecked={
                        selection.components.size === components.length
                      }
                      isIndeterminate={
                        selection.components.size > 0 &&
                        selection.components.size < components.length
                      }
                      onChange={handleSelectAllComponents}
                    />
                    Select all
                  </Flex>
                </Flex>
                {components.map((c) => (
                  <ComponentListItem
                    key={c.id}
                    data={c}
                    isSelected={selection.components.has(c.id)}
                    onSelect={() => handleComponentSelect(c.id)}
                  />
                ))}
              </Flex>
            ) : (
              <EmptyScreen type="components" />
            )}
          </TabPanel>
          <TabPanel minH="full" display="flex" flexDirection="column">
            {dependencies.length ? (
              <Flex gap="2" direction="column">
                <Flex
                  pl="4"
                  pb="2"
                  gap="2"
                  pr="24"
                  color="muted"
                  fontSize="small"
                >
                  <Checkbox
                    bg="bg.primary"
                    mr="2"
                    as="div"
                    isChecked={
                      selection.dependencies.size === dependencies.length
                    }
                    isIndeterminate={
                      selection.dependencies.size > 0 &&
                      selection.dependencies.size < dependencies.length
                    }
                    onChange={handleSelectAllDependencies}
                  />
                  <Text flex="1">Source</Text>
                  <Text flex="1" textAlign="right">
                    Target
                  </Text>
                </Flex>
                {dependencies.map((d) => (
                  <DependencyListItem
                    key={d.id}
                    data={d}
                    isSelected={selection.dependencies.has(d.id)}
                    onSelect={() => handleDependencySelect(d.id)}
                  />
                ))}
              </Flex>
            ) : (
              <EmptyScreen type="dependencies" />
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
      {hasSelection ? (
        <>
          <Box p={4} bottom={0}>
            <Flex gap="4" mb="3">
              <Text fontSize="sm" color="muted">
                Components: <b>{selection.components.size}</b>
              </Text>
              <Text fontSize="sm" color="muted">
                Dependencies: <b>{selection.dependencies.size}</b>
              </Text>
            </Flex>
            <ButtonGroup width="full" spacing={4}>
              <Button flex={1} onClick={() => handleAction("apply")}>
                Apply Selected
              </Button>
              <Button
                flex={1}
                variant="outline"
                onClick={() => handleAction("ignore")}
              >
                Ignore Selected
              </Button>
            </ButtonGroup>
          </Box>
        </>
      ) : components.length > 0 || dependencies.length > 0 ? (
        <Box p={4} bottom={0}>
          <Button w="full" onClick={onApplyAll}>
            Apply All
          </Button>
        </Box>
      ) : null}
    </Flex>
  );
};

const getConnectedDependencyIds = (
  componentName: string,
  dependencies: DependencyDetection[]
): string[] =>
  dependencies
    .filter(
      (dep) => dep.source === componentName || dep.target === componentName
    )
    .map((dep) => dep.id);

const getConnectedComponentIds = (
  dependency: DependencyDetection,
  componentNameToIdMap: Map<string, string>
): string[] => {
  return [dependency.source, dependency.target]
    .map((name) => componentNameToIdMap.get(name))
    .filter(Boolean) as string[];
};

export default PlatformRadarDrawer;
