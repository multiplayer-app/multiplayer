import { useFlows } from "shared/providers/FlowsContext";

import Flow from "./Flow";
import FlowsIntro from "./FlowsIntro";

const Flows = () => {
  return <FlowsContent />;
};

const FlowsContent = () => {
  const { integrations } = useFlows();
  return !integrations ? <FlowsIntro /> : <Flow />;
};

export default Flows;
