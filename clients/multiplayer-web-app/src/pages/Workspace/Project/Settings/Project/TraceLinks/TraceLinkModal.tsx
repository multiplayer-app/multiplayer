import { useEffect, useMemo, useState } from "react";
import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { ITraceLink, TraceLinkType } from "@multiplayer/types";
import { CreatableMultiSelect } from "shared/components/CreatableSelect";
import {
  TRACE_LINK_PLACEHOLDERS,
  buildTraceLinkUrl,
  getTraceLinkConfigError,
} from "@multiplayer/util-shared";

import {
  DEFAULT_TRACE_LINK_NAMES,
  TRACE_LINK_TYPE_LABELS,
  TraceLinkDraft,
  toTraceLink,
  toTraceLinkDraft,
} from "./traceLinks.utils";

// The example link opens the user's tool with a trace id that does not exist there: enough to
// check the URL, datasource and organization.
const EXAMPLE_TARGET = {
  traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
  spanId: "00f067aa0ba902b7",
  serviceName: "checkout",
  environment: "production",
};

const PLACEHOLDERS_HELP = `Placeholders: ${TRACE_LINK_PLACEHOLDERS.map(
  (name) => `{${name}}`
).join(", ")} - from and to are epoch milliseconds, one hour around the span.`;

// The draft's fields that take an input's value as it is
type TextField = Extract<
  keyof TraceLinkDraft,
  "name" | "url" | "datasourceUid" | "orgId" | "query" | "urlTemplate"
>;

interface TraceLinkModalProps {
  isOpen: boolean;
  link?: ITraceLink;
  // The project's environments to choose from; others can be typed
  environments: string[];
  environmentsLoading: boolean;
  onClose: () => void;
  onSave: (link: ITraceLink) => Promise<void>;
}

const toOption = (name: string) => ({ label: name, value: name });

const TraceLinkModal = ({
  isOpen,
  link,
  environments,
  environmentsLoading,
  onClose,
  onSave,
}: TraceLinkModalProps) => {
  const [draft, setDraft] = useState<TraceLinkDraft>(toTraceLinkDraft(link));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setDraft(toTraceLinkDraft(link));
  }, [isOpen, link]);

  const traceLink = useMemo(() => toTraceLink(draft), [draft]);
  const error = useMemo(
    () =>
      traceLink.name ? getTraceLinkConfigError(traceLink) : "a name is required",
    [traceLink]
  );
  const exampleUrl = useMemo(
    () =>
      error
        ? undefined
        : buildTraceLinkUrl(traceLink, {
            ...EXAMPLE_TARGET,
            timestamp: Date.now(),
          }),
    [traceLink, error]
  );

  const setField =
    (field: TextField) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setDraft((prev) => ({ ...prev, [field]: e.target.value }));

  const setType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as TraceLinkType;
    setDraft((prev) => ({
      ...prev,
      type,
      // A default name follows the type; a name the user typed stays
      name: Object.values(DEFAULT_TRACE_LINK_NAMES).includes(prev.name)
        ? DEFAULT_TRACE_LINK_NAMES[type]
        : prev.name,
    }));
  };

  const handleSave = async () => {
    if (error) return;
    try {
      setSaving(true);
      await onSave(traceLink);
      onClose();
    } catch {
      // the caller reports the error; keep the form open to fix it
    } finally {
      setSaving(false);
    }
  };

  const isGrafana = draft.type !== TraceLinkType.CUSTOM;

  return (
    <Modal size="lg" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{link ? "Edit trace link" : "Add trace link"}</ModalHeader>
        <ModalCloseButton color="muted" />
        <ModalBody>
          <Stack gap="4">
            <FormControl>
              <FormLabel fontSize="sm">Opens</FormLabel>
              <Select size="sm" value={draft.type} onChange={setType}>
                {Object.values(TraceLinkType).map((type) => (
                  <option key={type} value={type}>
                    {TRACE_LINK_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Name</FormLabel>
              <Input
                size="sm"
                maxLength={50}
                value={draft.name}
                onChange={setField("name")}
              />
              <FormHelperText fontSize="xs">
                The label of the link on spans and in alerts.
              </FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" htmlFor="trace-link-environments">
                Environments
              </FormLabel>
              <CreatableMultiSelect
                inputId="trace-link-environments"
                placeholder="All environments"
                options={environments.map(toOption)}
                value={draft.environments.map(toOption)}
                onChange={(selected) =>
                  setDraft((prev) => ({
                    ...prev,
                    environments: selected.map(({ value }) => value),
                  }))
                }
                isLoading={environmentsLoading}
                noOptionsMessage={() =>
                  environmentsLoading
                    ? "Loading environments..."
                    : "Type an environment name"
                }
              />
              <FormHelperText fontSize="xs">
                Pick the project's environments or type others. The link is
                shown only for spans of these environments; leave it empty for
                all.
              </FormHelperText>
            </FormControl>

            {isGrafana ? (
              <>
                <FormControl>
                  <FormLabel fontSize="sm">Grafana URL</FormLabel>
                  <Input
                    size="sm"
                    placeholder="https://grafana.example.com"
                    value={draft.url}
                    onChange={setField("url")}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">
                    {draft.type === TraceLinkType.GRAFANA_LOKI
                      ? "Loki"
                      : "Tempo"}{" "}
                    datasource UID
                  </FormLabel>
                  <Input
                    size="sm"
                    value={draft.datasourceUid}
                    onChange={setField("datasourceUid")}
                  />
                  <FormHelperText fontSize="xs">
                    In Grafana: Connections, Data sources, open the datasource;
                    the UID is the last part of its URL.
                  </FormHelperText>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Organization ID</FormLabel>
                  <Input
                    size="sm"
                    inputMode="numeric"
                    placeholder="Optional"
                    value={draft.orgId}
                    onChange={setField("orgId")}
                  />
                </FormControl>
                {draft.type === TraceLinkType.GRAFANA_LOKI && (
                  <FormControl>
                    <FormLabel fontSize="sm">LogQL query</FormLabel>
                    <Textarea
                      size="sm"
                      fontFamily="mono"
                      rows={2}
                      value={draft.query}
                      onChange={setField("query")}
                    />
                    <FormHelperText fontSize="xs">
                      {PLACEHOLDERS_HELP}
                    </FormHelperText>
                  </FormControl>
                )}
              </>
            ) : (
              <FormControl>
                <FormLabel fontSize="sm">URL template</FormLabel>
                <Input
                  size="sm"
                  fontFamily="mono"
                  placeholder="https://jaeger.example.com/trace/{traceId}"
                  value={draft.urlTemplate}
                  onChange={setField("urlTemplate")}
                />
                <FormHelperText fontSize="xs">{PLACEHOLDERS_HELP}</FormHelperText>
              </FormControl>
            )}

            {error ? (
              <Text fontSize="sm" color="red.500">
                Not valid yet: {error}.
              </Text>
            ) : (
              exampleUrl && (
                <Text fontSize="sm" color="muted">
                  <Link href={exampleUrl} isExternal color="blue.500">
                    Open an example
                  </Link>{" "}
                  to check the link; its trace id will not exist in your tool.
                </Text>
              )
            )}
          </Stack>
        </ModalBody>
        <ModalFooter gap="2">
          <Button variant="outline" onClick={onClose} isDisabled={saving}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isDisabled={!!error}
            isLoading={saving}
          >
            {link ? "Save link" : "Add link"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TraceLinkModal;
