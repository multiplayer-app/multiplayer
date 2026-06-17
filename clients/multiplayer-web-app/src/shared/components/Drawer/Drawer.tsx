import {
  useState,
  useEffect,
  useContext,
  forwardRef,
  createContext,
  PropsWithChildren,
} from "react";
import {
  Box,
  BoxProps,
  FlexProps,
  keyframes,
  IconButton,
} from "@chakra-ui/react";

import ResizableBox from "shared/components/ResizableBox";
import { useFullScreenContext } from "shared/providers/FullScreenContext";
import { CloseIcon } from "shared/icons";
import { createPortal } from "react-dom";

export interface DrawerProps extends PropsWithChildren {
  isOpen: boolean;
  appendTo?: Element | DocumentFragment;
}

const Drawer = ({ isOpen, children, appendTo }: DrawerProps) => {
  const fsContext = useFullScreenContext();
  if (!isOpen) return null;
  const append = appendTo || fsContext?.containerRef.current || document.body;

  return createPortal(
    <DrawerProvider isOpen={isOpen} appendTo={appendTo}>
      {children}
    </DrawerProvider>,
    append
  );
};

export const DrawerOverlay = (props: BoxProps) => {
  return <Box position="fixed" inset="0" zIndex="99" {...props} />;
};

interface DrawerContentProps extends FlexProps {
  onClose?: () => void;
  offsetTop?: string;
  parentContainer?: Element;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
}

export const DrawerContent = forwardRef<any, DrawerContentProps>(
  (
    {
      onClose,
      children,
      offsetTop,
      parentContainer,
      width = 450,
      minWidth = 450,
      maxWidth = 900,
      ...rest
    }: DrawerContentProps,
    ref
  ) => {
    const { isOpen } = useDrawer();
    const fullScreen = useFullScreenContext();
    const parent = parentContainer || fullScreen?.contentContainerRef.current;

    const [offset, setOffset] = useState(
      offsetTop || `${parent?.getBoundingClientRect().top || 56}px`
    );

    useEffect(() => {
      let observer: ResizeObserver;
      if (parent && !offsetTop && isOpen && !observer) {
        setOffset(`${parent.getBoundingClientRect().top}px`);
        observer = new ResizeObserver(() => {
          setOffset(`${parent.getBoundingClientRect().top}px`);
        });
        observer.observe(parent);
      }
      return () => {
        observer?.disconnect();
      };
    }, [parent, offsetTop, isOpen]);

    const w = Math.min(width, window.innerWidth - 40);
    const minW = Math.min(minWidth, window.innerWidth - 40);
    const maxW = Math.min(maxWidth, window.innerWidth - 40);

    return (
      <Box
        ref={ref}
        bg="bg.primary"
        shadow="base"
        zIndex="100"
        position="fixed"
        borderLeft="1px solid"
        borderLeftColor="border.primary"
        inset={`${offset ? offset : "4rem"} 0 0 auto`}
        animation={animation}
        {...rest}
      >
        <ResizableBox
          h="full"
          w={w}
          minW={minW}
          maxW={maxW}
          display="flex"
          resizeDirection="left"
          flexDirection="column"
        >
          {onClose && (
            <IconButton
              position="absolute"
              aria-label="close"
              color="muted"
              variant="base"
              right="12px"
              top="16px"
              size="sm"
              icon={<CloseIcon />}
              zIndex={1}
              onClick={onClose}
            />
          )}
          {children}
        </ResizableBox>
      </Box>
    );
  }
);

const DrawerContext = createContext<DrawerProps>({
  isOpen: false,
  appendTo: document.body,
});

const DrawerProvider = ({ children, ...props }: DrawerProps) => {
  return (
    <DrawerContext.Provider value={props}>{children}</DrawerContext.Provider>
  );
};

export const useDrawer = () => {
  return useContext(DrawerContext);
};

const animationKeyframes = keyframes`
  0% { transform: translateX(100%);}
  100% { transform: translateX(0);}
`;
const animation = `${animationKeyframes} .3s ease-in-out`;
export default Drawer;
