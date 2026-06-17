import FlowDiagram from "shared/components/Editors/FlowEditor";
import { useFlow } from "../FlowContext";

interface FlowMapProps {}

const FlowMap = ({}: FlowMapProps) => {
  const { flow, openComponentDetails } = useFlow();

  return (
    <FlowDiagram key={flow.id} data={flow} onNodeClick={openComponentDetails} />
  );
};

export default FlowMap;
