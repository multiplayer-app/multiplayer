import { useRef, useState } from "react";
import { Box, Flex, Input, List, ListItem, Text } from "@chakra-ui/react";
import WorkspaceUserAvatar from "../../WorkspaceUserAvatar";
import WorkspaceUserName from "../../WorkspaceUserName";
import { InputProps } from "@chakra-ui/input/dist/input";
import { IWorkspaceUser } from "@multiplayer/types";

type UserAutocompleteProps = {
  inputProps: InputProps;
  value: string;
  setValue: (value: string) => void;
  onSubmit: () => void;
  workspaceUsers: Record<string, IWorkspaceUser>;
  parentId?: string;
};

const UserAutocomplete = ({
  inputProps,
  value,
  setValue,
  onSubmit,
  workspaceUsers,
  parentId,
}: UserAutocompleteProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [dropdownPosition, setDropdownPosition] = useState({
    left: 0,
    top: 0,
    bottom: 0,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef(null);
  const userListWidth = 200;

  const calculateDropdownPosition = (): void => {
    if (inputRef.current) {
      const input = inputRef.current;
      const atIndex = input.value.lastIndexOf("@");

      if (atIndex !== -1) {
        const inputRect = input.getBoundingClientRect();
        const prefixText = input.value.substring(0, atIndex);
        const prefixWidth = getTextWidth(prefixText, input);
        const symbolTop = inputRect.height;
        const windowWidth = window.innerWidth;
        let symbolLeft = prefixWidth + 16; // input's left padding
        // Check if the list exceeds window boundaries
        if (inputRect.left + symbolLeft + userListWidth > windowWidth) {
          symbolLeft = inputRect.width - userListWidth;
        }
        // Check if the list exceeds parents' boundaries
        if (isChildOutsideParent()) {
          setDropdownPosition({ left: symbolLeft, top: 0, bottom: 40 });
        } else {
          setDropdownPosition({ left: symbolLeft, top: symbolTop, bottom: 0 });
        }
        return;
      }
      setDropdownPosition({ left: 0, top: 0, bottom: 0 });
    }
  };

  const getTextWidth = (text: string, input: HTMLInputElement) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font =
      window.getComputedStyle(input).fontSize +
      " " +
      window.getComputedStyle(input).fontFamily;
    return context.measureText(text).width;
  };

  const isChildOutsideParent = (): boolean => {
    const parentEl = parentId
      ? document.getElementById(parentId)
      : document.body;
    const parentRect = parentEl.getBoundingClientRect();
    const inputRect = inputRef.current.getBoundingClientRect();
    return inputRect.bottom + 160 > parentRect.bottom; // 160 is list's max height
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setValue(value);

    const lastWord = value.split(" ").pop();

    if (lastWord.startsWith("@")) {
      calculateDropdownPosition();
      setShowDropdown(true);
      const term = lastWord.slice(1).toLowerCase();
      const filtered = Object.values(workspaceUsers).filter(
        ({ firstName, lastName, username }) =>
          firstName?.toLowerCase().includes(term) ||
          lastName?.toLowerCase().includes(term) ||
          username?.toLowerCase().includes(term)
      );
      setFilteredUsers(filtered);
    } else {
      setShowDropdown(false);
      setFilteredUsers([]);
    }
  };

  const handleSelectUser = (user: IWorkspaceUser) => {
    const { firstName, lastName, username } = user;
    const modifiedTerm = value.replace(
      /@\S*$/,
      username ? `@${username}` : `@${firstName} ${lastName}`
    );
    setValue(modifiedTerm);
    setShowDropdown(false);
    setFilteredUsers([]);
  };

  const handleKeyDown = (e) => {
    if (e.code === "Enter") {
      onSubmit();
    }
  };

  return (
    <Box position="relative" width="100%" zIndex={1} ref={containerRef}>
      <Input
        ref={inputRef}
        value={value}
        fontSize="xs"
        pr={4}
        // variant="filled"
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        {...inputProps}
      />
      {showDropdown && (
        <List
          position="absolute"
          width={`${userListWidth}px`}
          backgroundColor="bg.primary"
          boxShadow="md"
          borderRadius="md"
          maxHeight="160px"
          overflow="auto"
          my={1}
          zIndex={1}
          left={`${dropdownPosition.left}px`}
          top={dropdownPosition.top ? `${dropdownPosition.top}px` : "unset"}
          bottom={
            dropdownPosition.bottom ? `${dropdownPosition.bottom}px` : "unset"
          }
        >
          {filteredUsers.map((user: IWorkspaceUser) => (
            <ListItem
              key={user._id}
              cursor="pointer"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              overflow="hidden"
              onClick={() => handleSelectUser(user)}
              p={2}
              _hover={{ backgroundColor: "bg.subtle" }}
            >
              <Flex alignItems="center">
                <WorkspaceUserAvatar size="xs" user={user._id} mr={2} />
                <Text
                  flex="1"
                  minW="0"
                  overflow="hidden"
                  whiteSpace="nowrap"
                  textOverflow="ellipsis"
                >
                  <WorkspaceUserName user={user._id} />
                </Text>
              </Flex>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default UserAutocomplete;
