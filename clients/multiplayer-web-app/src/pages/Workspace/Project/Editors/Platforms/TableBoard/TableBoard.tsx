import { useEffect, useMemo, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { ITag } from "@multiplayer/types";
import {
  useDiagramActions,
  useDiagramState,
} from "shared/providers/DiagramContext";
import Tag from "shared/components/Tag";
import NodeIcon from "shared/components/NodeIcon";
import ComponentsTable from "shared/components/ComponentsTable";

import { UsePlatformDiagramReturn } from "shared/components/Editors/PixiDiagram/Editor/Platform/usePlatformDiagram";

const columns = [
  {
    field: "entityName",
    name: "Entity Name",
    sortable: true,
    component: ({ entityName, type }) => (
      <Flex alignItems="center" userSelect="none">
        <NodeIcon type={type} mr="8px" />
        <Flex>{entityName}</Flex>
      </Flex>
    ),
  },
  {
    field: "group",
    name: "Group",
    sortable: true,
    component: ({ group }) => <Text userSelect="none">{group?.name}</Text>,
  },
  {
    field: "description",
    name: "Description",
  },
  {
    field: "tags",
    name: "Tags",
    component: ({ tags }) => (
      <Flex gap="1" flexWrap="wrap">
        {tags?.map((tag: ITag) => (
          <Tag
            size="sm"
            key={tag.key + tag.value}
            name={`${tag.key ? tag.key + ":" : ""}${tag.value}`}
          />
        ))}
      </Flex>
    ),
  },
];

const TableBoard = ({
  editor,
  readonly,
}: {
  editor: UsePlatformDiagramReturn;
  readonly: boolean;
}) => {
  const { nodes, groups, selectedNodes } = useDiagramState();
  const { onSelectionDone } = useDiagramActions();

  // const [selectedComponents, setSelectedComponents] = useState(
  //   selectedNodes
  //     ? Object.fromEntries([...selectedNodes].map((key) => [key, true]))
  //     : {}
  // );

  // useEffect(() => {
  //   setSelectedComponents(
  //     selectedNodes
  //       ? Object.fromEntries([...selectedNodes].map((key) => [key, true]))
  //       : {}
  //   );
  // }, [selectedNodes]);

  const [selectedRows, setSelectedRows] = useState<{
    [index: string]: boolean;
  }>({});

  const dataForTable = useMemo(() => {
    return Array.from(nodes.values()).map((n) => ({
      nodeId: n.id,
      description: n.data?.shortDescription,
      group: groups.get(n.groupId),
      ...n,
    }));
  }, [nodes, groups]);

  const selectedComponents = useMemo(() => {
    return Object.keys(selectedRows)
      .filter((k) => !!selectedRows[k])
      .map((index) => {
        return dataForTable[index]?.id;
      });
  }, [dataForTable, selectedRows]);

  // useEffect(() => {
  //   const selectionObject = Object.fromEntries(
  //     [...selectedNodes].map((key) => [key, true])
  //   );
  //
  //   const selectedIndices = Object.fromEntries(
  //     Object.keys(selectionObject).map((key) => {
  //       const index = dataForTable.findIndex((p) => p.id === key);
  //       return [index, true];
  //     })
  //   );
  //
  //   // TODO set selection on table based on selections in diagram board
  //   // setSelectedRows(selectedIndices);
  // }, [selectedNodes]);

  useEffect(() => {
    selectedComponents.forEach((id) => {
      // TODO handle deselect too when selection is kept as {id: false}
      editor.instance.selectComponent(id, true);
    });
  }, [selectedComponents, onSelectionDone]);

  useEffect(() => {
    onSelectionDone(selectedComponents, [], []);
  }, [selectedComponents, onSelectionDone]);

  return (
    <Flex
      py="8"
      px="16"
      w="100%"
      minH="100%"
      overflow="auto"
      position="relative"
      verticalAlign="top"
      display="inline-flex"
    >
      <ComponentsTable
        searchProps={{
          hideDelete: true,
          showSearchIcon: true,
          inputProps: {},
        }}
        height="100%"
        data={dataForTable}
        columns={columns}
        selectedRows={selectedRows}
        allowSelection={!readonly}
        setSelectedRows={setSelectedRows}
        groups={Array.from(groups.values())}
        onSelectionDelete={() => {
          editor.removeSelection();
          setSelectedRows({});
        }}
      />
    </Flex>
  );
};

export default TableBoard;
