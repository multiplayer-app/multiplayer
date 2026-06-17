import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Button,
  Collapse,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Text,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import CollapseToggleButton from "shared/components/CollapseToggleButton";
import {
  IntegrationTypeEnum,
  OtelAgentSelectionMode,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleType,
} from "@multiplayer/types";
import CheckAccess from "shared/components/CheckAccess";
import DebounceInput from "shared/components/DebounceInput";
import DebounceSearch from "shared/components/DebounceSearch";
import DeleteIntegrationConfirmationModal from "shared/components/DeleteIntegrationConfirmationModal";
import Icon from "shared/components/Icon";
import LabelGroup from "shared/components/LabelGroup";
import SelectDropdown from "shared/components/SelectDropdown";
import { TableSimple } from "shared/components/Table";
import WorkspaceUserName from "shared/components/WorkspaceUserName";
import { ClipboardCopyIcon, CloseIcon, TrashIcon } from "shared/icons";
import useMessage from "shared/hooks/useMessage";
import { SortingDirection } from "shared/models/enums";
import { ITableSorting } from "shared/models/interfaces";
import { useIntegrations } from "shared/providers/IntegrationsContext";
import { usePermissions } from "shared/providers/PermissionsContext";
import { useWorkspace } from "shared/providers/WorkspaceContext";

import OtelKeySettingsFields, {
  defaultOtelKeySettings,
  OTEL_AGENT_SELECTION_LABELS,
  OtelKeySettingsValues,
  otelKeySettingsFromIntegration,
} from "./OtelKeySettingsFields";

const PLACEHOLDER_TOKEN = "********************************";

type IntegrationKey = {
  radarId: string;
  name: string;
  radarToken: string;
  workspaceRole?: string;
  projectRole?: string;
  otelSettings?: OtelKeySettingsValues;
  createdAt?: string;
  workspaceUser?: string;
};

type OwnerFilter = "all" | "mine";
type SortKey = "createdAt" | "name";
type SortDirection = "asc" | "desc";

const isRealToken = (t?: string) => !!t && t !== PLACEHOLDER_TOKEN;

interface Props {
  type: IntegrationTypeEnum;
  title?: string;
  description?: string;
}

const formatCreatedAt = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const toTableSorting = (
  key: SortKey,
  direction: SortDirection
): ITableSorting => ({
  key,
  direction: direction === "asc" ? SortingDirection.ASC : SortingDirection.DESC,
});

const IntegrationKeysSection = ({ type, title, description }: Props) => {
  const message = useMessage();
  const { projectId } = useParams();
  const { user } = useWorkspace();
  const {
    integrations: allIntegrations,
    onDelete,
    createIntegration,
    updateIntegration,
  } = useIntegrations();
  const { hasAccess, workspaceRoles, projectRoles } = usePermissions();
  const nameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const deleteDisclosure = useDisclosure();

  const isApiKey = type === IntegrationTypeEnum.API_KEY;
  const isOtelKey = type === IntegrationTypeEnum.OTEL;

  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<IntegrationKey | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftWorkspaceRole, setDraftWorkspaceRole] = useState("");
  const [draftProjectRole, setDraftProjectRole] = useState("");
  const [draftOtelSettings, setDraftOtelSettings] = useState(
    defaultOtelKeySettings
  );
  const createSettingsDisclosure = useDisclosure({ defaultIsOpen: true });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("all");
  const [workspaceRoleFilter, setWorkspaceRoleFilter] = useState("");
  const [projectRoleFilter, setProjectRoleFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const typeIntegrations = useMemo(
    () => allIntegrations.get(type) || [],
    [allIntegrations, type]
  );

  const keys = useMemo<IntegrationKey[]>(
    () =>
      typeIntegrations.map((i) => {
        const raw = i as any;
        return {
          radarId: i._id,
          name: i.name || `Key ${i._id}`,
          radarToken: tokens[i._id] || PLACEHOLDER_TOKEN,
          workspaceRole: i.workspaceRole,
          projectRole: i.projectRole,
          otelSettings:
            type === IntegrationTypeEnum.OTEL
              ? otelKeySettingsFromIntegration(raw)
              : undefined,
          createdAt: raw.createdAt,
          workspaceUser: i.workspaceUser,
        };
      }),
    [typeIntegrations, tokens, type]
  );

  const workspaceRoleOptions = useMemo(
    () =>
      isApiKey
        ? Object.values(workspaceRoles || {}).filter((r) => !r.workspaceOwner)
        : [],
    [workspaceRoles, isApiKey]
  );

  const projectRoleOptions = useMemo(
    () => (isApiKey ? Object.values(projectRoles || {}) : []),
    [projectRoles, isApiKey]
  );

  const filteredKeys = useMemo(() => {
    let out = keys;
    if (search) {
      const q = search.toLowerCase();
      out = out.filter((k) => k.name?.toLowerCase().includes(q));
    }
    if (ownerFilter === "mine" && user?.data?._id) {
      out = out.filter((k) => k.workspaceUser === user.data._id);
    }
    if (isApiKey && workspaceRoleFilter) {
      out = out.filter((k) => k.workspaceRole === workspaceRoleFilter);
    }
    if (isApiKey && projectRoleFilter) {
      out = out.filter((k) => k.projectRole === projectRoleFilter);
    }

    const dir = sortDirection === "asc" ? 1 : -1;
    return [...out].sort((a, b) => {
      if (sortKey === "name") {
        return (a.name || "").localeCompare(b.name || "") * dir;
      }
      const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (ad - bd) * dir;
    });
  }, [
    keys,
    search,
    ownerFilter,
    workspaceRoleFilter,
    projectRoleFilter,
    isApiKey,
    sortKey,
    sortDirection,
    user?.data?._id,
  ]);

  const hasActiveFilters =
    !!search ||
    ownerFilter !== "all" ||
    !!workspaceRoleFilter ||
    !!projectRoleFilter;

  const clearFilters = () => {
    setSearch("");
    setOwnerFilter("all");
    setWorkspaceRoleFilter("");
    setProjectRoleFilter("");
  };

  const createKey = async () => {
    const trimmed = draftName?.trim();
    if (!trimmed) {
      message.handleError({ message: "Name is required" });
      return null;
    }
    if (typeIntegrations.some((k) => (k.name || `Key ${k._id}`) === trimmed)) {
      message.handleError({ message: "Duplicate integration name" });
      return null;
    }
    if (isApiKey && (!draftWorkspaceRole || !draftProjectRole)) {
      message.handleError({
        message: "Please select workspace role and team role",
      });
      return null;
    }
    try {
      const res: any = await createIntegration({
        name: trimmed,
        project: projectId!,
        type,
        ...(isApiKey
          ? {
              workspaceRole: draftWorkspaceRole,
              projectRole: draftProjectRole,
            }
          : {}),
        ...(isOtelKey
          ? {
              otel: {
                agentSelectionMode: draftOtelSettings.agentSelectionMode,
                autoResolveIssues: draftOtelSettings.autoResolveIssues,
                autoCreateIssues: draftOtelSettings.autoCreateIssues,
              },
            }
          : {}),
      });
      const token =
        type === IntegrationTypeEnum.API_KEY
          ? res?.apiKey?.apiKey
          : res?.otel?.apiKey || res?.metadata?.apiKey;

      if (token) {
        setTokens((prev) => ({ ...prev, [res._id]: token }));
      }
      message.success("Key created");
      return res;
    } catch {
      return null;
    }
  };

  const removeKey = async (radarId: string) => {
    try {
      await onDelete(type, radarId);
      setTokens((prev) => {
        const next = { ...prev };
        delete next[radarId];
        return next;
      });
      message.success("Key deleted");
    } catch {
      // Error toast from IntegrationsContext
    }
  };

  const renameKey = (radarId: string, name: string) => {
    if (nameTimerRef.current) clearTimeout(nameTimerRef.current);
    nameTimerRef.current = setTimeout(async () => {
      const trimmed = name.trim();
      if (!trimmed) return;
      try {
        await updateIntegration(type, radarId, { name: trimmed });
        message.success("Key renamed");
      } catch {
        // Error toast from IntegrationsContext
      }
    }, 500);
  };

  const updateKeyRole = async (
    radarId: string,
    field: "workspaceRole" | "projectRole",
    value: string
  ) => {
    if (!value) return;
    try {
      await updateIntegration(type, radarId, { [field]: value });
      message.success("Role updated");
    } catch {
      // Error toast from IntegrationsContext
    }
  };

  const updateOtelSettings = useCallback(
    async (radarId: string, patch: Partial<OtelKeySettingsValues>) => {
      try {
        await updateIntegration(type, radarId, { otel: patch });
        message.success("Key settings updated");
      } catch (error) {
        message.handleError(error);
      }
    },
    [message, type, updateIntegration]
  );

  const canUpdate = hasAccess(
    RoleProjectPermissionEntity.INTEGRATION,
    RoleAccessAction.UPDATE,
    RoleType.PROJECT
  );

  useEffect(() => {
    if (!isApiKey) return;
    if (!draftWorkspaceRole && workspaceRoleOptions[0]) {
      setDraftWorkspaceRole(workspaceRoleOptions[0]._id);
    }
    if (!draftProjectRole) {
      const def =
        (projectRoleOptions as any[]).find((r) => r.default) ||
        projectRoleOptions[0];
      if (def) setDraftProjectRole(def._id);
    }
  }, [
    isApiKey,
    draftWorkspaceRole,
    draftProjectRole,
    workspaceRoleOptions,
    projectRoleOptions,
  ]);

  const openCreate = () => {
    setDraftName("");
    setDraftOtelSettings(defaultOtelKeySettings());
    createSettingsDisclosure.onOpen();
    setIsCreating(true);
  };

  const closeCreate = () => {
    setIsCreating(false);
    setDraftName("");
    setDraftOtelSettings(defaultOtelKeySettings());
    createSettingsDisclosure.onOpen();
  };

  const submitCreate = async () => {
    setSubmitting(true);
    const res = await createKey();
    setSubmitting(false);
    if (res) closeCreate();
  };

  const handleCopy = (token: string) => {
    try {
      navigator.clipboard.writeText(token);
      message.success("Copied to clipboard");
    } catch {
      message.handleError("Unable to copy");
    }
  };

  const confirmDelete = (key: IntegrationKey) => {
    setPendingDelete(key);
    deleteDisclosure.onOpen();
  };

  const tableSorting = toTableSorting(sortKey, sortDirection);
  const handleSortingChange = (next: ITableSorting | null) => {
    if (!next) {
      setSortKey("createdAt");
      setSortDirection("desc");
      return;
    }
    setSortKey(next.key as SortKey);
    setSortDirection(next.direction === SortingDirection.ASC ? "asc" : "desc");
  };

  const tableData = useMemo(
    () => filteredKeys.map((k) => ({ ...k, _id: k.radarId })),
    [filteredKeys]
  );

  const workspaceRoleDropdownOptions = useMemo(
    () => [
      { value: "", label: "—" },
      ...workspaceRoleOptions.map((r) => ({ value: r._id, label: r.name })),
    ],
    [workspaceRoleOptions]
  );

  const projectRoleDropdownOptions = useMemo(
    () => [
      { value: "", label: "—" },
      ...projectRoleOptions.map((r) => ({ value: r._id, label: r.name })),
    ],
    [projectRoleOptions]
  );

  const workspaceRoleFilterOptions = useMemo(
    () => [
      { value: "", label: "All workspace roles" },
      ...workspaceRoleOptions.map((r) => ({ value: r._id, label: r.name })),
    ],
    [workspaceRoleOptions]
  );

  const projectRoleFilterOptions = useMemo(
    () => [
      { value: "", label: "All project roles" },
      ...projectRoleOptions.map((r) => ({ value: r._id, label: r.name })),
    ],
    [projectRoleOptions]
  );

  const ownerFilterOptions = useMemo(
    () => [
      { value: "all", label: "All owners" },
      { value: "mine", label: "My keys" },
    ],
    []
  );

  const draftWorkspaceRoleOptions = useMemo(
    () => workspaceRoleOptions.map((r) => ({ value: r._id, label: r.name })),
    [workspaceRoleOptions]
  );
  const draftProjectRoleOptions = useMemo(
    () => projectRoleOptions.map((r) => ({ value: r._id, label: r.name })),
    [projectRoleOptions]
  );

  const agentSelectionDropdownOptions = useMemo(
    () =>
      (Object.values(OtelAgentSelectionMode) as OtelAgentSelectionMode[]).map(
        (mode) => ({
          value: mode,
          label: OTEL_AGENT_SELECTION_LABELS[mode],
        })
      ),
    []
  );

  const renderOtelExpandedRow = useCallback(
    (row: IntegrationKey) => {
      const settings = row.otelSettings ?? defaultOtelKeySettings();
      return (
        <Box py="1" px="2">
          <OtelKeySettingsFields
            values={settings}
            disabled={!canUpdate}
            agentSelectionOptions={agentSelectionDropdownOptions}
            onAgentSelectionModeChange={(mode) =>
              updateOtelSettings(row.radarId, { agentSelectionMode: mode })
            }
            onAutoResolveIssuesChange={(value) =>
              updateOtelSettings(row.radarId, { autoResolveIssues: value })
            }
            onAutoCreateIssuesChange={(value) =>
              updateOtelSettings(row.radarId, { autoCreateIssues: value })
            }
          />
        </Box>
      );
    },
    [agentSelectionDropdownOptions, canUpdate, updateOtelSettings]
  );

  const columns = useMemo(() => {
    const base: any[] = [
      {
        field: "name",
        name: "Name",
        sortable: true,
        minWidth: "160px",
        component: (row: IntegrationKey) => (
          <DebounceInput
            h="8"
            my="2"
            variant="unstyled"
            value={row.name}
            isReadOnly={!canUpdate}
            debounceTime={1000}
            onChange={(e) => renameKey(row.radarId, e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
      },

      {
        field: "radarToken",
        name: "Token",
        component: (row: IntegrationKey) => {
          const revealed = isRealToken(row.radarToken);
          return (
            <HStack spacing="1" align="center" w="full">
              {revealed ? (
                <>
                  <Input
                    h="8"
                    my="2"
                    variant="unstyled"
                    readOnly
                    value={row.radarToken}
                  />
                  <Tooltip label="Copy token">
                    <IconButton
                      size="xs"
                      variant="ghost"
                      aria-label="Copy token"
                      icon={<Icon as={ClipboardCopyIcon} boxSize="3.5" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(row.radarToken);
                      }}
                    />
                  </Tooltip>
                </>
              ) : (
                <Tooltip label="Token is only shown once at creation">
                  <Text
                    fontSize="xs"
                    fontFamily="mono"
                    color={revealed ? "fg.default" : "muted"}
                    noOfLines={1}
                    maxW="260px"
                  >
                    {PLACEHOLDER_TOKEN}
                  </Text>
                </Tooltip>
              )}
            </HStack>
          );
        },
      },
      ...(isApiKey
        ? [
            {
              field: "workspaceRole",
              name: "Workspace role",
              width: "160px",
              component: (row: IntegrationKey) => (
                <Box onClick={(e) => e.stopPropagation()}>
                  <SelectDropdown
                    value={row.workspaceRole ?? ""}
                    options={workspaceRoleDropdownOptions}
                    onChange={(opt) =>
                      updateKeyRole(row.radarId, "workspaceRole", opt.value)
                    }
                    placeholder="—"
                    buttonProps={{
                      disabled: !canUpdate,
                      w: "full",
                      h: "8",
                      px: "2",
                    }}
                  />
                </Box>
              ),
            },
            {
              field: "projectRole",
              name: "Project role",
              width: "150px",
              component: (row: IntegrationKey) => (
                <Box onClick={(e) => e.stopPropagation()}>
                  <SelectDropdown
                    value={row.projectRole ?? ""}
                    options={projectRoleDropdownOptions}
                    onChange={(opt) =>
                      updateKeyRole(row.radarId, "projectRole", opt.value)
                    }
                    placeholder="—"
                    buttonProps={{
                      disabled: !canUpdate,
                      w: "full",
                      h: "8",
                      px: "2",
                    }}
                  />
                </Box>
              ),
            },
          ]
        : []),
      {
        field: "workspaceUser",
        name: "Created by",
        component: (row: IntegrationKey) => (
          <Text fontSize="sm" noOfLines={1}>
            {row.workspaceUser ? (
              <WorkspaceUserName user={row.workspaceUser} />
            ) : (
              "—"
            )}
          </Text>
        ),
      },
      {
        field: "createdAt",
        name: "Created",
        sortable: true,
        component: (row: IntegrationKey) => (
          <Tooltip
            label={
              row.createdAt
                ? new Date(row.createdAt).toLocaleString()
                : undefined
            }
            isDisabled={!row.createdAt}
          >
            <Text fontSize="sm" noOfLines={1}>
              {formatCreatedAt(row.createdAt)}
            </Text>
          </Tooltip>
        ),
      },
      {
        field: "actions",
        name: "",
        width: isOtelKey ? "72px" : "60px",
        component: (row: IntegrationKey) => (
          <HStack spacing="0" justify="flex-end" w="full">
            <CheckAccess
              scope={RoleType.PROJECT}
              permission={RoleAccessAction.DELETE}
              entity={RoleProjectPermissionEntity.INTEGRATION}
            >
              <Tooltip label="Delete key">
                <IconButton
                  size="sm"
                  variant="ghost"
                  aria-label="Delete key"
                  icon={<Icon as={TrashIcon} color="muted" boxSize="4" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDelete(row);
                  }}
                />
              </Tooltip>
            </CheckAccess>
          </HStack>
        ),
      },
    ];

    return base;
  }, [
    canUpdate,
    isOtelKey,
    isApiKey,
    workspaceRoleDropdownOptions,
    projectRoleDropdownOptions,
    renameKey,
    updateKeyRole,
  ]);

  const emptyText =
    keys.length === 0
      ? "No keys yet — create your first key to get started."
      : "No keys match your filters.";

  return (
    <Box>
      <LabelGroup label={title} description={description} />
      <Flex justify="space-between" align="center" my="4" gap="4">
        <Flex flex="1" gap="2" align="center" wrap="wrap">
          <DebounceSearch
            w="auto"
            size="sm"
            my="0"
            onSearch={setSearch}
            inputProps={{ placeholder: "Search by name" }}
          />
          <SelectDropdown
            value={ownerFilter}
            options={ownerFilterOptions}
            onChange={(opt) => setOwnerFilter(opt.value as OwnerFilter)}
            buttonProps={{ h: "8", minW: "130px", px: "3" }}
          />

          {isApiKey && (
            <>
              <SelectDropdown
                value={workspaceRoleFilter}
                options={workspaceRoleFilterOptions}
                onChange={(opt) => setWorkspaceRoleFilter(opt.value)}
                buttonProps={{ h: "8", minW: "170px", px: "3" }}
              />
              <SelectDropdown
                value={projectRoleFilter}
                options={projectRoleFilterOptions}
                onChange={(opt) => setProjectRoleFilter(opt.value)}
                buttonProps={{ h: "8", minW: "150px", px: "3" }}
              />
            </>
          )}

          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearFilters}
              leftIcon={<Icon as={CloseIcon} boxSize="2.5" />}
            >
              Clear
            </Button>
          )}
        </Flex>
        <CheckAccess
          scope={RoleType.PROJECT}
          permission={RoleAccessAction.CREATE}
          entity={RoleProjectPermissionEntity.INTEGRATION}
        >
          <Button
            leftIcon={<Icon name="Plus" boxSize="3" />}
            onClick={openCreate}
            isDisabled={isCreating}
            flexShrink={0}
            size="sm"
          >
            New key
          </Button>
        </CheckAccess>
      </Flex>

      {isCreating && (
        <Box
          borderWidth="1px"
          borderColor="border.secondary"
          borderRadius="md"
          p="3"
          mb="3"
          bg="bg.subtle"
        >
          <Flex gap="2" align="flex-end" wrap="wrap">
            <FormControl flex="1" minW="200px">
              <FormLabel fontSize="xs">Name</FormLabel>
              <Input
                size="sm"
                autoFocus
                placeholder="e.g. production"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && draftName.trim()) submitCreate();
                  if (e.key === "Escape") closeCreate();
                }}
              />
            </FormControl>
            {isApiKey && (
              <>
                <FormControl flex="1" minW="160px">
                  <FormLabel fontSize="xs">Workspace role</FormLabel>
                  <SelectDropdown
                    value={draftWorkspaceRole}
                    options={draftWorkspaceRoleOptions}
                    onChange={(opt) => setDraftWorkspaceRole(opt.value)}
                    placeholder="Select role"
                    buttonProps={{ h: "8", w: "full", px: "3" }}
                  />
                </FormControl>
                <FormControl flex="1" minW="140px">
                  <FormLabel fontSize="xs">Project role</FormLabel>
                  <SelectDropdown
                    value={draftProjectRole}
                    options={draftProjectRoleOptions}
                    onChange={(opt) => setDraftProjectRole(opt.value)}
                    placeholder="Select role"
                    buttonProps={{ h: "8", w: "full", px: "3" }}
                  />
                </FormControl>
              </>
            )}
            <HStack spacing="1" ml="auto">
              <Button
                size="sm"
                variant="ghost"
                onClick={closeCreate}
                isDisabled={submitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                isLoading={submitting}
                isDisabled={!draftName.trim()}
                onClick={submitCreate}
              >
                Create
              </Button>
            </HStack>
          </Flex>
          {isOtelKey && (
            <Box
              mt="3"
              pt="3"
              borderTopWidth="1px"
              borderColor="border.secondary"
            >
              <Flex align="center" gap="1" mb="2">
                <CollapseToggleButton
                  collapsed={!createSettingsDisclosure.isOpen}
                  onToggle={createSettingsDisclosure.onToggle}
                />
                <Text fontSize="sm" fontWeight="medium">
                  Settings
                </Text>
              </Flex>
              <Collapse in={createSettingsDisclosure.isOpen}>
                <OtelKeySettingsFields
                  values={draftOtelSettings}
                  agentSelectionOptions={agentSelectionDropdownOptions}
                  onAgentSelectionModeChange={(mode) =>
                    setDraftOtelSettings((prev) => ({
                      ...prev,
                      agentSelectionMode: mode,
                    }))
                  }
                  onAutoResolveIssuesChange={(value) =>
                    setDraftOtelSettings((prev) => ({
                      ...prev,
                      autoResolveIssues: value,
                    }))
                  }
                  onAutoCreateIssuesChange={(value) =>
                    setDraftOtelSettings((prev) => ({
                      ...prev,
                      autoCreateIssues: value,
                    }))
                  }
                />
              </Collapse>
            </Box>
          )}
          <Text fontSize="xs" color="muted" mt="2">
            The token will appear in the table after creation — copy it before
            leaving the page.
            {isOtelKey
              ? " Click a row after creation to configure key settings."
              : ""}
          </Text>
        </Box>
      )}

      <TableSimple
        tableName={`apiKeys_${type}`}
        columns={columns}
        data={tableData}
        sorting={tableSorting}
        onSortingChange={handleSortingChange}
        noDataText={emptyText}
        tableWrapperHeight="auto"
        expandableField={isOtelKey ? "actions" : undefined}
        expandedRow={isOtelKey ? renderOtelExpandedRow : undefined}
        expandingBtnDirection={-1}
      />

      <DeleteIntegrationConfirmationModal
        disclosure={deleteDisclosure}
        onDelete={async () => {
          if (pendingDelete) {
            await removeKey(pendingDelete.radarId);
            setPendingDelete(null);
            deleteDisclosure.onClose();
          }
        }}
        integrationName={pendingDelete?.name}
      />
    </Box>
  );
};

export default IntegrationKeysSection;
