import {
  useRef,
  useState,
  useLayoutEffect,
  useTransition,
  useEffect,
  useMemo,
} from "react";

import {
  Flex,
  TabList,
  Tab,
  Badge,
  Menu,
  Icon,
  MenuList,
  MenuItem,
  MenuButton,
} from "@chakra-ui/react";
import { MoreDotesIcon } from "shared/icons";

import debounce from "lodash.debounce";
import { useDebugSessionLayout } from "../DebugSessionLayoutContext";

interface DebugSessionTabsProps {
  tabIndex: number;
  onTabChange: (i: number) => void;
  tabs: Array<{ name: string; count?: number; visible: boolean }>;
}

const DebugSessionTabs = ({
  tabs,
  onTabChange,
  tabIndex,
}: DebugSessionTabsProps) => {
  const listContainerRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const { configs } = useDebugSessionLayout();

  const [isPending, startTransition] = useTransition();
  const [allTabs, setAllTabs] = useState([]);

  useEffect(() => {
    setAllTabs(tabs);
  }, [tabs]);

  const adjustTabs = () => {
    if (!listContainerRef.current || !tabsContainerRef.current) return;

    const tabList = listContainerRef.current;
    const containerWidth =
      tabsContainerRef.current.getBoundingClientRect()?.width;

    let spaceLeft = containerWidth;
    const newAllTabs = [];
    let foundInvisible = false;

    Array.from(tabList.childNodes).forEach((child, index) => {
      if (foundInvisible) {
        newAllTabs.push({ ...tabs[index], visible: false });
        return;
      }

      const tabWidth = getChildWidth(child as HTMLElement);
      const isVisible = spaceLeft - tabWidth >= 0;
      newAllTabs.push({ ...tabs[index], visible: isVisible });

      if (isVisible) {
        spaceLeft -= tabWidth;
      } else {
        foundInvisible = true;
      }
    });

    startTransition(() => {
      setAllTabs(newAllTabs);
    });
  };

  useLayoutEffect(() => {
    if (!tabsContainerRef.current) return;

    const resizeObserver = new ResizeObserver(debounce(adjustTabs, 100));
    resizeObserver.observe(tabsContainerRef.current);
    adjustTabs();

    return () => {
      resizeObserver.disconnect();
    };
  }, [tabs, configs.isListView, configs.sessionPreviewMode]);

  const hiddenTabs = useMemo(
    () => allTabs.filter((tab) => !tab.visible),
    [allTabs]
  );

  return (
    <Flex gap="2" px="2" alignItems="center" ref={tabsContainerRef} w="full">
      {/* Visible tabs */}
      <TabList border="none" ref={listContainerRef} overflow="hidden">
        {allTabs.map((tab, index) => (
          <Tab
            key={index}
            mx="2"
            display={tab.visible ? "flex" : "none"}
          >
            {tab.name}
            {tab.count !== undefined && (
              <Badge
                ml="2"
                fontSize="2xs"
                border="1px solid"
                borderRadius="base"
                borderColor="#0000000F"
                color={index === tabIndex ? "inverse" : "muted"}
                background={index === tabIndex ? "brand.500" : "bg.muted"}
              >
                {tab.count}
              </Badge>
            )}
          </Tab>
        ))}
      </TabList>

      {/* Hidden tabs menu */}
      {hiddenTabs.length > 0 && (
        <Menu>
          <MenuButton mt="-3">
            <Icon color="muted" as={MoreDotesIcon} />
          </MenuButton>
          <MenuList zIndex={12}>
            {hiddenTabs.map((tab, index) => (
              <MenuItem
                key={index}
                onClick={() =>
                  onTabChange(tabs.findIndex((t) => t.name === tab.name))
                }
              >
                {tab.name}
                {tab.count !== undefined && (
                  <Badge
                    ml="2"
                    color="muted"
                    border="1px solid"
                    borderColor="#0000000F"
                  >
                    {tab.count}
                  </Badge>
                )}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      )}
    </Flex>
  );
};

const getChildWidth = (child) => {
  return child.getBoundingClientRect().width + 24; // width + margin
};

export default DebugSessionTabs;
