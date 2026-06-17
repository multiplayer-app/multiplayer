import { ArrowsCollapseIcon, ArrowsExpandIcon } from "shared/icons";
import { useFullScreenContext } from "shared/providers/FullScreenContext";
import { ToolbarButton } from "../Toolbar";

interface FullScreenToggleButtonProps {}

const FullScreenToggleButton = (props: FullScreenToggleButtonProps) => {
  const { isFullscreen, toggleFullscreen } = useFullScreenContext();

  return (
    <ToolbarButton
      icon={isFullscreen ? <ArrowsCollapseIcon /> : <ArrowsExpandIcon />}
      onClick={toggleFullscreen}
      isActive={isFullscreen}
      label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    />
  );
};

export default FullScreenToggleButton;
