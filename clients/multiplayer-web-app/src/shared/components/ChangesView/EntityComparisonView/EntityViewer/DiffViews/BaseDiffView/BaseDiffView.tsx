import { Box, Flex, Icon, Text, FlexProps, IconButton } from "@chakra-ui/react";

import { ChevronDownIcon, ChevronRightIcon } from "shared/icons";
import { ScrollSyncPane } from "react-scroll-sync";

import { Endpoint } from "shared/models/enums";
import { useSharedState } from "shared/providers/SharedStateContext";

import StageCheckbox from "../StageCheckbox";
import ChangeTypeIcon from "shared/components/ChangeTypeIcon";

interface BaseDiffViewProps {
  groups: any;
  changes: any;
  entityId: string;
  endpoint: Endpoint;
  conflicts: Set<string>;
}

const BaseDiffView = ({
  groups,
  changes,
  entityId,
  endpoint,
  conflicts,
}: BaseDiffViewProps) => {
  const [sharedState, setSharedState] = useSharedState();

  return (
    <ScrollSyncPane>
      <Box py="2" flex="1" overflow="auto">
        {groups.map(({ groupId, paths }) => (
          <Box key={groupId} _last={{ borderBottom: 0, mb: 0 }}>
            {paths.map((path: string, index) => {
              const isCollapsed = sharedState.Collapsed?.has(groupId);
              const isGroupHeader = index === 0;
              if (!isGroupHeader && isCollapsed) return null;

              const key = groupId + path;
              const isConflict = conflicts.has(path);
              const item = changes[groupId] && changes[groupId][path];

              return (
                <Row
                  id={key}
                  key={key}
                  isConflict={isConflict}
                  pl={isGroupHeader ? "2" : "7"}
                >
                  {item && (
                    <>
                      <Box w="8">
                        {paths.length > 1 && isGroupHeader ? (
                          <IconButton
                            size="sm"
                            variant="base"
                            onClick={() =>
                              setSharedState((prev) => {
                                const newCollapsed = new Set(prev.Collapsed);
                                newCollapsed.has(groupId)
                                  ? newCollapsed.delete(groupId)
                                  : newCollapsed.add(groupId);
                                return { Collapsed: newCollapsed };
                              })
                            }
                            icon={
                              <Icon
                                as={
                                  isCollapsed
                                    ? ChevronRightIcon
                                    : ChevronDownIcon
                                }
                              />
                            }
                            aria-label="expand"
                          />
                        ) : null}
                      </Box>
                      <StageCheckbox
                        path={path}
                        groupId={groupId}
                        endpoint={endpoint}
                        entityId={entityId}
                      />
                      <ChangeTypeIcon boxSize="2" name={item.changeType} />
                      <Text
                        noOfLines={1}
                        dangerouslySetInnerHTML={{ __html: item.message }}
                      />
                    </>
                  )}
                </Row>
              );
            })}
          </Box>
        ))}
      </Box>
    </ScrollSyncPane>
  );
};

interface RowProps extends FlexProps {
  key: string;
  isConflict: boolean;
}

const Row = ({ id, isConflict, children, ...rest }: RowProps) => {
  const [sharedState, setSharedState] = useSharedState();

  return (
    <Flex
      h="9"
      px="4"
      gap="2"
      alignItems="center"
      bg={
        isConflict
          ? "red.50"
          : sharedState.hovered === id
          ? "bg.surface"
          : "none"
      }
      onPointerEnter={() => setSharedState({ hovered: id })}
      onPointerLeave={() => setSharedState({ hovered: "" })}
      {...rest}
    >
      {children}
    </Flex>
  );
};

export default BaseDiffView;
