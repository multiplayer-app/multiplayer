import { ToolCard } from "./common";
import type { ToolRendererComponent } from "./common";

export const ToolSearchRenderer: ToolRendererComponent = ({ call }) => {
  const query = (call.input?.query as string) ?? "";

  return <ToolCard status={call.status} kindLabel="ToolSearch" name={query} />;
};
