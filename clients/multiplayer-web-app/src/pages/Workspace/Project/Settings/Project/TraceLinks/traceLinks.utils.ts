import { ITraceLink, TraceLinkType } from "@multiplayer/types";
import { DEFAULT_LOKI_TRACE_QUERY } from "@multiplayer/util-shared";

export const MAX_TRACE_LINKS = 10;

export const TRACE_LINK_TYPE_LABELS: Record<TraceLinkType, string> = {
  [TraceLinkType.GRAFANA_TEMPO]: "Grafana Tempo (trace)",
  [TraceLinkType.GRAFANA_LOKI]: "Grafana Loki (logs)",
  [TraceLinkType.CUSTOM]: "Custom URL",
};

export const DEFAULT_TRACE_LINK_NAMES: Record<TraceLinkType, string> = {
  [TraceLinkType.GRAFANA_TEMPO]: "Trace in Grafana",
  [TraceLinkType.GRAFANA_LOKI]: "Logs in Grafana",
  [TraceLinkType.CUSTOM]: "Open trace",
};

// The form keeps every field as typed text, whatever the type
export type TraceLinkDraft = {
  _id?: string;
  type: TraceLinkType;
  name: string;
  // none means all environments
  environments: string[];
  url: string;
  datasourceUid: string;
  orgId: string;
  query: string;
  urlTemplate: string;
};

export const toTraceLinkDraft = (link?: ITraceLink): TraceLinkDraft => ({
  _id: link?._id,
  type: link?.type || TraceLinkType.GRAFANA_TEMPO,
  name: link?.name ?? DEFAULT_TRACE_LINK_NAMES[TraceLinkType.GRAFANA_TEMPO],
  environments: link?.environments || [],
  url: link?.url || "",
  datasourceUid: link?.datasourceUid || "",
  orgId: link?.orgId ? String(link.orgId) : "",
  query: link?.query || DEFAULT_LOKI_TRACE_QUERY,
  urlTemplate: link?.urlTemplate || "",
});

// Trimmed, without duplicates (whatever their case)
const normalizeEnvironments = (names: string[]) => {
  const environments = names.map((name) => name.trim()).filter(Boolean);
  return environments.filter(
    (name, index) =>
      environments.findIndex(
        (other) => other.toLowerCase() === name.toLowerCase()
      ) === index
  );
};

// Only the fields of the link's type, trimmed
export const toTraceLink = (draft: TraceLinkDraft): ITraceLink => {
  const base = {
    ...(draft._id && { _id: draft._id }),
    type: draft.type,
    name: draft.name.trim(),
    environments: normalizeEnvironments(draft.environments),
  };

  if (draft.type === TraceLinkType.CUSTOM) {
    return { ...base, urlTemplate: draft.urlTemplate.trim() };
  }

  const orgId = Number(draft.orgId);

  return {
    ...base,
    url: draft.url.trim(),
    datasourceUid: draft.datasourceUid.trim(),
    ...(Number.isInteger(orgId) && orgId > 0 && { orgId }),
    ...(draft.type === TraceLinkType.GRAFANA_LOKI && {
      query: draft.query.trim() || DEFAULT_LOKI_TRACE_QUERY,
    }),
  };
};

export const describeTraceLinkEnvironments = (link: ITraceLink) =>
  link.environments?.length
    ? link.environments.join(", ")
    : "All environments";

export const describeTraceLink = (link: ITraceLink) =>
  link.type === TraceLinkType.CUSTOM
    ? link.urlTemplate
    : `${link.url} · datasource ${link.datasourceUid}`;
