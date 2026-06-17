import { IFlow } from "@multiplayer/types";
import { DiagramEvents, FlowDiagramView, useFlowDiagram } from "../PixiDiagram";
import { useEffect } from "react";

interface FlowEditorProps {
  data: IFlow;
  onNodeClick?: (arg: any) => void;
}

const FlowEditor = ({ data, onNodeClick }: FlowEditorProps) => {
  const { instance } = useFlowDiagram(data);

  useEffect(() => {
    if (!onNodeClick) return;
    instance.on(DiagramEvents.open_node, onNodeClick);
    return () => {
      instance.off(DiagramEvents.open_node, onNodeClick);
    };
  }, [onNodeClick, instance]);

  return <FlowDiagramView editor={instance} />;
};

export default FlowEditor;
