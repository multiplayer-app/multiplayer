import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ISSUE_HASH_KEY } from "shared/configs/issues.configs";
import {
  IssueRateChartPeriod,
  MetricsGranularity,
  SortingDirection,
  SortingDirectionMap,
} from "shared/models/enums";
import { IGetIssuesReqParams, IIssuesFilters } from "shared/models/interfaces";

export interface UseIssuesFiltersReturnType {
  filters: IIssuesFilters;
  setFilters: React.Dispatch<React.SetStateAction<IIssuesFilters>>;
  hasFilters: boolean;
  setHasFilters: React.Dispatch<React.SetStateAction<boolean>>;
}

const DEFAULT_PAGE_SIZE = 20;

const parsePageParams = (searchParams: URLSearchParams) => {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize =
    parseInt(searchParams.get("pageSize") || "", 10) || DEFAULT_PAGE_SIZE;
  return { skip: (page - 1) * pageSize, limit: pageSize };
};

export const useIssuesFilters = (): UseIssuesFiltersReturnType => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPageParams = parsePageParams(searchParams);

  const [filters, setFilters] = useState<IIssuesFilters>({
    skip: initialPageParams.skip,
    limit: initialPageParams.limit,
    sorting: { key: "lastSeen", direction: SortingDirection.DESC },
    resolved: undefined,
    archived: undefined,
    title: "",
    text: "",
    period: IssueRateChartPeriod.DAY_7,
    severity: undefined,
    lastSeen: undefined,
  });
  const [hasFilters, setHasFilters] = useState(false);

  const setSearchParamsRef = useRef(setSearchParams);
  setSearchParamsRef.current = setSearchParams;

  useEffect(() => {
    const page = Math.floor(filters.skip / filters.limit) + 1;
    setSearchParamsRef.current(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (page > 1) {
          next.set("page", String(page));
        } else {
          next.delete("page");
        }
        if (filters.limit !== DEFAULT_PAGE_SIZE) {
          next.set("pageSize", String(filters.limit));
        } else {
          next.delete("pageSize");
        }
        return next;
      },
      { replace: true }
    );
  }, [filters.skip, filters.limit]);

  return { filters, setFilters, hasFilters, setHasFilters };
};

export const checkIssuesFilters = (filters: IIssuesFilters) => {
  return Boolean(
    filters.title ||
      filters.text ||
      filters.resolved !== undefined ||
      filters.archived !== undefined ||
      filters.severity !== undefined ||
      filters.lastSeen?.gte ||
      filters.lastSeen?.lte
  );
};

export const getCombinedIssuesFilters = (
  filters: IIssuesFilters,
  exclude?: string[]
): IGetIssuesReqParams => {
  const {
    sorting,
    skip,
    limit,
    title,
    text,
    resolved,
    archived,
    severity,
    lastSeen,
    period,
  } = filters;
  const params = {
    skip,
    limit,
    ...(sorting && {
      sortKey: sorting.key,
      sortDirection: SortingDirectionMap[sorting.direction],
    }),
    ...(title && { title }),
    ...(text && { text }),
    ...(resolved !== undefined && { resolved }),
    ...(archived !== undefined && { archived }),
    ...(severity !== undefined && { severity }),
    ...(lastSeen?.gte && { "lastSeen.gte": lastSeen.gte }),
    ...(lastSeen?.lte && { "lastSeen.lte": lastSeen.lte }),
    ...(MetricsGranularityMap[period] && {
      "metrics.to": MetricsGranularityMap[period].to(),
      "metrics.from": MetricsGranularityMap[period].from(),
      "metrics.granularity": MetricsGranularityMap[period].granularity,
    }),
    ...(filters["service.serviceNameSlug"] && {
      "service.serviceNameSlug": filters["service.serviceNameSlug"],
    }),
    ...(filters["service.environmentSlug"] && {
      "service.environmentSlug": filters["service.environmentSlug"],
    }),
    groupBy: ISSUE_HASH_KEY,
  };
  if (exclude?.length) {
    exclude.forEach((key) => {
      delete params[key];
    });
  }
  return params;
};

export const MetricsGranularityMap = {
  [IssueRateChartPeriod.HOUR_24]: {
    from: () =>
      new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString(),
    to: () => new Date().toISOString(),
    granularity: MetricsGranularity.HOUR,
  },
  [IssueRateChartPeriod.DAY_7]: {
    from: () =>
      new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    to: () => new Date().toISOString(),
    granularity: MetricsGranularity.DAY,
  },
  [IssueRateChartPeriod.DAY_30]: {
    from: () =>
      new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    to: () => new Date().toISOString(),
    granularity: MetricsGranularity.DAY,
  },
  [IssueRateChartPeriod.DAY_90]: {
    from: () =>
      new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    to: () => new Date().toISOString(),
    granularity: MetricsGranularity.DAY,
  },
};
