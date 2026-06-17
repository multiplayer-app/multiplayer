import { Box, Flex, IconButton, SimpleGrid } from "@chakra-ui/react";
import { PropsWithChildren, useState } from "react";
import MultiSelectFilter from "shared/components/MultiSelectFilter";
import { AgentStatus } from "@multiplayer-app/ai-agent-react";
import type { IAgent } from "@multiplayer/types";
import Icon from "shared/components/Icon";
import { useVisibility } from "shared/components/Visibility";
import { SESSION_STATUS_LABELS } from "../SessionTags/SessionTags";

export interface AgentSessionsFilters {
  status?: string;
  agentId?: string;
  archived?: boolean;
}

const STATUS_OPTIONS = Object.values(AgentStatus).map((s) => ({
  label: SESSION_STATUS_LABELS[s] ?? s,
  value: s,
}));

const ARCHIVED_OPTIONS = [{ label: "Show archived", value: "archived" }];

interface AgentsSessionsFiltersProps extends PropsWithChildren {
  filters: AgentSessionsFilters;
  setFilters: React.Dispatch<React.SetStateAction<AgentSessionsFilters>>;
  agents: IAgent[];
}

const AgentsSessionsFilters = ({
  filters,
  setFilters,
  agents,
  children,
}: AgentsSessionsFiltersProps) => {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const isDesktop = useVisibility({ base: false, lg: true });
  const showFilters = isDesktop || isMobileFiltersOpen;

  const agentOptions = agents.map((a) => ({
    label: a.name ?? a._id,
    value: a._id,
  }));

  const onStatusChange = (_key: string, newSelection: any) => {
    setFilters((prev) => ({
      ...prev,
      status: newSelection ?? undefined,
    }));
  };

  const onAgentChange = (_key: string, newSelection: any) => {
    setFilters((prev) => ({
      ...prev,
      agentId: newSelection ?? undefined,
    }));
  };

  const onArchivedChange = (_key: string, newSelection: any) => {
    setFilters((prev) => ({
      ...prev,
      archived: newSelection === "archived" ? true : undefined,
    }));
  };

  return (
    <Flex
      gap="2"
      w="full"
      top="0"
      py="2"
      bg="bg.primary"
      zIndex={10}
      flexDirection={{ base: "column-reverse", lg: "row" }}
      position={{ base: "static", lg: "sticky" }}
    >
      {showFilters && (
        <Box
          as={isDesktop ? Flex : SimpleGrid}
          flex="1"
          {...(!isDesktop
            ? { columns: 2, spacing: 2, alignItems: "stretch" }
            : { gap: 2, flex: 1, flexWrap: "wrap", alignItems: "flex-start" })}
        >
          <MultiSelectFilter
            menuPlacement="bottom-start"
            options={STATUS_OPTIONS}
            selectionMode="single"
            selection={filters.status}
            setSelection={onStatusChange}
            selectionKey="status"
            capitalizeLabels={false}
            filterName="Status"
          />
          <MultiSelectFilter
            menuPlacement="bottom-start"
            options={agentOptions}
            selectionMode="single"
            selection={filters.agentId}
            setSelection={onAgentChange}
            selectionKey="agentId"
            capitalizeLabels={false}
            filterName="Worker"
            searchable={agentOptions.length > 5}
          />
          <MultiSelectFilter
            menuPlacement="bottom-start"
            options={ARCHIVED_OPTIONS}
            selectionMode="single"
            selection={filters.archived === true ? "archived" : undefined}
            setSelection={onArchivedChange}
            selectionKey="archived"
            capitalizeLabels={false}
            filterName="Archived"
          />
        </Box>
      )}
      <Flex
        gap={2}
        alignItems="center"
        ml={{ base: 0, lg: "auto" }}
        justifyContent="flex-end"
        flexShrink={0}
      >
        {children}
        {!isDesktop && (
          <IconButton
            size="md"
            variant="light"
            icon={<Icon name="Funnel" />}
            aria-label="toggle filters"
            onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
          />
        )}
      </Flex>
    </Flex>
  );
};

export default AgentsSessionsFilters;
