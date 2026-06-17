import { useState } from "react";
import {
  Icon,
  IconButton,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";

import { ArrowCircleUp } from "shared/icons";
import UserAutocomplete from "shared/components/Thread/UsernameAutocomplete";
import { useWorkspaceUsers } from "shared/providers/WorkspaceContext";

interface ThreadInputProps {
  onSubmit: (value: string, cb: Function) => void;
  parentId?: string;
  placeholder?: string;
  groupProps?: any;
}

const ThreadInput = ({
  onSubmit,
  parentId,
  placeholder = "",
  groupProps = {},
}: ThreadInputProps) => {
  const [value, setValue] = useState("");
  const workspaceUsers = useWorkspaceUsers();

  const handleSubmit = () => {
    const submitCallback = () => setValue("");
    onSubmit(value, submitCallback);
  };

  return (
    <InputGroup zIndex={1} {...groupProps}>
      <UserAutocomplete
        value={value}
        setValue={setValue}
        workspaceUsers={workspaceUsers}
        parentId={parentId}
        inputProps={{
          fontSize: "xs",
          maxLength: 1000,
          placeholder: placeholder,
        }}
        onSubmit={handleSubmit}
      />
      <InputRightElement>
        <IconButton
          size="sm"
          variant="base"
          aria-label="send"
          color="muted"
          isDisabled={!value}
          onClick={handleSubmit}
          icon={<Icon as={ArrowCircleUp} />}
        />
      </InputRightElement>
    </InputGroup>
  );
};

export default ThreadInput;
