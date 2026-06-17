import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Text,
  Box,
  Flex,
  Divider,
  Spinner,
  Collapse,
  Tooltip,
} from "@chakra-ui/react";
import {
  TimeIcon,
  WarningIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";
import CopyToClipboard from "shared/components/CopyToClipboard";
import { Copy } from "lucide-react";

export type ToolCardProps = {
  status: string;
  kindLabel: string;
  /** Optional primary name/value to show in the header (e.g. full file path). */
  name?: string;
  /** Optional transform for how the name is displayed (e.g. path -> filename). */
  nameProcessor?: (name: string) => string;
  /** Optional custom main content – overrides name-based rendering when provided. */
  main?: ReactNode;
  /** Optional tooltip label for the name; defaults to the raw name. */
  tooltipLabel?: string;
  copyTooltip?: string;
  /** Optional extra content rendered to the right of the name (before the copy icon). */
  metaRight?: ReactNode;
  collapsible?: boolean;
  hasBody?: boolean;
  defaultExpanded?: boolean;
  children?: ReactNode;
};

export const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "succeeded":
      return <CheckCircleIcon boxSize={3} color="m.green" />;
    case "running":
      return <Spinner size="xs" color="m.blue" speed="0.8s" />;
    case "pending":
      return <TimeIcon boxSize={3} color="neutral" />;
    case "failed":
      return <WarningIcon boxSize={3} color="m.red" />;
    default:
      return null;
  }
};

export const ToolCard = ({
  status,
  kindLabel,
  name,

  nameProcessor,
  main,
  copyTooltip,
  tooltipLabel,
  metaRight,
  collapsible = false,
  hasBody = false,
  defaultExpanded = false,
  children,
}: ToolCardProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isCollapsible = collapsible && hasBody;
  const processedName = useMemo(() => {
    if (!name) return;
    if (nameProcessor) {
      return nameProcessor(name);
    }
    return name;
  }, [name, nameProcessor]);

  const handleToggle = () => {
    if (!isCollapsible) return;
    setExpanded((v) => !v);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isCollapsible) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setExpanded((v) => !v);
    }
  };

  return (
    <Box
      bg="bg.surface"
      borderWidth="1px"
      borderRadius="lg"
      borderColor="border.primary"
      boxShadow={expanded ? "md" : "sm"}
      overflow="hidden"
      transition="box-shadow 0.15s ease, border-color 0.15s ease"
    >
      <Flex
        px={3}
        py={1}
        gap={2}
        h={8}
        align="center"
        bg="bg.surface"
        userSelect="none"
        onClick={handleToggle}
        cursor={isCollapsible ? "pointer" : "default"}
        role={isCollapsible ? "button" : undefined}
        aria-expanded={isCollapsible ? expanded : undefined}
        tabIndex={isCollapsible ? 0 : -1}
        onKeyDown={handleKeyDown}
        _hover={isCollapsible ? { bg: "bg.subtle" } : undefined}
      >
        <Text fontSize="xs" color="muted" fontWeight="semibold" flexShrink={0}>
          {kindLabel}
        </Text>
        <Flex flex={1} gap="2" minW={0}>
          {name && (
            <Tooltip
              label={tooltipLabel ?? name}
              placement="top"
              openDelay={400}
              closeDelay={0}
              fontSize="xs"
              fontFamily="mono"
              closeOnScroll={true}
            >
              <Text
                as="span"
                fontSize="xs"
                color="body"
                fontFamily="mono"
                fontWeight="medium"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
                maxW="100%"
              >
                {processedName}
              </Text>
            </Tooltip>
          )}
          {main}
        </Flex>

        <Flex align="center" gap={1.5} flexShrink={0}>
          {metaRight}
          {name && (
            <CopyToClipboard
              size="xs"
              icon={Copy}
              value={name}
              label={copyTooltip ?? "Copy"}
              iconProps={{ color: "muted", boxSize: "14px" }}
            />
          )}
          <StatusIcon status={status} />
          {isCollapsible &&
            (expanded ? (
              <ChevronDownIcon boxSize={4} color="muted" />
            ) : (
              <ChevronRightIcon boxSize={4} color="muted" />
            ))}
        </Flex>
      </Flex>

      {hasBody &&
        children &&
        (isCollapsible ? (
          <Collapse in={expanded} animateOpacity unmountOnExit>
            <Divider borderColor="border.primary" />
            {children}
          </Collapse>
        ) : (
          <>
            <Divider borderColor="border.primary" />
            {children}
          </>
        ))}
    </Box>
  );
};
