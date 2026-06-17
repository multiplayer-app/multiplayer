import { useState, useRef, useCallback } from "react";
import { EntityCategories, SortingDirection } from "shared/models/enums";
import { ITableSorting } from "shared/models/interfaces";

// In-memory state management
const entityDashboardState = new Map<
  string,
  {
    filters: {
      query: string;
      tags: string[];
      sorting: ITableSorting;
    };
    scrollTop: number;
  }
>();

const initialFilters = {
  query: "",
  tags: [] as string[],
  sorting: { key: "key", direction: SortingDirection.ASC },
};

export const useEntityDashboardState = (category: EntityCategories) => {
  const savedState = entityDashboardState.get(category);
  const scrollTopRef = useRef<number>(savedState?.scrollTop || 0);
  const [filters, setFilters] = useState(savedState?.filters || initialFilters);

  const updateFilters = useCallback(
    (newFilters: typeof filters) => {
      setFilters(newFilters);
      entityDashboardState.set(category, {
        filters: newFilters,
        scrollTop: scrollTopRef.current,
      });
    },
    [category]
  );

  const updateScrollTop = useCallback(
    (newScrollTop: number) => {
      scrollTopRef.current = newScrollTop;
      entityDashboardState.set(category, {
        filters,
        scrollTop: newScrollTop,
      });
    },
    [category, filters]
  );

  return {
    filters,
    setFilters: updateFilters,
    scrollTop: scrollTopRef.current,
    setScrollTop: updateScrollTop,
  };
};
