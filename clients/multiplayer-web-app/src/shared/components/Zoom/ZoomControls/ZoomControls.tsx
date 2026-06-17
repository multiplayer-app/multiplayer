import {
  Flex,
  IconButton,
  Menu,
  MenuButton,
  Button,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { ZoomOutIcon, ZoomInIcon } from "shared/icons";
import { useZoom } from "shared/providers/ZoomContext";

const ZoomControls = () => {
  const { position, zoomOut, zoomIn, zoomToFit, setZoom, resetZoom } =
    useZoom();

  return (
    <Flex
      gap="0"
      right="4"
      bg="bg.primary"
      bottom="4"
      zIndex="10"
      borderRadius="xl"
      border="1px solid"
      position="absolute"
      borderColor="border.secondary"
      boxShadow="md"
      onDoubleClickCapture={(e) => {
        e.preventDefault();
      }}
      onMouseDownCapture={(e) => {
        e.preventDefault();
      }}
      onTouchStartCapture={(e) => {
        e.stopPropagation();
      }}
    >
      <IconButton
        border="0"
        px="3"
        variant="base"
        onClick={zoomOut}
        borderEndRadius="0"
        aria-label="zoomOut"
        borderStartRadius="xl"
        icon={<ZoomOutIcon />}
      />

      <Menu>
        <MenuButton
          as={Button}
          px="0"
          w="44px"
          border="0"
          variant="base"
          borderRadius="0"
          textAlign="center"
        >
          {Math.round(position.scale * 100)}%
        </MenuButton>
        <MenuList minW="auto">
          {zoomOptions.map((z) => (
            <MenuItem key={z} onClick={() => setZoom(z)}>
              {z * 100}%
            </MenuItem>
          ))}
          <MenuItem onClick={() => resetZoom()}>Reset</MenuItem>
          <MenuItem onClick={() => zoomToFit()}>Zoom to fit</MenuItem>
        </MenuList>
      </Menu>

      <IconButton
        border="0"
        px="3"
        variant="base"
        onClick={zoomIn}
        aria-label="zoomIn"
        borderStartRadius="0"
        icon={<ZoomInIcon />}
      />
    </Flex>
  );
};
const zoomOptions = [2, 1.5, 1, 0.75, 0.5, 0.25];
export default ZoomControls;
