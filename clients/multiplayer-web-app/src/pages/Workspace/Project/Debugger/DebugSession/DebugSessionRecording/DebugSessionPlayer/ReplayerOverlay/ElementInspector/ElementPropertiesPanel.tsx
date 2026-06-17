import React, { useCallback } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  IconButton,
  Icon,
  Flex,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { useParams } from "react-router-dom";

import { ElementPath } from "./ElementInspector";
import ElementPathBreadcrumb from "./ElementPathBreadcrumb";
import AddToChat from "shared/components/AddToChat";
import {
  AddToChatButton,
  buildElementContext,
  formatElementSelector,
  getElementComputedStyles,
  getSessionUrl,
} from "shared/components/AgentChat";
import { useDebugSession } from "../../../../DebugSessionContext";
import { useReplayerOverlay } from "../ReplayerOverlayContext";
import { IS_VSCODE, useVsCode } from "vscode/VsCodeContext";

interface ElementPropertiesPanelProps {
  element: Element | null;
  elementPath: ElementPath[];
  anchorPath: ElementPath[];
  selectedPathIndex: number;
  pathHoverIndex: number | null;
  onPathSegmentSelect: (index: number) => void;
  onPathSegmentPrune: (index: number) => void;
  onPathSegmentHover: (index: number | null) => void;
  isVisible: boolean;
  onClose?: () => void;
}

const MetaRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <HStack justify="space-between" align="baseline" spacing={2} w="full">
    <Text fontSize="xs" color="muted" flexShrink={0}>
      {label}
    </Text>
    <Box
      fontSize="xs"
      fontFamily="mono"
      textAlign="right"
      overflow="hidden"
      textOverflow="ellipsis"
      whiteSpace="nowrap"
      maxW="220px"
    >
      {value}
    </Box>
  </HStack>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Text
    fontSize="xs"
    color="muted"
    textTransform="capitalize"
    letterSpacing="wider"
    fontWeight="medium"
    mb={1}
  >
    {children}
  </Text>
);

const ElementPropertiesPanel: React.FC<ElementPropertiesPanelProps> = ({
  element,
  elementPath,
  anchorPath,
  selectedPathIndex,
  pathHoverIndex,
  onPathSegmentSelect,
  onPathSegmentPrune,
  onPathSegmentHover,
  isVisible,
  onClose,
}) => {
  const { fixSession } = useVsCode();
  const { workspaceId, projectId } = useParams();
  const { session } = useDebugSession();
  const { currentTime } = useReplayerOverlay();

  const getElementContext = useCallback(() => {
    if (!session?._id || !element) return undefined;

    return buildElementContext({
      debugSessionId: session._id,
      debugSessionName: session.name,
      debugSessionUrl: getSessionUrl(workspaceId, projectId, session._id),
      timestampMs: currentTime,
      element,
      elementPath,
    });
  }, [
    currentTime,
    element,
    elementPath,
    projectId,
    session?._id,
    session?.name,
    workspaceId,
  ]);

  if (!isVisible || !element) return null;

  try {
    if (!element.tagName || !element.ownerDocument) {
      return null;
    }
  } catch {
    return null;
  }

  const computedStyles = getElementComputedStyles(element);
  let rect: DOMRect;
  try {
    rect = element.getBoundingClientRect();
  } catch {
    rect = new DOMRect(0, 0, 0, 0);
  }

  const selector = formatElementSelector(elementPath);
  const tag = element.tagName?.toLowerCase() || "unknown";
  const className =
    typeof element.className === "string" ? element.className : "";

  const handleVsCodeAddToChat = (assistantId?: string) => {
    const context = {
      session,
      element: {
        id: element.id,
        tagName: element.tagName,
        className: element.className,
        textContent: element.textContent || "",
        attributes: Array.from(element.attributes).map((attr) => ({
          name: attr.name,
          value: attr.value,
        })),
        computedStyles,
        rect: {
          width: rect.width,
          height: rect.height,
          left: rect.left,
          top: rect.top,
        },
        path: selector,
      },
    };

    fixSession(session._id, context, assistantId);
  };

  const styleEntries = Object.entries(computedStyles);
  const attributes = Array.from(element.attributes);

  return (
    <Flex
      position="absolute"
      top={2}
      left={2}
      bottom={2}
      bg="bg.primary"
      border="1px solid"
      borderColor="border.secondary"
      borderRadius="md"
      boxShadow="sm"
      maxW="320px"
      w="min(320px, calc(100% - 16px))"
      direction="column"
      zIndex={1001}
    >
      <HStack
        px={3}
        py={2}
        borderBottom="1px solid"
        borderColor="border.secondary"
        justify="space-between"
        align="center"
        flexShrink={0}
      >
        <Text fontFamily="mono" fontSize="xs" fontWeight="medium" noOfLines={1}>
          &lt;{tag}&gt;
        </Text>
        {onClose && (
          <IconButton
            aria-label="Close"
            icon={<Icon as={CloseIcon} boxSize={3} color="muted" />}
            onClick={onClose}
            size="xs"
            variant="ghost"
            _hover={{ bg: "bg.subtle" }}
          />
        )}
      </HStack>

      <VStack
        flex="1"
        overflow="auto"
        align="stretch"
        spacing={3}
        px={3}
        py={2}
        sx={{
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-thumb": {
            bg: "border.secondary",
            borderRadius: "full",
          },
        }}
      >
        {anchorPath.length > 0 && (
          <Box>
            <SectionLabel>xpath</SectionLabel>
            <ElementPathBreadcrumb
              path={anchorPath}
              selectedIndex={selectedPathIndex}
              hoveredIndex={pathHoverIndex}
              onSelect={onPathSegmentSelect}
              onPrune={onPathSegmentPrune}
              onHover={onPathSegmentHover}
            />
          </Box>
        )}

        <VStack align="stretch" spacing={1}>
          <MetaRow
            label="size"
            value={`${Math.round(rect.width)}×${Math.round(rect.height)}`}
          />
          <MetaRow
            label="pos"
            value={`${Math.round(rect.left)}, ${Math.round(rect.top)}`}
          />
          {element.id && <MetaRow label="id" value={String(element.id)} />}
          {className && <MetaRow label="class" value={className} />}
        </VStack>

        {styleEntries.length > 0 && (
          <Box>
            <SectionLabel>styles</SectionLabel>
            <VStack align="stretch" spacing={0.5}>
              {styleEntries.map(([property, value]) => (
                <MetaRow
                  key={property}
                  label={property}
                  value={String(value)}
                />
              ))}
            </VStack>
          </Box>
        )}

        {attributes.length > 0 && (
          <Box>
            <SectionLabel>attrs</SectionLabel>
            <VStack align="stretch" spacing={0.5}>
              {attributes.map((attr) => {
                let attrValue = "";
                try {
                  attrValue = String(attr.value ?? "");
                } catch {
                  attrValue = "…";
                }
                return (
                  <MetaRow
                    key={attr.name}
                    label={attr.name}
                    value={attrValue}
                  />
                );
              })}
            </VStack>
          </Box>
        )}
      </VStack>

      <Flex
        p={2}
        gap={2}
        borderTop="1px solid"
        borderColor="border.secondary"
        justifyContent="flex-end"
        alignItems="center"
        flexShrink={0}
      >
        {IS_VSCODE ? (
          <AddToChat onAddToChat={handleVsCodeAddToChat} />
        ) : (
          <AddToChatButton
            size="xs"
            context={getElementContext}
            tooltip="Attach element to chat context"
          />
        )}
      </Flex>
    </Flex>
  );
};

export default ElementPropertiesPanel;
