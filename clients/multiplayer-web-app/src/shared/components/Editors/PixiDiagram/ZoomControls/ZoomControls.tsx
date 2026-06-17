import { useEffect, useRef } from "react";
import {
  Menu,
  Flex,
  Button,
  Portal,
  MenuList,
  MenuItem,
  MenuButton,
  IconButton,
} from "@chakra-ui/react";

import { getNestedProperty } from "shared/utils";
import Viewport from "../Editor/components/Viewport";
import { ZoomOutIcon, ZoomInIcon } from "shared/icons";
import { DiagramEvents, ViewportState } from "../Editor/types";

interface ZoomControlsProps {
  viewport: Viewport;
  viewportState: ViewportState;
  onChange: (s: ViewportState) => void;
}

const ZoomControls = ({
  onChange,
  viewport,
  viewportState,
}: ZoomControlsProps) => {
  const timeout = useRef<null | ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!viewport) return;
    const onStateChange = (event) => {
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => {
        const defaultVal = { x: 0, y: 0, scaleX: 1 };
        const {
          x,
          y,
          scaleX: scale,
        } = getNestedProperty(event, ["viewport", "lastViewport"], defaultVal);
        onChange({ x, y, scale, isDefault: false });
      }, 300);
    };

    viewport.container.on(DiagramEvents.moved, onStateChange);
    return () => {
      viewport.container.off(DiagramEvents.moved, onStateChange);
    };
  }, []);

  return (
    <Flex
      gap="0"
      left="4"
      bg="bg.primary"
      bottom="4"
      zIndex="10"
      borderRadius="3xl"
      border="1px solid"
      position="absolute"
      borderColor="border.primary"
      boxShadow="sm"
    >
      <IconButton
        border="0"
        px="3"
        variant="base"
        onClick={viewport.zoomOut}
        borderEndRadius="0"
        aria-label="zoomOut"
        borderStartRadius="xl"
        icon={<ZoomOutIcon />}
      />

      <Menu placement="top-end">
        <MenuButton
          as={Button}
          px="0"
          w="44px"
          border="0"
          variant="base"
          borderRadius="0"
          textAlign="center"
        >
          {Math.round(viewportState.scale * 100)}%
        </MenuButton>
        <Portal>
          <MenuList minW="auto">
            {zoomOptions.map((z) => (
              <MenuItem key={z} onClick={() => viewport.setZoom(z)}>
                {z * 100}%
              </MenuItem>
            ))}
            <MenuItem onClick={() => viewport.resetZoom()}>Reset</MenuItem>
            <MenuItem onClick={viewport.zoomToFit}>Zoom to fit</MenuItem>
          </MenuList>
        </Portal>
      </Menu>
      <IconButton
        border="0"
        px="3"
        variant="base"
        onClick={viewport.zoomIn}
        aria-label="zoomIn"
        borderStartRadius="0"
        icon={<ZoomInIcon />}
      />
    </Flex>
  );
};

const zoomOptions = [2, 1.5, 1, 0.75, 0.5, 0.25];

export default ZoomControls;
