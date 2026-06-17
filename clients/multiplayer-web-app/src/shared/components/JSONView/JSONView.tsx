import { useCallback, useMemo, useRef, useState } from "react";
import { JsonEditor, Theme } from "json-edit-react";
import {
  Box,
  BoxProps,
  Flex,
  IconButton,
  Input,
  InputGroup,
} from "@chakra-ui/react";

import { CollapseIcon, ExpandIcon } from "shared/icons";
import { parseNestedObjectTree } from "shared/utils";

const jsonTheme: Theme = {
  styles: {
    container: {
      backgroundColor: "inherit",
      fontFamily: "JetBrains Mono, monospace",
      fontSize: "12px",
      fontWeight: "500",
    },
    property: { color: "var(--chakra-colors-body)" },
    bracket: { color: "#52525b" },
    itemCount: { color: "#a1a1aa" },
    string: { color: "var(--chakra-colors-orange-600)" },
    number: { color: "#0069FF" },
    boolean: { color: "#FFA800" },
    null: { color: "#a1a1aa" },
    iconCollection: { color: "#71717a" },
    iconEdit: { color: "#71717a" },
    iconDelete: { color: "#71717a" },
    iconAdd: { color: "#71717a" },
    iconCopy: { color: "#71717a" },
    iconOk: { color: "#71717a" },
    iconCancel: { color: "#71717a" },
    inputHighlight: { backgroundColor: "#fffd54", color: "#3f3f46" },
  },
};

interface JSONViewProps {
  data: object;
  searchable?: boolean;
  name?: string | null | false;
  displayDataTypes?: boolean;
  jsonViewHeight?: string;
  viewProps?: BoxProps;
  expandDepth?: number;
}

const JSONView = ({
  searchable,
  data,
  viewProps,
  name = false,
  jsonViewHeight,
  displayDataTypes = false,
  expandDepth = 5,
}: JSONViewProps) => {
  const [query, setQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(expandDepth);

  const timeId = useRef<NodeJS.Timeout>();

  const handleChange = useCallback((e) => {
    clearTimeout(timeId.current);
    timeId.current = setTimeout(() => {
      setQuery(e.target.value.trim());
    }, 300);
  }, []);

  const jsonViewSource = useMemo(() => parseNestedObjectTree(data), [data]);

  return (
    <>
      {searchable && (
        <Flex gap="4">
          <InputGroup mb={4}>
            <Input placeholder="Search..." onChange={handleChange} />
          </InputGroup>
          <IconButton
            variant="light"
            aria-label="collapseView"
            icon={isCollapsed ? <ExpandIcon /> : <CollapseIcon />}
            onClick={() => {
              setIsCollapsed(isCollapsed ? 0 : expandDepth);
            }}
          />
        </Flex>
      )}

      <Box
        flex={1}
        p="2"
        overflow="auto"
        borderRadius="base"
        height={jsonViewHeight}
        backgroundColor={viewProps?.backgroundColor || "bg.surface"}
      >
        <Box fontSize="12px" whiteSpace="nowrap" {...viewProps}>
          <JsonEditor
            viewOnly
            showArrayIndices
            searchFilter="all"
            theme={jsonTheme}
            data={jsonViewSource}
            rootName={name || ""}
            collapse={isCollapsed}
            searchText={query || undefined}
            enableClipboard={(copy) => {
              if (copy?.value !== undefined) {
                navigator.clipboard.writeText(JSON.stringify(copy.value));
              }
            }}
          />
        </Box>
      </Box>
    </>
  );
};

export default JSONView;
