import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  PropsWithChildren,
} from "react";
import { useActiveTabState } from "shared/providers/TabsContext";
import { SessionPreviewMode } from "./types";
import { useVisibility } from "shared/components/Visibility";
import { usePanelChatOpen } from "shared/components/AgentChat";

interface IDebugSessionLayoutConfig {
  waterfall: boolean;
  isListView: boolean;
  tracesTimeline: boolean;
  tracesTimelinePinned: boolean;
  sessionPreviewMode: SessionPreviewMode;
  showTraces: boolean;
}
interface IDebugSessionTimeRange {
  start: number;
  end: number;
}
interface IDebugSessionLayoutContext {
  handleResize: (movementX: number, movementY: number) => void;
  resizerWrapper: React.MutableRefObject<HTMLDivElement>;
  playerWrapper: React.MutableRefObject<HTMLDivElement>;
  playerContainer: React.MutableRefObject<HTMLDivElement>;
  detailsWrapper: React.MutableRefObject<HTMLDivElement>;
  detailsContainer: React.MutableRefObject<HTMLDivElement>;
  timeRange: IDebugSessionTimeRange | null;
  configs: IDebugSessionLayoutConfig;
  setConfigs: React.Dispatch<React.SetStateAction<IDebugSessionLayoutConfig>>;
  setTimeRange: React.Dispatch<
    React.SetStateAction<IDebugSessionTimeRange | null>
  >;
}

const DebugSessionLayoutContext =
  createContext<IDebugSessionLayoutContext | null>(null);

const localConfig = JSON.parse(
  localStorage.getItem("debugSessionLayoutConfigs") || "{}"
);

const defaultConfigs = {
  waterfall: false,
  isListView: false,
  tracesTimeline: false,
  tracesTimelinePinned: false,
  sessionPreviewMode: SessionPreviewMode.Recording,
  showTraces: true,
};

const previewModeConfigs = {
  waterfall: false,
  isListView: true,
  tracesTimeline: false,
  tracesTimelinePinned: false,
  sessionPreviewMode: SessionPreviewMode.Recording,
  showTraces: true,
};

const initialConfig = { ...defaultConfigs, ...localConfig };

const resizerState = {
  gridTemplateRows: "1fr 16px 1fr",
  gridTemplateColumns: "1fr 16px 1fr",
};

const DebugSessionLayoutProvider = ({
  children,
  isPreviewMode,
}: PropsWithChildren<{ isPreviewMode?: boolean }>) => {
  const resizerWrapper = useRef<HTMLDivElement>();
  const playerWrapper = useRef<HTMLDivElement>();
  const playerContainer = useRef<HTMLDivElement>();
  const detailsWrapper = useRef<HTMLDivElement>();
  const detailsContainer = useRef<HTMLDivElement>();
  const [timeRange, setTimeRange] = useState(null);
  const isAgentChatOpen = usePanelChatOpen();
  const [configs, setActiveTabState] =
    useActiveTabState<IDebugSessionLayoutConfig>(initialConfig);
  const isMobile = useVisibility({ base: true, md: false });

  const layoutConfig =
    isPreviewMode || isMobile || isAgentChatOpen ? previewModeConfigs : configs;

  const handleResize = (movementX: number, movementY: number) => {
    const pw = playerWrapper.current;
    const pc = playerContainer.current;
    const dc = detailsContainer.current;
    const resizer = resizerWrapper.current;

    if (!pc || !dc) {
      return;
    }

    if (layoutConfig.isListView) {
      const pcH = pc.offsetHeight + movementY;
      const dcH = dc?.offsetHeight - movementY;
      const pwH = pw.offsetHeight + movementY;

      if (pcH >= 0 && dcH >= 1) {
        resizer.style.gridTemplateRows = `${pwH}px auto 1fr`;
        resizerState.gridTemplateRows = `${pwH}px auto 1fr`;
      }
    } else {
      const dcW = dc?.offsetWidth - movementX;
      const pwW = pw.offsetWidth + movementX;

      if (pwW >= 0 && dcW >= 1) {
        resizer.style.gridTemplateColumns = `${pwW}px auto 1fr`;
        resizerState.gridTemplateColumns = `${pwW}px auto 1fr`;
      }
    }
  };

  useEffect(() => {
    if (isPreviewMode) {
      return;
    }
    try {
      localStorage.setItem(
        "debugSessionLayoutConfigs",
        JSON.stringify(configs)
      );
    } catch (error) {
      console.error(error);
    }
  }, [configs, isPreviewMode]);

  const getGridStyles = useCallback(() => {
    if (!layoutConfig.showTraces) {
      return {
        gridTemplateColumns: "unset !important",
        gridTemplateRows: "unset !important",
      };
    }

    if (layoutConfig.isListView) {
      return {
        gridTemplateRows:
          layoutConfig.sessionPreviewMode !== SessionPreviewMode.None
            ? resizerState.gridTemplateRows
            : "1fr",
        gridTemplateColumns: "unset !important",
      };
    } else {
      return {
        gridTemplateRows: "unset !important",
        gridTemplateColumns:
          layoutConfig.sessionPreviewMode !== SessionPreviewMode.None
            ? resizerState.gridTemplateColumns
            : "1fr",
      };
    }
  }, [
    layoutConfig.isListView,
    layoutConfig.sessionPreviewMode,
    layoutConfig.showTraces,
  ]);

  useEffect(() => {
    if (resizerWrapper.current) {
      const styles = getGridStyles();
      resizerWrapper.current.style.gridTemplateRows = styles.gridTemplateRows;
      resizerWrapper.current.style.gridTemplateColumns =
        styles.gridTemplateColumns;
    }
  }, [getGridStyles]);

  return (
    <DebugSessionLayoutContext.Provider
      value={{
        resizerWrapper,
        playerContainer,
        detailsContainer,
        detailsWrapper,
        playerWrapper,
        configs: layoutConfig,
        timeRange,
        setConfigs: setActiveTabState,
        setTimeRange,
        handleResize,
      }}
    >
      {children}
    </DebugSessionLayoutContext.Provider>
  );
};

export function useDebugSessionLayout() {
  const context = useContext(DebugSessionLayoutContext);
  if (context === null) {
    throw new Error(
      "useDebugSessionLayout must be used within DebugSessionLayoutProvider"
    );
  }
  return context;
}

export { DebugSessionLayoutProvider };
