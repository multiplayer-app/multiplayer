import { Flex } from "@chakra-ui/react";
import { useParams } from "react-router-dom";

import { EntityCategories } from "shared/models/enums";
import LazyContent, { lazyModule } from "shared/components/LazyContent";

import { useTabs } from "shared/providers/TabsContext";
import { useProject } from "shared/providers/ProjectContext";

import Navbar from "./Navbar";
import { ChatPanel } from "shared/components/AgentChat";
import { useEffect } from "react";
import {
  entityCategoryMap,
  navbarExpandedWidth,
  projectSourceTypeMap,
} from "shared/configs/project.configs";
const TabsHeader = lazyModule(() => import("./TabsHeader"));

type LayoutProps = {
  children?: React.ReactNode;
};

const ContentLayout = ({ children }: LayoutProps) => {
  const { focusTab } = useTabs();
  const { sourceType, type } = useParams();
  const { layoutState, projectContentContainerRef, setLayoutState } =
    useProject();

  useEffect(() => {
    const selected =
      projectSourceTypeMap[sourceType] || entityCategoryMap[type];

    setLayoutState((prev) => ({
      ...prev,
      selectedEntityCategory: selected || null,
    }));
  }, [type, sourceType]);

  const selectEntity = (entity: EntityCategories) => {
    setLayoutState((prev) => ({ ...prev, selectedEntityCategory: entity }));
  };

  return (
    <Flex flex="1" minH="0" overflowX="hidden">
      <Navbar
        selected={layoutState.selectedEntityCategory}
        setSelected={selectEntity}
      />
      <Flex
        flex="1"
        minH="0"
        direction="column"
        bg="bg.primary"
        position="relative"
        minW={{ base: "100vw", md: "0" }}
        ml={{
          base: layoutState.navbarExpanded ? navbarExpandedWidth : "0",
          md: "0",
        }}
        transition="margin .3s cubic-bezier(.87, 0, .13, 1)"
      >
        {layoutState.showTabs && <LazyContent element={<TabsHeader />} />}
        <Flex flex="1" minH="0" overflow="hidden">
          <Flex
            flex="1"
            minH="0"
            overflow="hidden"
            direction="column"
            position="relative"
            onClick={focusTab}
            ref={projectContentContainerRef}
          >
            {children}
          </Flex>
          <ChatPanel />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ContentLayout;
