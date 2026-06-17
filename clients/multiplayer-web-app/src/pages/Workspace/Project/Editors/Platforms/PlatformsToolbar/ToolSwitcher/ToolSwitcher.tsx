import SwitchButtons from "shared/components/SwitchButtons";
import { CursorClickColorIcon, HandIcon } from "shared/icons";
import {
  ToolType,
  PlatformDiagram,
  DiagramEvents,
} from "shared/components/Editors/PixiDiagram";
import { useEffect, useState } from "react";

interface ToolSwitcherProps {
  editor: PlatformDiagram;
}

const DEFAULT_TOOL = ToolType.SELECT;

const ToolSwitcher = ({ editor }: ToolSwitcherProps) => {
  const [currentTool, setCurrentTool] = useState<ToolType>(DEFAULT_TOOL);

  const handleToolChange = (tool: ToolType) => {
    setCurrentTool(tool);

    editor.setCurrentTool(tool);
    editor.focus();
  };

  useEffect(() => {
    editor.setCurrentTool(DEFAULT_TOOL);
  }, [editor]);

  useEffect(() => {
    editor.on(DiagramEvents.tool_change, (tool: ToolType) => {
      setCurrentTool(tool);
    });
  }, [editor]);

  const toolOptions = [
    {
      tooltip: "Hand tool",
      command: "H",
      icon: HandIcon,
      value: ToolType.HAND,
    },
    {
      tooltip: "Select tool",
      command: "V",
      icon: CursorClickColorIcon,
      value: ToolType.SELECT,
    },
  ];

  return (
    <SwitchButtons
      value={currentTool}
      options={toolOptions}
      onChange={handleToolChange}
      hideLabel={true}
      size="md"
    />
  );
};

export default ToolSwitcher;
