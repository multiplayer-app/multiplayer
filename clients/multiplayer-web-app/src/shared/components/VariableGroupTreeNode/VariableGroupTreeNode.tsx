import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Icon, Text } from "@chakra-ui/react";
import { VariableGroup } from "@multiplayer/types";

import { useAlertDialog } from "shared/providers/AlertDialogContext";
import SlugifiedInput from "shared/components/SlugifiedInput";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EntityVariableGroupIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "shared/icons";
import { useFullScreenContext } from "shared/providers/FullScreenContext";

const CHILD_GAP = 24;
const CONNECTOR_MARGIN = 8;

const VariableGroupTreeNode = ({
  group,
  onOpenAddModal,
  onDelete,
  onOpen,
  selectedGroupId,
  level = 0,
  onNameUpdate,
  parentId = null,
  readonly,
}: {
  group: VariableGroup;
  onOpenAddModal: (parentGroup: VariableGroup) => void;
  onDelete: (id: string, parentId: string) => void;
  selectedGroupId: string;
  onOpen: (group: VariableGroup) => void;
  onNameUpdate: (id: string, name: string) => void;
  level?: number;
  parentId?: string;
  readonly?: boolean;
}) => {
  const { containerRef } = useFullScreenContext();
  const nodeRef = useRef(null);
  const { openAlertDialog } = useAlertDialog();
  const [childrenHeight, setChildrenHeight] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(group.name);
  const hasChildren = group.groups && Object.keys(group.groups).length > 0;

  const openConfirmationDialog = async (groupId: string) => {
    const result = await openAlertDialog(
      {
        title: "Delete Variable Group",
      },
      containerRef
    );

    if (result) {
      onDelete(groupId, parentId);
    }
  };

  useLayoutEffect(() => {
    if (!nodeRef.current || !hasChildren) {
      setChildrenHeight(0);
      return;
    }

    const observer = new ResizeObserver(() => {
      if (isCollapsed) {
        setChildrenHeight(0);
        return;
      }

      try {
        const directChildNodes = Array.from(
          nodeRef.current.querySelectorAll(
            ":scope > [data-children-container] > [data-tree-node] > [data-node-item]"
          )
        );

        if (directChildNodes.length === 0) {
          setChildrenHeight(0); // also reset in case children were removed
          return;
        }

        const firstChild = directChildNodes[0] as HTMLElement;
        const lastChild = directChildNodes.at(-1) as HTMLElement;

        if (!firstChild || !lastChild) return;

        const newHeight =
          lastChild.getBoundingClientRect().bottom -
          firstChild.getBoundingClientRect().top;

        if (newHeight !== childrenHeight) {
          setChildrenHeight(newHeight);
        }
      } catch (error) {
        console.error("Error calculating children height:", error);
      }
    });

    observer.observe(nodeRef.current);

    return () => observer.disconnect();
  }, []);

  const offset = useMemo(() => {
    return {
      mainLine: `${
        level === 0 ? CONNECTOR_MARGIN : level * CHILD_GAP + CONNECTOR_MARGIN
      }px`,
      connectionLine: `${
        level === 1
          ? CONNECTOR_MARGIN
          : (level - 1) * CHILD_GAP + CONNECTOR_MARGIN
      }px`,
    };
  }, [level]);

  const isChild = level > 0;

  const handleRenameEnd = (event) => {
    const name = event.target.value.trim();
    if (name && name !== group.name) {
      onNameUpdate(group.id, name);
    }
    setIsEditing(false);
  };

  return (
    <Box
      ref={nodeRef}
      position="relative"
      data-tree-node
      onClick={(e) => e.stopPropagation()}
    >
      <Flex
        alignItems="center"
        data-node-item
        pl={level > 0 ? `${level * CHILD_GAP}px` : 0}
        py={2}
        position="relative"
        whiteSpace="nowrap"
        role="group"
        cursor="pointer"
        gap={2}
        borderRadius={8}
        onClick={() => {
          !isEditing && onOpen(group);
        }}
      >
        {isChild && <ChildConnectorLines offset={offset.connectionLine} />}

        {/* Node Content */}
        <Flex gap={2} alignItems="center" flex={1}>
          <Flex alignItems="center" gap={1}>
            {hasChildren && (
              <Icon
                as={isCollapsed ? ChevronDownIcon : ChevronUpIcon}
                boxSize={4}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollapsed(!isCollapsed);
                }}
                cursor="pointer"
              />
            )}
            <Icon
              as={EntityVariableGroupIcon}
              color={selectedGroupId === group.id ? "brand.500" : "muted"}
              boxSize={4}
            />
          </Flex>
          {isEditing ? (
            <SlugifiedInput
              autoFocus
              onChange={setName}
              value={name}
              height="inherit"
              px={0}
              fontWeight="inherit"
              variant="unstyled"
              onBlur={handleRenameEnd}
              onKeyDown={(e) => e.key === "Enter" && handleRenameEnd(e)}
            ></SlugifiedInput>
          ) : (
            <Text
              fontSize="sm"
              fontWeight={500}
              color={selectedGroupId === group.id ? "brand.500" : "body"}
              userSelect="none"
            >
              {group.name}
            </Text>
          )}
        </Flex>
        {!readonly && parentId === null && (
          <Flex
            opacity={0}
            _groupHover={{ opacity: 1 }}
            gap={2}
            onClick={(e) => e.stopPropagation()}
          >
            <Icon
              as={PlusIcon}
              boxSize={4}
              color="muted"
              onClick={() => onOpenAddModal(group)}
            />
            <Icon
              as={PencilIcon}
              onClick={() => setIsEditing(!isEditing)}
              color="muted"
              boxSize={4}
            />
            <Icon
              as={TrashIcon}
              boxSize={4}
              color="muted"
              onClick={() => openConfirmationDialog(group.id)}
            />
          </Flex>
        )}
      </Flex>

      {hasChildren && !isCollapsed && (
        <>
          <ParentConnectorLines
            offset={offset.mainLine}
            height={childrenHeight}
          />

          {/* Child Nodes */}
          <Box
            pl={level > 0 ? 0 : `${level * CHILD_GAP}px`}
            data-children-container
          >
            {Object.values(group.groups!).map((child) => (
              <VariableGroupTreeNode
                key={child.id}
                group={child}
                level={level + 1}
                parentId={group.id}
                readonly={readonly}
                selectedGroupId={selectedGroupId}
                onOpen={onOpen}
                onDelete={onDelete}
                onNameUpdate={onNameUpdate}
                onOpenAddModal={onOpenAddModal}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

const ParentConnectorLines = ({ offset, height }) => {
  /* Line connecting parent to last child */
  return (
    <Box
      position="absolute"
      left={offset}
      top="36px"
      height={`${height - 28}px`}
      width="1px"
      bg="#D2D5DB"
    />
  );
};

const ChildConnectorLines = ({ offset }) => {
  return (
    <>
      {/* Vertical child line */}
      <Box
        position="absolute"
        left={offset}
        top="0"
        height="calc(50% - 12px)"
        width="1px"
        bg="#D2D5DB"
      />
      {/* Curved child line */}
      <Box
        position="absolute"
        left={offset}
        top="2px"
        width="12px"
        height="18px"
        borderLeft="1px solid"
        borderBottom="1px solid"
        borderColor="#D2D5DB"
        borderBottomLeftRadius="10px"
      />
    </>
  );
};

export default VariableGroupTreeNode;
