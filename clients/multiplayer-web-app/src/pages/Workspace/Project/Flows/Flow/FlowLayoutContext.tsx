import { FlexProps, Grid } from "@chakra-ui/react";
import { createContext, useContext, useRef, useState, useEffect } from "react";

interface IFlowLayoutConfig {}

interface IFlowLayoutContext {
  handleResize: (movementY: number) => void;
  mapWrapper: React.MutableRefObject<HTMLDivElement>;
  mapContainer: React.MutableRefObject<HTMLDivElement>;
  tracesWrapper: React.MutableRefObject<HTMLDivElement>;
  tracesContainer: React.MutableRefObject<HTMLDivElement>;
  collapsed: { player: boolean; details: boolean };

  configs: IFlowLayoutConfig;
  setConfigs: React.Dispatch<React.SetStateAction<IFlowLayoutConfig>>;
}

const FlowLayoutContext = createContext<IFlowLayoutContext | null>(null);

const defaultConfigs = {};
const localConfig = localStorage.getItem("flowLayoutConfigs");
const initialConfig = localConfig ? JSON.parse(localConfig) : defaultConfigs;

const FlowLayoutProvider = ({ children, ...rest }: FlexProps) => {
  const resizerWrapper = useRef<HTMLDivElement>();
  const mapWrapper = useRef<HTMLDivElement>();
  const mapContainer = useRef<HTMLDivElement>();
  const tracesWrapper = useRef<HTMLDivElement>();
  const tracesContainer = useRef<HTMLDivElement>();

  const [collapsed, setCollapsed] = useState({ player: false, details: false });
  const [configs, setConfigs] = useState<IFlowLayoutConfig>(initialConfig);

  const isResized = useRef(false);

  const handleResize = (movementY) => {
    const pw = mapWrapper.current;
    const pc = mapContainer.current;
    const dc = tracesContainer.current;
    const resizer = resizerWrapper.current;

    if (pc && dc) {
      const pcH = pc.offsetHeight + movementY;
      const dcH = dc.offsetHeight - movementY;
      const pwH = pw.offsetHeight + movementY;

      if (pcH >= 0 && dcH >= 1) {
        isResized.current = true;
        resizer.style.gridTemplateRows = `${pwH}px auto 1fr`;
      }
    }
  };

  useEffect(() => {
    localStorage.setItem("flowLayoutConfigs", JSON.stringify(configs));
  }, [configs]);

  return (
    <FlowLayoutContext.Provider
      value={{
        mapContainer,
        tracesContainer,
        tracesWrapper,
        mapWrapper,
        collapsed,
        configs,
        setConfigs,
        handleResize,
      }}
    >
      <Grid
        p="4"
        minH="0"
        flex="1"
        gridTemplateRows="1fr auto 1fr"
        {...rest}
        ref={resizerWrapper}
      >
        {children}
      </Grid>
    </FlowLayoutContext.Provider>
  );
};

export function useFlowLayout() {
  const context = useContext(FlowLayoutContext);
  if (context === null) {
    throw new Error("useFlowLayout must be used within FlowLayoutProvider");
  }
  return context;
}

export { FlowLayoutProvider };
