import { OtelDbSystemAliases } from "@multiplayer/types";
import { ITraceNode } from "pages/Workspace/Project/Debugger/DebugSession/types";

export const getTraceResource = (trace: ITraceNode): { iconUrl: string, resource: string, key: string } => {
  const { ServiceName, SpanAttributes, ResourceAttributes } = trace;
  const dbSystem = SpanAttributes?.["db.system"];

  let resource: string | null = null;

  if (dbSystem && dbSystem in OtelDbSystemAliases) {
    const alias = OtelDbSystemAliases[dbSystem];
    if (alias === null) {
      // If alias is null, ignore the resource
      return { iconUrl: null, resource: null, key: null };
    }
    // Use the alias if it exists and is not null
    resource = alias;
  } else if (dbSystem) {
    // Use dbSystem if it exists but is not in aliases
    resource = dbSystem;
  } else {
    // Fallback to ServiceName
    resource = ServiceName;
  }

  const key = dbSystem || ResourceAttributes?.["telemetry.sdk.language"] || ResourceAttributes?.["process.runtime.name"]

  return {
    key,
    resource,
    iconUrl: key
      ? `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${key}/${key}-original.svg`
      : null,
  };
};