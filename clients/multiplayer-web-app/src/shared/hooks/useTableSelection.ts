import { useCallback, useMemo, useState } from "react";

interface UseTableSelectionProps<T> {
  data: T[];
  getId?: (item: T, index: number) => string;
}

interface UseTableSelectionReturn {
  selectedRows: Record<string, boolean>;
  setSelectedRows: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  isAllSelected: boolean;
  setIsAllSelected: React.Dispatch<React.SetStateAction<boolean>>;
  selectedIds: string[];
  selectedItemsCount: number;
  onAllRowsSelect: (isSelected: boolean) => void;
  resetSelection: () => void;
}

const useTableSelection = <T>({
  data,
  getId = (item, index) => (item as any)?._id || index.toString(),
}: UseTableSelectionProps<T>): UseTableSelectionReturn => {
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

  const selectedIds = useMemo(() => {
    return Object.keys(selectedRows)
      .filter((k) => !!selectedRows[k])
      .map((index) => {
        return getId(data[parseInt(index)], parseInt(index));
      });
  }, [data, selectedRows, getId]);

  const selectedItemsCount = selectedIds.length;

  const onAllRowsSelect = useCallback(
    (isSelected: boolean) => {
      setIsAllSelected(isSelected);
      const selection = isSelected
        ? Object.fromEntries(data.map((_, index) => [index, true]))
        : {};
      setSelectedRows(selection);
    },
    [data]
  );


  const resetSelection = useCallback(() => {
    setSelectedRows({});
    setIsAllSelected(false);
  }, []);

  return {
    selectedRows,
    setSelectedRows,
    isAllSelected,
    setIsAllSelected,
    selectedIds,
    selectedItemsCount,
    onAllRowsSelect,
    resetSelection,
  };
};

export default useTableSelection;
