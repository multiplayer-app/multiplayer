import {
  Flex,
  Stack,
  Text,
  Button,
  Tooltip,
  IconButton,
  Icon,
  Select,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useEventListener,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { IAlertRule } from "@multiplayer/types";
import {
  AlertRulesProvider,
  useAlertRules,
} from "shared/providers/AlertRulesContext";
import useMessage from "shared/hooks/useMessage";
import { useParams, useSearchParams } from "react-router-dom";
import { TrashIcon, MoreDotesIcon } from "shared/icons";
import TableSimple from "shared/components/Table/TableSimple";
import DebounceSearch from "shared/components/DebounceSearch";
import { useIntegrations } from "shared/providers/IntegrationsContext";
import { FILTER_LABELS, CONDITION_LABELS } from "./alertRules.constants";
import { formatScope } from "./alertRules.utils";
import AlertRule from "./AlertRule";
import { Content, WIDE_CONTENT_PROPS } from "../../SettingsLayout";
import SelectionIndicator from "shared/components/SelectionIndicator";
import { useAlertDialog } from "shared/providers/AlertDialogContext";
import { ITableSorting } from "shared/models/interfaces";
import { SortingDirectionMap } from "shared/models/enums";
import Drawer, { DrawerContent } from "shared/components/Drawer";
import { testAlertRuleAction } from "shared/services/radar.service";

type PanelState = { mode: "create" | "edit"; ruleId?: string } | null;

const AlertRulesContent = () => {
  const { workspaceId } = useParams();
  const { projects } = useIntegrations();
  const {
    alertsLoading,
    alertRules,
    listAlertRules,
    projectId,
    setProjectId,
    removeAlertRule,
    updateAlertRule,
  } = useAlertRules();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openAlertDialog } = useAlertDialog();
  const message = useMessage();
  const searchQueryParam = searchParams.get("q") ?? "";
  const [searchInputValue, setSearchInputValue] = useState(searchQueryParam);
  const [selectedRows, setSelectedRows] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [panelState, setPanelState] = useState<PanelState>(null);

  const [params, setParams] = useState({
    skip: 0,
    limit: 10,
    sortKey: "createdAt",
    sortDirection: "-1",
  });

  useEffect(() => {
    setSearchInputValue(searchQueryParam);
  }, [searchQueryParam]);

  useEffect(() => {
    if (workspaceId && projectId) {
      listAlertRules(params);
    }
  }, [workspaceId, projectId, listAlertRules, params]);

  const normalizedSearch = searchQueryParam.trim().toLowerCase();

  const filteredRules = useMemo(() => {
    if (!normalizedSearch) {
      return alertRules?.data || [];
    }

    return alertRules?.data?.filter((rule) => {
      const tokens: string[] = [formatScope(rule)];

      if (rule.filterOperator) {
        tokens.push(rule.filterOperator);
      }

      rule.filters?.forEach((filter) => {
        tokens.push(FILTER_LABELS[filter.type] || filter.type);
        if (filter.value != null) {
          tokens.push(String(filter.value));
        }
        if (filter.interval) {
          tokens.push(filter.interval);
        }
      });

      return tokens.join(" ").toLowerCase().includes(normalizedSearch);
    });
  }, [alertRules, normalizedSearch]);

  const noDataText = useMemo(
    () =>
      !projectId
        ? "Select a project to start"
        : normalizedSearch
        ? "No notification rules match this search"
        : "No notification rules yet",
    [projectId, normalizedSearch]
  );

  const handleSortingChange = useCallback((sorting: ITableSorting | null) => {
    setParams((prev) => ({
      ...prev,
      skip: 0,
      sortKey: sorting.key,
      sortDirection: SortingDirectionMap[sorting.direction],
    }));
  }, []);

  const handleProjectSelection = (e) => {
    setProjectId(e.target.value);
  };

  useEffect(() => {
    if (!projectId && projects?.length) {
      setProjectId(projects[0]._id);
    }
  }, [projects]);

  const handleSearch = (value: string) => {
    setParams((prev) => ({ ...prev, skip: 0 }));
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set("q", value);
    } else {
      next.delete("q");
    }
    setSearchParams(next, { replace: true });
  };

  const openEditPanel = useCallback((ruleId: string) => {
    setPanelState({ mode: "edit", ruleId });
  }, []);

  const openCreatePanel = useCallback(() => {
    setPanelState({ mode: "create" });
  }, []);

  const closePanel = useCallback(() => {
    setPanelState(null);
  }, []);

  const handleRuleSaved = useCallback(() => {
    listAlertRules(params);
  }, [listAlertRules, params]);

  const handleRowClick = useCallback(
    (rule: IAlertRule) => {
      openEditPanel(rule._id);
    },
    [openEditPanel]
  );

  const handleTestRule = useCallback(
    async (rule: IAlertRule) => {
      if (!workspaceId || !projectId || !rule._id || !rule.actions?.length)
        return;
      try {
        const { _id, ...action } = rule.actions[0] as any;
        await testAlertRuleAction(workspaceId, projectId, rule._id, action);
        message.success("Test notification sent!");
      } catch (err) {
        message.handleError(err);
      }
    },
    [workspaceId, projectId, message]
  );

  useEventListener("keydown", (e) => {
    if (panelState && e.key === "Escape") {
      closePanel();
    }
  });

  const onAllRowsSelect = (isSelected: boolean) => {
    const selection = isSelected
      ? filteredRules.reduce((acc, _, index) => {
          acc[index] = isSelected;
          return acc;
        }, {} as { [key: string]: boolean })
      : {};
    setSelectedRows(selection);
  };

  const onRowSelect = (index: number) => {
    setSelectedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleDeleteSelected = async () => {
    if (selectedRulesCount === 0) return;
    const result = await openAlertDialog({
      title: "Delete",
      description: `Are you sure you want to delete ${
        selectedRulesCount > 1 ? "these" : "this"
      } notification rule${selectedRulesCount > 1 ? "s" : ""}?`,
    });

    if (result) {
      try {
        const indicesToDelete = Object.keys(selectedRows).filter(
          (key) => selectedRows[key]
        );

        const rulesToDelete = indicesToDelete.map(
          (index) => filteredRules[parseInt(index)]
        );

        await Promise.all(
          rulesToDelete.map((rule) =>
            removeAlertRule(rule._id || (rule as any).id)
          )
        );

        message.success("Rules successfully deleted!");

        setSelectedRows({});
        await listAlertRules(params);
      } catch (err) {
        message.handleError(err);
      }
    }
  };

  const handleToggleEnabled = useCallback(
    async (rule: IAlertRule, enabled: boolean) => {
      try {
        const payload = { enabled };
        await updateAlertRule(rule._id, payload);
        message.success(
          `Notification rule ${enabled ? "enabled" : "disabled"}`
        );
        await listAlertRules(params);
      } catch (err) {
        message.handleError(err);
      }
    },
    [updateAlertRule, message, listAlertRules, params]
  );

  const columns = useMemo(
    () => [
      {
        field: "name",
        name: "Name",
        minWidth: "150px",
        sortable: true,
        component: (rule: IAlertRule) => (
          <Text fontSize="sm" noOfLines={1}>
            {(rule as any).name || "-"}
          </Text>
        ),
      },
      {
        field: "conditions",
        name: "Type",
        minWidth: "180px",
        sortable: false,
        component: (rule: IAlertRule) => {
          const conditionType = rule.conditions?.[0]?.type;
          return (
            <Text fontSize="sm" noOfLines={1}>
              {conditionType
                ? CONDITION_LABELS[conditionType] || conditionType
                : "-"}
            </Text>
          );
        },
      },
      {
        field: "scope",
        name: "Environment",
        minWidth: "150px",
        sortable: false,
        component: (rule: IAlertRule) => (
          <Text fontSize="sm">{rule.scope?.environmentName || "-"}</Text>
        ),
      },
      {
        field: "_actions",
        name: "",
        minWidth: "50px",
        sortable: false,
        component: (rule: IAlertRule) => (
          <Flex onClick={(e) => e.stopPropagation()} justifyContent="flex-end">
            <Menu placement="bottom-end" isLazy strategy="fixed">
              <MenuButton
                as={IconButton}
                icon={<Icon as={MoreDotesIcon} />}
                variant="ghost"
                size="sm"
                aria-label="actions"
              />
              <MenuList>
                <MenuItem onClick={() => openEditPanel(rule._id)}>
                  Edit
                </MenuItem>
                <MenuItem
                  onClick={() => handleTestRule(rule)}
                  isDisabled={!rule.actions?.length}
                >
                  Test
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        ),
      },
    ],
    [handleToggleEnabled, openEditPanel, handleTestRule]
  );

  const selectedRulesCount = useMemo(() => {
    return (
      selectedRows &&
      Object.keys(selectedRows)?.filter((k) => !!selectedRows[k]).length
    );
  }, [selectedRows]);

  const isInitialLoad = !alertRules && !!projectId;

  return (
    <Content title="Notifications" contentProps={WIDE_CONTENT_PROPS}>
      <Stack spacing={4}>
        <Flex mb={4} gap={6} justifyContent="space-between">
          <Text fontSize="sm" color="muted">
            Access real-time code issues and their impact on users, along with a
            clear view of notification rules, their status, and associated
            projects.
          </Text>
          <Button minW="auto" variant="light" px={2} onClick={openCreatePanel}>
            Create rule
          </Button>
        </Flex>
        <Flex
          alignItems="center"
          gap={3}
          flexWrap="wrap"
          justifyContent="space-between"
          position="relative"
        >
          <Flex
            position="absolute"
            top={2}
            left={0}
            zIndex={1}
            backgroundColor="bg.primary"
          >
            {selectedRulesCount > 0 && (
              <SelectionIndicator
                count={selectedRulesCount}
                onResetSelection={() => {
                  setSelectedRows({});
                }}
                actionButtons={
                  <Tooltip label="Delete selected rules" openDelay={800}>
                    <IconButton
                      size="md"
                      variant="ghost"
                      aria-label="delete"
                      borderLeftRadius="0"
                      onClick={handleDeleteSelected}
                    >
                      <Icon color="muted" as={TrashIcon} />
                    </IconButton>
                  </Tooltip>
                }
              />
            )}
          </Flex>
          <Select
            width="auto"
            size="sm"
            opacity={selectedRulesCount > 0 ? "10%" : "100%"}
            pointerEvents={selectedRulesCount > 0 ? "none" : "all"}
            value={projectId}
            onChange={handleProjectSelection}
            isDisabled={!projects.length}
          >
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </Select>
          <DebounceSearch
            onSearch={handleSearch}
            inputGroupProps={{ width: "240px", my: 0 }}
            inputProps={{
              placeholder: "Search notification rules",
              value: searchInputValue,
              isDisabled: !projectId,
              onChange: (e) => setSearchInputValue(e.target.value),
            }}
          />
        </Flex>

        <TableSimple
          columns={columns}
          data={filteredRules}
          totalItemsCount={null}
          loading={alertsLoading || isInitialLoad}
          tableWrapperHeight="auto"
          tableWrapperOverflow="auto"
          showHeaders={true}
          useRowSelection={true}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          onRowSelect={onRowSelect}
          onSortingChange={handleSortingChange}
          onRowClick={handleRowClick}
          onAllRowsSelect={onAllRowsSelect}
          noDataText={noDataText}
          hideTableOnEmptyData={false}
          useInfiniteScrolling={true}
          tableName="alertRules"
        />
      </Stack>

      <Drawer isOpen={!!panelState}>
        <DrawerContent
          onClose={closePanel}
          width={550}
          minWidth={450}
          offsetTop="0"
        >
          {panelState && (
            <AlertRule
              key={panelState.ruleId ?? "new"}
              mode={panelState.mode}
              ruleId={panelState.ruleId}
              onClose={closePanel}
              onSaved={handleRuleSaved}
            />
          )}
        </DrawerContent>
      </Drawer>
    </Content>
  );
};

const AlertRules = () => (
  <AlertRulesProvider>
    <AlertRulesContent />
  </AlertRulesProvider>
);

export default AlertRules;
