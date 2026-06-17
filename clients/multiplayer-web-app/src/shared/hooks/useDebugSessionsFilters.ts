import { useState } from "react";
import { DebugSessionCreationReasonType } from "@multiplayer/types";
import { SessionType } from "@multiplayer-app/session-recorder-react";
import { SortingDirection, SortingDirectionMap } from "shared/models/enums";
import { MultipSelectOption } from "shared/models/interfaces";

/** UI sort key → API sort key. Backend uses different names for some fields. */
const SORT_KEY_TO_API: Partial<Record<string, string>> = {
  sessionType: "continuousDebugSession",
};

export interface IDebugSessionsFilters {
  query: string;
  live?: boolean;
  tags?: string[];
  starred?: boolean;
  sessionType?: SessionType | null;
  creationReason?: MultipSelectOption[];
  device?: string;
  params: { skip: number; limit: number };
  sorting: { key: string; direction: SortingDirection };
}

/** API params produced by getCombinedFilters (query/body for debug sessions list and bulk ops). */
export interface DebugSessionsApiParams {
  skip?: number;
  limit?: number;
  sortKey?: string;
  sortDirection?: string;
  tags?: string[];
  name?: string;
  starred?: boolean;
  creationReason?: DebugSessionCreationReasonType | DebugSessionCreationReasonType[];
  "resourceAttributes.deviceInfo"?: string;
  live?: boolean;
  fromContinuousDebugSession?: boolean;
}

export type UseDebugSessionsFiltersReturnType = {
  filters: IDebugSessionsFilters;
  setFilters: React.Dispatch<React.SetStateAction<IDebugSessionsFilters>>;
  hasFilters: boolean;
  setHasFilters: React.Dispatch<React.SetStateAction<boolean>>;
};

export const useDebugSessionsFilters =
  (): UseDebugSessionsFiltersReturnType => {
    const [filters, setFilters] = useState<IDebugSessionsFilters>({
      query: "",
      tags: [],
      // live: true,
      starred: false,
      creationReason: [],
      sessionType: null,
      sorting: { key: "createdAt", direction: SortingDirection.DESC },
      params: { skip: 0, limit: 20 },
    });
    const [hasFilters, setHasFilters] = useState(false);

    return { filters, setFilters, hasFilters, setHasFilters };
  };

export function checkFilters(filters: IDebugSessionsFilters): boolean {
  return Boolean(
    filters.query?.trim() ||
      (filters.tags?.length ?? 0) > 0 ||
      filters.starred ||
      (filters.creationReason?.length ?? 0) > 0 ||
      filters.sessionType != null ||
      filters.device?.trim()
  );
}

/**
 * Builds API params from UI filters. Used for list (with pagination/sort) and bulk ops (without).
 * Only includes a key when the filter is meaningfully set; avoids sending empty arrays or redundant defaults.
 */
export function getCombinedFilters(
  filters: IDebugSessionsFilters,
  includePagination = true
): DebugSessionsApiParams {
  const {
    tags,
    live,
    device,
    sorting,
    starred,
    params,
    query: name,
    sessionType,
    creationReason,
  } = filters;

  const result: DebugSessionsApiParams = {};

  if (includePagination) {
    result.skip = params.skip;
    result.limit = params.limit;
    if (sorting) {
      result.sortKey = SORT_KEY_TO_API[sorting.key] ?? sorting.key;
      result.sortDirection = SortingDirectionMap[sorting.direction];
    }
  }

  if (tags?.length) {
    result.tags = tags;
  }
  if (name.trim()) {
    result.name = name.trim();
  }
  if (starred) {
    result.starred = true;
  }
  if (creationReason?.length) {
    const selected = creationReason
      .map((o) => o.value)
      .filter(Boolean) as DebugSessionCreationReasonType[];
    if (selected.length === 1) {
      result.creationReason = selected[0];
    } else if (selected.length > 1) {
      result.creationReason = selected;
    }
  }
  if (device?.trim()) {
    result["resourceAttributes.deviceInfo"] = device.trim();
  }
  if (live !== undefined) {
    result.live = Boolean(live);
  }
  if (sessionType != null) {
    result.fromContinuousDebugSession = sessionType === SessionType.CONTINUOUS;
  }

  return result;
}
