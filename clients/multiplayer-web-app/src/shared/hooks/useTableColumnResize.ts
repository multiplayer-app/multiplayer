import { useRef } from "react";

interface Column {
  id: any;
  width?: number;
  minWidth?: number;
  [key: string]: any;
}

interface UseResizeColumnsProps {
  columns: Column[];
  tableName: string;
  defaultMinWidth: number;
  getColumnId?: (col: Column) => string;
}

interface UseResizeColumnsResult {
  headerRef: React.MutableRefObject<any>;
  onPointerDown: (e: React.PointerEvent, columnIndex: number) => void;
}

const useTableColumnResize = ({
  columns,
  tableName,
  defaultMinWidth,
  getColumnId = (col) => `th_${col.id}`,
}: UseResizeColumnsProps): UseResizeColumnsResult => {
  const headerRef = useRef<HTMLElement | null>(null);

  const adjustCols = (
    targetIndex,
    nextIndex,
    deltaXT,
    deltaXN,
    initialWidths
  ) => {
    if (targetIndex < 0 || nextIndex >= columns.length) {
      return;
    }

    const target = columns[targetIndex];
    const next = columns[nextIndex];

    const nextCol = document.getElementById(`th_${next?.id}`);
    const targetCol = document.getElementById(`th_${target?.id}`);

    if (!nextCol || !targetCol) return; // DOM elements not found

    const totalWidth = headerRef.current.offsetWidth;

    const nextW = initialWidths[nextIndex] - deltaXN;
    const targetW = initialWidths[targetIndex] + deltaXT;

    const nextMinW = next?.minWidth || defaultMinWidth;
    const targetMinW = target?.minWidth || defaultMinWidth;

    if (nextW >= nextMinW && targetW >= targetMinW) {
      const nextPercent = (nextW / totalWidth) * 100;
      const targetPercent = (targetW / totalWidth) * 100;
      nextCol.style.width = `${nextPercent.toFixed(2)}%`;
      targetCol.style.width = `${targetPercent.toFixed(2)}%`;
    } else {
      if (nextW < nextMinW) {
        const newDeltaX = deltaXN - (initialWidths[nextIndex] - nextMinW);

        adjustCols(
          targetIndex,
          nextIndex + 1,
          deltaXT,
          newDeltaX,
          initialWidths
        );
      }
      if (targetW < targetMinW) {
        const newDeltaX = deltaXT + (initialWidths[targetIndex] - targetMinW);
        adjustCols(
          targetIndex - 1,
          nextIndex,
          newDeltaX,
          deltaXN,
          initialWidths
        );
      }
    }
  };

  const onPointerDown = (e: React.PointerEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    document.body.style.cursor = "col-resize";
    headerRef.current.style.pointerEvents = "none";

    const startResizeX = e.clientX;
    const totalWidth = headerRef.current.offsetWidth;

    const initialWidths = Array.from(headerRef.current.children).map(
      (cell: HTMLElement) => cell.offsetWidth
    );

    const pointermove = (e) => {
      const deltaX = e.clientX - startResizeX;
      adjustCols(targetIndex, targetIndex + 1, deltaX, deltaX, initialWidths);
    };

    const pointerup = (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.body.style.cursor = "default";
      headerRef.current.style.pointerEvents = null;

      document.removeEventListener("pointerup", pointerup);
      document.removeEventListener("pointermove", pointermove);

      // Apply final widths as percentages
      Array.from(headerRef.current.children).forEach(
        (cell: HTMLElement, index) => {
          const minW = columns[index]?.minWidth || 0;
          const percent = (cell.offsetWidth / totalWidth) * 100;
          cell.style.width = minW
            ? `minmax(${minW}px, ${percent.toFixed(2)}%)`
            : `${percent.toFixed(2)}%`;

          setSizeInLocalStorage(cell.id, cell.style.width || "");
        }
      );
    };

    document.addEventListener("pointerup", pointerup);
    document.addEventListener("pointermove", pointermove);
  };

  const setSizeInLocalStorage = (id: string, value: string) => {
    const cachedSize =
      JSON.parse(localStorage.getItem(`${tableName}Sizes`)) || {};
    cachedSize[id] = value;
    localStorage.setItem(`${tableName}Sizes`, JSON.stringify(cachedSize));
  };

  return {
    onPointerDown,
    headerRef,
  };
};

export default useTableColumnResize;
