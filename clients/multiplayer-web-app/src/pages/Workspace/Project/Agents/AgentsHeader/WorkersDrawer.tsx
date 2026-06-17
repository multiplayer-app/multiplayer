import { useState } from "react";
import { Box, Collapse, Flex, Stack, Text } from "@chakra-ui/react";
import { AgentStatus, IAgent } from "@multiplayer/types";
import Drawer, { DrawerContent } from "shared/components/Drawer";
import Icon, { type IconProps } from "shared/components/Icon";
import { ToolbarButton } from "shared/components/Toolbar";
import { AGENT_STATUS_COLOR_MAP, AGENT_TYPE_LABELS } from "../agents.constants";

interface WorkersDrawerProps {
  isOpen: boolean;
  workers: IAgent[];
  onClose: () => void;
}

const WorkersDrawer = ({ isOpen, workers, onClose }: WorkersDrawerProps) => {
  if (!isOpen) return null;

  return (
    <Drawer isOpen={isOpen}>
      <DrawerContent width={400} minWidth={320} maxWidth={560}>
        <ToolbarButton
          position="absolute"
          top="5"
          right="5"
          zIndex="11"
          onClick={onClose}
          icon={<Icon name="X" />}
          label="Close"
        />

        <Stack p="6" gap="4" overflow="auto" h="full">
          <Flex alignItems="center" gap="2">
            <Icon name="Bot" boxSize="18px" />
            <Text fontSize="lg" fontWeight="600">
              Workers
            </Text>
          </Flex>

          {workers.length === 0 ? (
            <Flex
              direction="column"
              alignItems="center"
              gap="2"
              py="10"
              color="muted"
            >
              <Icon name="BotOff" boxSize="32px" />
              <Text fontSize="sm">No workers found</Text>
            </Flex>
          ) : (
            <Stack gap="2">
              {workers.map((worker) => (
                <WorkerCard key={worker._id} worker={worker} />
              ))}
            </Stack>
          )}
        </Stack>
      </DrawerContent>
    </Drawer>
  );
};

// ─── WorkerCard ───────────────────────────────────────────────────────────────

const WorkerCard = ({ worker }: { worker: IAgent }) => {
  const [expanded, setExpanded] = useState(false);

  const isActive = true; //(worker.issuesInProgress ?? 0) > 0;

  const metaFields = buildMetaFields(worker);
  const hasDetails = metaFields.length > 0;

  return (
    <Stack
      gap="0"
      borderRadius="lg"
      border="1px solid"
      borderColor="border.primary"
      bg="bg.surface"
      overflow="hidden"
      transition="border-color 0.15s"
    >
      <Flex
        alignItems="center"
        gap="3"
        px="4"
        py="3"
        cursor={hasDetails ? "pointer" : "default"}
        _hover={hasDetails ? { bg: "bg.hover" } : undefined}
        transition="background 0.15s"
        onClick={hasDetails ? () => setExpanded((v) => !v) : undefined}
      >
        <Box
          as="span"
          w="2"
          h="2"
          borderRadius="full"
          flexShrink={0}
          bg={
            isActive
              ? AGENT_STATUS_COLOR_MAP[AgentStatus.RUNNING]
              : AGENT_STATUS_COLOR_MAP[AgentStatus.IDLE]
          }
        />

        <Stack gap="0" minW="0" flex="1">
          <Text fontSize="sm" fontWeight="600" noOfLines={1}>
            {worker.name ?? "Unnamed worker"}
          </Text>
          <Text fontSize="xs" color="muted">
            {AGENT_TYPE_LABELS[worker.type] ?? worker.type}
          </Text>
        </Stack>

        {hasDetails && (
          <Icon
            name={expanded ? "ChevronUp" : "ChevronDown"}
            boxSize="14px"
            color="muted"
            flexShrink={0}
          />
        )}
      </Flex>

      {hasDetails && (
        <Collapse in={expanded} animateOpacity>
          <Stack
            gap="3"
            px="4"
            pt="3"
            pb="4"
            borderTop="1px solid"
            borderTopColor="border.primary"
          >
            {metaFields.map(({ icon, label, value, mono, multiline }) => (
              <MetaField
                key={label}
                icon={icon}
                label={label}
                value={value}
                mono={mono}
                multiline={multiline}
              />
            ))}
          </Stack>
        </Collapse>
      )}
    </Stack>
  );
};

// ─── MetaField ────────────────────────────────────────────────────────────────

type MetaFieldDef = {
  icon: IconProps["name"];
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
};

const formatIssueSubscriptionList = (names: string[] | undefined): string => {
  const list = (names ?? []).filter((n) => n?.trim());
  return list.length > 0 ? list.join(", ") : "All";
};

const buildMetaFields = (worker: IAgent): MetaFieldDef[] => {
  const fields: MetaFieldDef[] = [];

  if (worker.model)
    fields.push({
      icon: "Cpu",
      label: "Model",
      value: worker.model,
      mono: true,
    });

  if ((worker.issuesInProgress ?? 0) > 0)
    fields.push({
      icon: "Activity",
      label: "In progress issues",
      value: String(worker.issuesInProgress),
    });

  if (worker.contextPath)
    fields.push({
      icon: "FolderOpen",
      label: "Working directory",
      value: worker.contextPath,
      mono: true,
    });

  if (worker.maxConcurrentIssues != null)
    fields.push({
      icon: "Layers",
      label: "Capacity",
      value: String(worker.maxConcurrentIssues),
    });

  if (worker.noGitBranch != null)
    fields.push({
      icon: "GitBranch",
      label: "Git branch",
      value: worker.noGitBranch ? "Off" : "On",
    });

  const issueSub = worker.settings?.issueSubscription;
  if (issueSub != null) {
    const componentsValue = formatIssueSubscriptionList(issueSub.componentName);
    const environmentsValue = formatIssueSubscriptionList(
      issueSub.environmentName
    );
    fields.push({
      icon: "Package",
      label: "Components",
      value: componentsValue,
      mono: componentsValue !== "All",
      multiline: componentsValue !== "All",
    });
    fields.push({
      icon: "Globe",
      label: "Environments",
      value: environmentsValue,
      mono: environmentsValue !== "All",
      multiline: environmentsValue !== "All",
    });
  }

  if (worker.settings?.autoResolveIssues != null) {
    fields.push({
      icon: "Wrench",
      label: "Auto-resolve issues",
      value: worker.settings.autoResolveIssues ? "On" : "Off",
    });
  }

  return fields;
};

const MetaField = ({ icon, label, value, mono, multiline }: MetaFieldDef) => (
  <Flex gap="4" alignItems="flex-start" minW="0">
    <Icon name={icon} boxSize="13px" color="muted" mt="2px" flexShrink={0} />
    <Stack gap="0" minW="0">
      <Text fontSize="10px" color="muted" letterSpacing="wide">
        {label}
      </Text>
      <Text
        fontSize="xs"
        noOfLines={multiline ? undefined : 1}
        whiteSpace={multiline ? "normal" : undefined}
        wordBreak={multiline ? "break-word" : undefined}
        fontFamily={mono ? "mono" : undefined}
        title={value}
      >
        {value}
      </Text>
    </Stack>
  </Flex>
);

export default WorkersDrawer;
