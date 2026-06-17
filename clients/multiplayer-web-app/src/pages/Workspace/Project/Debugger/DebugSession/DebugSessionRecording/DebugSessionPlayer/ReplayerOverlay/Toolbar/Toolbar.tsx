import { ToolbarButton } from "shared/components/Toolbar";
import { useEffect, useRef, useState } from "react";
import { ToolType } from "@excalidraw/excalidraw/types/types";
import {
  HStack,
  Box,
  Icon,
  Divider,
  Flex,
  Menu,
  MenuItem,
  Button,
  MenuButton,
  MenuList,
  Portal,
} from "@chakra-ui/react";

import {
  COLORS,
  SKETCH_TOOLS,
  SketchControlAPI,
  SketchState,
} from "../../hooks/useSketchControl";
import {
  ReplayerOverlayTool,
  useReplayerOverlay,
} from "../ReplayerOverlayContext";
import BookmarkButton from "../BookmarkButton";
import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  CodeElementIcon,
  EyeOutlineIcon,
  EyeOutlineOffIcon,
} from "shared/icons";
import { useProjectSandbox } from "shared/providers/ProjectSandboxContext";
import { useVisibility } from "shared/components/Visibility";
import { useDebugSession } from "../../../../DebugSessionContext";
import { useElementInspectorAvailable } from "shared/components/AgentChat";

interface ToolbarProps {}

const Toolbar = (props: ToolbarProps) => {
  const {
    addNewPage,
    onPageChange,
    onToolChange,
    tool,
    currentPage,
    disabled,
    sketchState,
    sketchControl,
    currentTimeNotes,
    sketchHidden,
    toggleSketchHidden,
  } = useReplayerOverlay();
  const { isPreviewMode } = useDebugSession();
  const elementInspectorAvailable = useElementInspectorAvailable();
  const { withSandboxCheck } = useProjectSandbox();

  const containerRef = useRef<HTMLDivElement>(null);
  const [parentWidth, setParentWidth] = useState<number>(Infinity);

  useEffect(() => {
    const container = containerRef.current;
    const parent = container?.parentElement ?? container;
    if (!parent) return;

    setParentWidth(parent.clientWidth);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setParentWidth(entry.contentRect.width);
      }
    });
    ro.observe(parent);
    return () => {
      ro.disconnect();
    };
  }, []);

  const isCompact = parentWidth < 640;

  return (
    <HStack
      ref={containerRef}
      px={1}
      py={1}
      zIndex={1}
      pr={isPreviewMode ? 20 : 1}
      spacing={{ base: 1, md: 2 }}
      bg="bg.primary"
      align="center"
      boxShadow="sm"
      borderTopRadius="lg"
      opacity={disabled ? 0.5 : 1}
      pointerEvents={disabled ? "none" : "auto"}
    >
      {!isPreviewMode && (
        <>
          {elementInspectorAvailable && (
            <>
              <ToolbarButton
                key={`inspector-${tool}`}
                label="Inspect Element"
                icon={<Icon as={CodeElementIcon} />}
                isActive={tool === ReplayerOverlayTool.Inspector}
                onClick={withSandboxCheck(() => {
                  onToolChange(ReplayerOverlayTool.Inspector);
                  sketchControl.setSketchTool(null);
                })}
              />
              <Divider
                display={{ base: "none", md: "block" }}
                orientation="vertical"
                h="20px"
              />
              {tool === ReplayerOverlayTool.Inspector && (
                <ToolbarButton
                  label={sketchHidden ? "Show sketch" : "Hide sketch"}
                  icon={
                    <Icon
                      as={sketchHidden ? EyeOutlineIcon : EyeOutlineOffIcon}
                    />
                  }
                  // isActive={!sketchHidden}
                  onClick={withSandboxCheck(toggleSketchHidden)}
                />
              )}
            </>
          )}
          <ToolbarTools
            isCompact={isCompact}
            sketchState={sketchState}
            onToolChange={onToolChange}
            sketchControl={sketchControl}
          />
          <Divider orientation="vertical" h="20px" />
          <Box flex={1} />
        </>
      )}
      <BookmarkButton />
      {!!currentTimeNotes.length && (
        <Box hideBelow="md">
          <Menu>
            <MenuButton
              as={Button}
              size="sm"
              variant="light"
              rightIcon={<ChevronDownIcon />}
            >
              Sketch {currentPage + 1}
            </MenuButton>
            <Portal>
              <MenuList minW="8" zIndex="dropdown">
                {currentTimeNotes.map((_, index) => (
                  <MenuItem
                    key={index}
                    bg={index === currentPage ? "bg.subtle" : "none"}
                    onClick={() => onPageChange(index)}
                  >
                    Sketch {index + 1}
                  </MenuItem>
                ))}
                <MenuItem onClick={withSandboxCheck(addNewPage)}>
                  Add new sketch
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        </Box>
      )}
    </HStack>
  );
};

const ToolbarTools = ({
  isCompact,
  sketchState,
  onToolChange,
  sketchControl,
}: {
  isCompact: boolean;
  sketchState: SketchState;
  onToolChange: (tool: ReplayerOverlayTool) => void;
  sketchControl: SketchControlAPI;
}) => {
  const { withSandboxCheck } = useProjectSandbox();
  const isMobile = useVisibility({ base: true, md: false });
  return isCompact ? (
    <>
      <Menu>
        <MenuButton
          as={Button}
          size="sm"
          variant="light"
          minW="0"
          css={{
            span: {
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minW: "0",
            },
          }}
          rightIcon={<ChevronDownIcon />}
          leftIcon={<Icon as={SKETCH_TOOLS[sketchState.tool]?.icon} />}
        >
          {isMobile ? null : SKETCH_TOOLS[sketchState.tool]?.label ?? "Tool"}
        </MenuButton>
        <Portal>
          <MenuList zIndex="dropdown">
            {Object.entries(SKETCH_TOOLS).map(([toolKey, { label, icon }]) => (
              <MenuItem
                key={toolKey}
                bg={sketchState.tool === toolKey ? "bg.subtle" : "none"}
                onClick={withSandboxCheck(() => {
                  onToolChange(ReplayerOverlayTool.Sketch);
                  sketchControl.setSketchTool(toolKey as ToolType);
                })}
              >
                <Icon as={icon} mr={2} />
                {label}
              </MenuItem>
            ))}
          </MenuList>
        </Portal>
      </Menu>
      <Divider orientation="vertical" h="20px" />
      <Menu>
        <MenuButton
          as={Button}
          size="sm"
          variant="light"
          rightIcon={<ChevronDownIcon />}
        >
          <HStack>
            <Box
              w="4"
              h="4"
              borderRadius="4px"
              bg={sketchState.color}
              border="1px solid"
              borderColor="border.secondary"
            />
            Color
          </HStack>
        </MenuButton>
        <Portal>
          <MenuList minW="auto" zIndex="dropdown" p={2}>
            <Flex wrap="wrap" gap="2">
              {COLORS.map((color) => (
                <Box
                  key={color}
                  w="4"
                  h="4"
                  borderRadius="4px"
                  cursor="pointer"
                  bg={color}
                  outline={
                    sketchState.color === color ? `1px solid ${color}` : "none"
                  }
                  outlineOffset={2}
                  onClick={withSandboxCheck(() => {
                    onToolChange(ReplayerOverlayTool.Sketch);
                    sketchControl.setStrokeColor(color);
                  })}
                />
              ))}
            </Flex>
          </MenuList>
        </Portal>
      </Menu>
    </>
  ) : (
    <>
      {Object.entries(SKETCH_TOOLS).map(([tool, { label, icon }]) => (
        <ToolbarButton
          key={tool}
          label={label}
          icon={<Icon as={icon} />}
          isActive={sketchState.tool === tool}
          onClick={withSandboxCheck(() => {
            onToolChange(ReplayerOverlayTool.Sketch);
            sketchControl.setSketchTool(tool as ToolType);
          })}
        />
      ))}
      <Divider orientation="vertical" h="20px" />
      {COLORS.map((color) => (
        <Box
          w="4"
          h="4"
          bg={color}
          key={color}
          cursor="pointer"
          borderRadius="4px"
          _hover={{ opacity: 0.8 }}
          outline={sketchState.color === color ? `1px solid ${color}` : "none"}
          outlineOffset={2}
          onClick={withSandboxCheck(() => {
            onToolChange(ReplayerOverlayTool.Sketch);
            sketchControl.setStrokeColor(color);
          })}
        />
      ))}
    </>
  );
};

export default Toolbar;
