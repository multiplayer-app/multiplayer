import { useState } from "react";
import { Button, useDisclosure, Stack } from "@chakra-ui/react";
import { VariableGroup } from "@multiplayer/types";
import AddVariableGroupModal from "shared/components/AddVariableGroupModal";
import VariableGroupTree from "shared/components/VariableGroupTree";

const VariableGroupTreePanel = ({
  data,
  selectedGroup,
  readonly,
  onChange,
  onOpen,
  onNameUpdate,
}: {
  data: VariableGroup;
  selectedGroup: VariableGroup;
  readonly?: boolean;
  onChange: (key: string, value: any, parentKey: string) => void;
  onOpen: (group: VariableGroup) => void;
  onNameUpdate: (id: string, name: string) => void;
}) => {
  const [parent, setParent] = useState(null);
  const newGroupDisclosure = useDisclosure();

  const onGroupChange = (key: string, value: any, parentKey: string) => {
    onChange(key, value, parentKey);
  };

  const onOpenAddModal = (parent?: VariableGroup) => {
    setParent(parent || data);
    newGroupDisclosure.onOpen();
  };

  return (
    <Stack
      borderRadius="16px"
      border="0.5px solid #E5E7EB"
      p="4"
      backgroundColor="bg.subtle"
      alignItems="space-between"
      h="full"
    >
      <VariableGroupTree
        data={data}
        readonly={readonly}
        selectedGroup={selectedGroup}
        onOpen={onOpen}
        onChange={onGroupChange}
        onNameUpdate={onNameUpdate}
        onOpenAddModal={onOpenAddModal}
      />
      {!readonly && (
        <Button
          mt="4"
          w="full"
          backgroundColor="bg.primary"
          borderRadius="12px"
          variant="light"
          color="subtle"
          fontWeight="500"
          onClick={() => onOpenAddModal()}
          boxShadow="0px 3px 3px -1.5px rgba(0, 0, 0, 0.06), 0px 1px 1px -0.5px rgba(0, 0, 0, 0.06);"
        >
          Create a variable group
        </Button>
      )}
      {newGroupDisclosure.isOpen && (
        <AddVariableGroupModal
          disclosure={newGroupDisclosure}
          onChange={onGroupChange}
          onClose={() => setParent(null)}
          parent={parent}
        />
      )}
    </Stack>
  );
};

export default VariableGroupTreePanel;
