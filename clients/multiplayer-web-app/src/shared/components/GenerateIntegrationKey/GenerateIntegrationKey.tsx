import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  BoxProps,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Text,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import CheckAccess from "shared/components/CheckAccess";
import {
  IntegrationTypeEnum,
  RoleAccessAction,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import { ClipboardCopyIcon, TrashIcon } from "shared/icons";
import DeleteIntegrationConfirmationModal from "shared/components/DeleteIntegrationConfirmationModal";
import { usePermissions } from "shared/providers/PermissionsContext";
import useMessage from "shared/hooks/useMessage";
import { useIntegrations } from "shared/providers/IntegrationsContext";
import {
  createIntegration,
  deleteIntegration,
  updateIntegration,
} from "shared/services/git.service";
import DebounceSearch from "shared/components/DebounceSearch";
import NoDataPage from "shared/components/NoDataPage";
import WorkspaceUserName from "shared/components/WorkspaceUserName";
import { useWorkspace } from "shared/providers/WorkspaceContext";

const DEFAULT_INTEGRATION_ROW: { [key: string]: any } = { _isNew: null };
const PLACEHOLDER_TOKEN = "********************************";

interface GenerateIntegrationKeyProps {
  integrationType: IntegrationTypeEnum;
  searchable?: boolean;
  allowMultiple?: boolean;
  showOldTokens?: boolean;
  defaultKey?: string;
  props?: BoxProps;
  onTokenGenerated?: (token: any) => void;
  onShowAllKeys?: () => void;
  onIntegrationDeleted?: (radarId: string) => void;
}

const GenerateIntegrationKey = ({
  integrationType,
  searchable = true,
  allowMultiple = true,
  showOldTokens = true,
  defaultKey = "",
  props = {},
  onTokenGenerated,
  onShowAllKeys,
  onIntegrationDeleted,
}: GenerateIntegrationKeyProps) => {
  const message = useMessage();
  const scrollToNewRef = useRef(null);
  const { hasAccess } = usePermissions();
  const { projectId } = useParams();
  const deleteConfirmationDisclosure = useDisclosure();
  const { workspaceRoles, projectRoles } = usePermissions();
  const { integrations: allIntegrations } = useIntegrations();
  const nameChangeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useWorkspace();

  const showRoleSelection = integrationType === IntegrationTypeEnum.API_KEY;
  const showMetadata = searchable && allowMultiple;

  const [searchQuery, setSearchQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<"all" | "mine">("all");
  const [nameFilter, setNameFilter] = useState("");
  const [selectedProjectRole, setSelectedProjectRole] = useState("");
  const [newIntegrationName, setNewIntegrationName] = useState(defaultKey);
  const [integrations, setIntegrations] = useState(DEFAULT_INTEGRATION_ROW);
  const [selectedWorkspaceRole, setSelectedWorkspaceRole] = useState("");
  const [integrationToDelete, setIntegrationToDelete] = useState<{
    radarId: string;
    name: string;
  } | null>(null);

  const typeIntegrations = useMemo(
    () => allIntegrations.get(integrationType),
    [allIntegrations, integrationType]
  );

  const workspaceRoleOptions = useMemo(
    () =>
      showRoleSelection
        ? Object.values(workspaceRoles || {}).filter((r) => !r.workspaceOwner)
        : [],
    [workspaceRoles, showRoleSelection]
  );
  const projectRoleOptions = useMemo(
    () => (showRoleSelection ? Object.values(projectRoles || {}) : []),
    [projectRoles, showRoleSelection]
  );

  useEffect(() => {
    if (
      showRoleSelection &&
      !selectedWorkspaceRole &&
      workspaceRoleOptions[0]
    ) {
      setSelectedWorkspaceRole(workspaceRoleOptions[0]._id);
    }
  }, [showRoleSelection, selectedWorkspaceRole, workspaceRoleOptions]);

  useEffect(() => {
    if (showRoleSelection) {
      const defaultRole = projectRoleOptions.find((r) => r.default);
      if (!selectedProjectRole && (defaultRole || projectRoleOptions[0])) {
        setSelectedProjectRole((defaultRole || projectRoleOptions[0])._id);
      }
    }
  }, [showRoleSelection, projectRoleOptions, selectedProjectRole]);

  useEffect(() => {
    if (typeIntegrations?.length) {
      const mapped = typeIntegrations.reduce((acc, integration) => {
        const raw = integration as any;
        acc[integration._id] = {
          radarId: integration._id,
          name: integration.name || `Key ${integration._id}`,
          radarToken: PLACEHOLDER_TOKEN,
          workspaceRole: integration.workspaceRole,
          projectRole: integration.projectRole,
          createdAt: raw.createdAt,
          workspaceUser: integration.workspaceUser,
        };
        return acc;
      }, {} as Record<string, any>);
      setIntegrations(mapped);
    } else {
      setIntegrations(DEFAULT_INTEGRATION_ROW);
    }
  }, [typeIntegrations]);

  const shouldDisableNewIntegration = useMemo(
    () => Object.keys(integrations).some((key) => key === "_isNew"),
    [integrations]
  );

  const uniqueNames = useMemo(() => {
    const names = Object.values(integrations ?? {})
      .map((i) => i?.name)
      .filter(Boolean);
    return [...new Set(names)].sort();
  }, [integrations]);

  const filteredIntegrations = useMemo(() => {
    if (!showOldTokens) {
      if (!newIntegrationName) return DEFAULT_INTEGRATION_ROW;
      const found = Object.values(integrations ?? {}).find(
        (i) => i?.name === newIntegrationName
      );
      return found ? { [found.radarId]: found } : DEFAULT_INTEGRATION_ROW;
    }

    let entries = Object.entries(integrations ?? {});

    if (searchQuery) {
      entries = entries.filter(
        ([key, value]) =>
          key === "_isNew" ||
          value?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (ownerFilter === "mine" && user?.data?._id) {
      entries = entries.filter(
        ([key, value]) =>
          key === "_isNew" || value?.workspaceUser === user.data._id
      );
    }

    if (nameFilter) {
      entries = entries.filter(
        ([key, value]) => key === "_isNew" || value?.name === nameFilter
      );
    }

    return Object.fromEntries(entries);
  }, [
    integrations,
    searchQuery,
    showOldTokens,
    newIntegrationName,
    ownerFilter,
    nameFilter,
    user?.data?._id,
  ]);

  const addTokenForEnvironment = async () => {
    if (
      Object.values(integrations)?.find((i) => i?.name === newIntegrationName)
    ) {
      message.handleError({ message: "Duplicate integration name" });
      return;
    }
    if (showRoleSelection && (!selectedWorkspaceRole || !selectedProjectRole)) {
      message.handleError({
        message: "Please select workspace role and team role",
      });
      return;
    }

    const result = await generateTokens(newIntegrationName);
    const { radarId, radarToken, rawResponse } = result || {};

    if (radarToken) {
      setIntegrations((prev) => {
        const { _isNew, ...rest } = prev;
        return {
          ...rest,
          [radarId]: {
            radarId,
            radarToken,
            name: newIntegrationName,
            projectRole: rawResponse?.projectRole,
            workspaceRole: rawResponse?.workspaceRole,
            createdAt: rawResponse?.createdAt,
            workspaceUser: rawResponse?.workspaceUser,
          },
        };
      });
      if (showOldTokens) setNewIntegrationName("");
      onTokenGenerated?.(rawResponse);
    }
  };

  const addIntegrationRow = () => {
    setIntegrations((prev) => ({ ...prev, _isNew: null }));
    setTimeout(() =>
      scrollToNewRef.current?.scrollIntoView({ behavior: "smooth" })
    );
  };

  const generateTokens = async (name: string) => {
    try {
      const payload: Parameters<typeof createIntegration>[0] = {
        name,
        project: projectId,
        type: integrationType,
      };
      if (showRoleSelection) {
        payload.workspaceRole = selectedWorkspaceRole;
        payload.projectRole = selectedProjectRole;
      }

      const res = await createIntegration(payload);
      const token =
        integrationType === IntegrationTypeEnum.API_KEY
          ? res?.apiKey?.apiKey
          : res?.otel?.apiKey || res?.metadata?.apiKey;

      return {
        radarToken: token,
        radarId: res?._id,
        rawResponse: res,
      };
    } catch (error) {
      message.handleError(error);
      return {};
    }
  };

  const removeIntegrations = async (radarId: string) => {
    try {
      await deleteIntegration(radarId);
      onIntegrationDeleted?.(radarId);
      message.success("API key deleted");
      setIntegrations((prev) => {
        const { [radarId]: _, ...rest } = prev;
        return Object.keys(rest).length ? rest : DEFAULT_INTEGRATION_ROW;
      });
    } catch (error) {
      message.handleError(error);
    }
  };

  const onIntegrationNameChange = (name: string, radarId: string) => {
    if (nameChangeTimerRef.current) clearTimeout(nameChangeTimerRef.current);
    nameChangeTimerRef.current = setTimeout(async () => {
      try {
        await updateIntegration(radarId, { name: name.trim() });
        message.success("Key updated successfully!");
      } catch (e) {
        message.handleError(e);
      }
    }, 500);
  };

  const onIntegrationRoleChange = async (
    radarId: string,
    field: "workspaceRole" | "projectRole",
    value: string
  ) => {
    if (!value) return;
    try {
      await updateIntegration(radarId, { [field]: value });
      setIntegrations((prev) => ({
        ...prev,
        [radarId]: { ...prev[radarId], [field]: value },
      }));
      message.success("Role updated successfully!");
    } catch (e) {
      message.handleError(e);
    }
  };

  const handleCopy = (token: string) => {
    try {
      navigator.clipboard.writeText(token);
    } catch {
      message.handleError("Unable to copy!");
    }
  };

  const openDeleteConfirmation = (radarId: string, name: string) => {
    setIntegrationToDelete({ radarId, name });
    deleteConfirmationDisclosure.onOpen();
  };

  const access = useMemo(
    () => ({
      update: hasAccess(
        RoleWorkspacePermissionEntity.INTEGRATION,
        RoleAccessAction.UPDATE
      ),
    }),
    [hasAccess]
  );

  const renderNewKeyForm = () => (
    <Flex gap="2" ml="1px" alignItems="flex-end" ref={scrollToNewRef} w="full">
      <FormControl flex={1} maxW="33.33%">
        <FormLabel>Key</FormLabel>
        <Input
          readOnly={!access.update}
          value={newIntegrationName}
          autoFocus={showOldTokens}
          placeholder="Name your API key"
          onChange={(e) => setNewIntegrationName(e.target.value?.trim())}
        />
      </FormControl>
      {showRoleSelection && (
        <>
          <FormControl flex={1}>
            <FormLabel>Workspace role</FormLabel>
            <Select
              value={selectedWorkspaceRole}
              onChange={(e) => setSelectedWorkspaceRole(e.target.value)}
            >
              {workspaceRoleOptions.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl flex={1}>
            <FormLabel>Team role</FormLabel>
            <Select
              value={selectedProjectRole}
              onChange={(e) => setSelectedProjectRole(e.target.value)}
            >
              {projectRoleOptions.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </FormControl>
        </>
      )}
      <CheckAccess
        entity={RoleWorkspacePermissionEntity.INTEGRATION}
        permission={RoleAccessAction.CREATE}
      >
        <Button
          variant="light"
          onClick={() => newIntegrationName && addTokenForEnvironment()}
        >
          Create
        </Button>
      </CheckAccess>
    </Flex>
  );

  return (
    <Box {...props}>
      <Flex gap="1" px="1px" maxH="512px" direction="column">
        <Flex gap="2" alignItems="center" justifyContent="space-between">
          <Flex gap="2" alignItems="center">
            <Select
              w="150px"
              borderRadius="md"
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value as "all" | "mine")}
            >
              <option value="all">All Keys</option>
              <option value="mine">My Keys</option>
            </Select>
            {uniqueNames.length >= 1 && (
              <Select
                w="200px"
                borderRadius="md"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              >
                <option value="">All types</option>
                {uniqueNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            )}
          </Flex>
          {searchable && allowMultiple && (
            <DebounceSearch
              onSearch={setSearchQuery}
              inputGroupProps={{ width: "auto", borderRadius: 12 }}
              inputProps={{ placeholder: "Search..." }}
            />
          )}
        </Flex>
        {allowMultiple && (
          <Box>
            <CheckAccess
              entity={RoleWorkspacePermissionEntity.INTEGRATION}
              permission={RoleAccessAction.UPDATE}
            >
              <Button
                variant="light"
                mb={2}
                minH="40px"
                isDisabled={shouldDisableNewIntegration}
                onClick={addIntegrationRow}
              >
                Add key
              </Button>
            </CheckAccess>
          </Box>
        )}
        {Object.keys(filteredIntegrations)?.length ? (
          <Box overflowY="auto">
            {Object.keys(filteredIntegrations).map((radarId) => {
              const rowData = integrations[radarId];
              return (
                <Flex
                  key={radarId}
                  mb="4"
                  gap="2"
                  w="100%"
                  alignItems="flex-end"
                  borderRadius="8px"
                >
                  {!rowData ? (
                    renderNewKeyForm()
                  ) : (
                    <>
                      <FormControl
                        flex={1}
                        maxW={showMetadata ? "25%" : "33.33%"}
                      >
                        <FormLabel>Key</FormLabel>
                        <Input
                          readOnly={!access.update}
                          defaultValue={rowData.name || "Any"}
                          onChange={(e) =>
                            onIntegrationNameChange(
                              e.target.value,
                              rowData.radarId
                            )
                          }
                        />
                      </FormControl>

                      {showRoleSelection && (
                        <>
                          <FormControl flex={1} minW="120px">
                            <FormLabel>Workspace role</FormLabel>
                            <Select
                              value={rowData.workspaceRole ?? ""}
                              isDisabled={!access.update}
                              onChange={(e) =>
                                onIntegrationRoleChange(
                                  rowData.radarId,
                                  "workspaceRole",
                                  e.target.value
                                )
                              }
                            >
                              <option value="">—</option>
                              {workspaceRoleOptions.map((r) => (
                                <option key={r._id} value={r._id}>
                                  {r.name}
                                </option>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl flex={1} minW="120px">
                            <FormLabel>Team role</FormLabel>
                            <Select
                              value={rowData.projectRole ?? ""}
                              isDisabled={!access.update}
                              onChange={(e) =>
                                onIntegrationRoleChange(
                                  rowData.radarId,
                                  "projectRole",
                                  e.target.value
                                )
                              }
                            >
                              <option value="">—</option>
                              {projectRoleOptions.map((r) => (
                                <option key={r._id} value={r._id}>
                                  {r.name}
                                </option>
                              ))}
                            </Select>
                          </FormControl>
                        </>
                      )}
                      <FormControl flex={1}>
                        <FormLabel>Value</FormLabel>
                        <InputGroup>
                          <Input
                            defaultValue={rowData.radarToken}
                            disabled
                            opacity={
                              rowData.radarToken !== PLACEHOLDER_TOKEN
                                ? "1 !important"
                                : "0.4"
                            }
                          />
                          {rowData.radarToken !== PLACEHOLDER_TOKEN && (
                            <InputRightElement
                              cursor="pointer"
                              onClick={() => handleCopy(rowData.radarToken)}
                            >
                              <Tooltip label="Copy">
                                <Icon as={ClipboardCopyIcon} />
                              </Tooltip>
                            </InputRightElement>
                          )}
                        </InputGroup>
                      </FormControl>
                      {showMetadata && (
                        <>
                          <FormControl flex={0} minW="120px">
                            <FormLabel>Created by</FormLabel>
                            <Tooltip
                              label={
                                rowData.workspaceUser ? (
                                  <WorkspaceUserName
                                    user={rowData.workspaceUser}
                                  />
                                ) : undefined
                              }
                              isDisabled={!rowData.workspaceUser}
                            >
                              <Text
                                fontSize="sm"
                                lineHeight="40px"
                                noOfLines={1}
                              >
                                {rowData.workspaceUser ? (
                                  <WorkspaceUserName
                                    user={rowData.workspaceUser}
                                  />
                                ) : (
                                  "—"
                                )}
                              </Text>
                            </Tooltip>
                          </FormControl>
                          <FormControl flex={0} minW="150px">
                            <FormLabel>Created at</FormLabel>
                            <Tooltip
                              label={
                                rowData.createdAt
                                  ? new Date(rowData.createdAt).toLocaleString()
                                  : undefined
                              }
                              isDisabled={!rowData.createdAt}
                            >
                              <Text
                                fontSize="sm"
                                lineHeight="40px"
                                noOfLines={1}
                              >
                                {rowData.createdAt
                                  ? new Date(
                                      rowData.createdAt
                                    ).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "—"}
                              </Text>
                            </Tooltip>
                          </FormControl>
                        </>
                      )}
                      {allowMultiple && (
                        <CheckAccess
                          entity={RoleWorkspacePermissionEntity.INTEGRATION}
                          permission={RoleAccessAction.DELETE}
                        >
                          <IconButton
                            type="button"
                            alignSelf="end"
                            variant="ghost"
                            aria-label="remove"
                            icon={<Icon color="muted" as={TrashIcon} />}
                            onClick={() =>
                              openDeleteConfirmation(
                                rowData.radarId,
                                rowData.name
                              )
                            }
                          />
                        </CheckAccess>
                      )}
                      {!allowMultiple && onShowAllKeys && (
                        <Button variant="outline" onClick={onShowAllKeys}>
                          All keys
                        </Button>
                      )}
                    </>
                  )}
                </Flex>
              );
            })}
          </Box>
        ) : (
          <NoDataPage props={{ px: 0, py: 4 }} />
        )}
      </Flex>
      <DeleteIntegrationConfirmationModal
        disclosure={deleteConfirmationDisclosure}
        onDelete={async () => {
          if (integrationToDelete) {
            await removeIntegrations(integrationToDelete.radarId);
            deleteConfirmationDisclosure.onClose();
          }
        }}
        integrationName={integrationToDelete?.name}
      />
    </Box>
  );
};

export default GenerateIntegrationKey;
