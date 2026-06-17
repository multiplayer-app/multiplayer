import FlowMap from "./FlowMap";
import FlowToolbar from "./FlowToolbar";
import FlowViewsDrawer from "./FlowViewsDrawer";

import { FlowProvider, useFlow } from "./FlowContext";
import { FlowLayoutProvider } from "./FlowLayoutContext";

import { ComponentDetailsDrawer } from "shared/components/PlatformComponents";
import {
  FullScreenContentContainer,
  FullScreenProvider,
} from "shared/providers/FullScreenContext";
import FlowPropertiesDrawer from "./FlowPropertiesDrawer";

interface FlowProps {}

const Flow = (props: FlowProps) => {
  return (
    <FullScreenProvider direction="column" flex="1" minH="0">
      <FlowProvider>
        <FlowToolbar />
        <FullScreenContentContainer
          flex="1"
          minH="0"
          minW="0"
          position="relative"
        >
          <FlowViewsDrawer />
          <FlowLayoutProvider p="0" gridTemplateRows="1fr">
            <FlowMap />
            {/* <ResizeHandle />
            <FlowTraces /> */}
          </FlowLayoutProvider>
          <FlowComponents />
          <FlowProperties />
        </FullScreenContentContainer>
      </FlowProvider>
    </FullScreenProvider>
  );
};

const FlowProperties = ({}) => {
  const { flowPropertiesDrawerDisclosure } = useFlow();
  return flowPropertiesDrawerDisclosure.isOpen ? (
    <FlowPropertiesDrawer />
  ) : null;
};

const FlowComponents = ({}) => {
  const { componentDetailsDrawerDisclosure, activeComponent } = useFlow();
  return componentDetailsDrawerDisclosure.isOpen ? (
    <ComponentDetailsDrawer
      readonly
      preSelectedComponentId={activeComponent}
      onClose={componentDetailsDrawerDisclosure.onClose}
    />
  ) : null;
};

export default Flow;
