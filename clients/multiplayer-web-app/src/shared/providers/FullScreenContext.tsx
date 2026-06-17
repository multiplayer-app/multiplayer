import { createContext, useContext, useRef } from "react";
import { Flex, FlexProps } from "@chakra-ui/react";
import { useFullScreen } from "shared/hooks/useFullscreen";

interface FullScreenProviderProps extends FlexProps {}
interface FullScreenContainerProps extends FlexProps {}
interface FullScreenContentContainerProps extends FlexProps {}

const FullScreenContext = createContext<{
  isFullscreen: boolean;
  containerRef: React.MutableRefObject<HTMLDivElement>;
  contentContainerRef: React.MutableRefObject<HTMLDivElement>;
  toggleFullscreen: () => void;
  fullscreenElement: Element;
}>(null);

export const FullScreenProvider = ({
  children,
  ...rest
}: FullScreenProviderProps) => {
  const containerRef = useRef();
  const contentContainerRef = useRef();
  const { isFullscreen, toggleFullscreen, fullscreenElement } = useFullScreen(
    containerRef?.current
  );

  return (
    <FullScreenContext.Provider
      value={{
        isFullscreen,
        fullscreenElement,
        containerRef: containerRef,
        contentContainerRef: contentContainerRef,
        toggleFullscreen: () => toggleFullscreen(containerRef.current),
      }}
    >
      <Flex ref={containerRef} bg="bg.primary" {...rest}>
        {children}
      </Flex>
    </FullScreenContext.Provider>
  );
};

export const FullScreenContainer = (props: FullScreenContainerProps) => {
  return <FullScreenProvider {...props} />;
};

export const FullScreenContentContainer = (
  props: FullScreenContentContainerProps
) => {
  const { contentContainerRef } = useFullScreenContext();
  return <Flex ref={contentContainerRef} {...props} />;
};

export function useFullScreenContext() {
  const context = useContext(FullScreenContext);
  // if (context === null) {
  //   throw new Error(
  //     "useFullScreenContext must be used within FullScreenProvider"
  //   );
  // }
  return context;
}
