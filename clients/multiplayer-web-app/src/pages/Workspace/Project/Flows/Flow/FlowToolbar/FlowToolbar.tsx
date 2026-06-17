import Toolbar, { ToolbarButton } from "shared/components/Toolbar";
import FullScreenToggleButton from "shared/components/FullScreenToggleButton";
import { SidebarIcon } from "shared/icons";
import { useFlow } from "../FlowContext";

interface FlowToolbarProps {}

const FlowToolbar = (props: FlowToolbarProps) => {
  const { flowPropertiesDrawerDisclosure, componentDetailsDrawerDisclosure } =
    useFlow();

  return (
    <Toolbar
      width="100%"
      middleContent={
        <>
          <ToolbarButton
            icon={<SidebarIcon />}
            isActive={flowPropertiesDrawerDisclosure.isOpen}
            onClick={() => {
              flowPropertiesDrawerDisclosure.onToggle();
              if (componentDetailsDrawerDisclosure.isOpen) {
                componentDetailsDrawerDisclosure.onClose();
              }
            }}
            label={
              flowPropertiesDrawerDisclosure.isOpen
                ? "Close Flow Information"
                : "Open Flow Information"
            }
          />
          <FullScreenToggleButton />
        </>
      }
    />
  );
};

export default FlowToolbar;
