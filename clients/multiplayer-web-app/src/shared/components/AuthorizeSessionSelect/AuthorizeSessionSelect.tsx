import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Menu,
  MenuButton,
  Button,
  MenuList,
  MenuItem,
  Box,
} from "@chakra-ui/react";
import { useAuth } from "shared/providers/AuthContext";
interface AuthorizeSessionSelectProps {}
const AuthorizeSessionSelect = (props: AuthorizeSessionSelectProps) => {
  const { user, sessions, setSession } = useAuth();

  if (!user) return null;
  return (
    <Menu>
      <MenuButton as={Button} variant="light" rightIcon={<ChevronDownIcon />}>
        Logged in as{" "}
        <b>
          {user.primaryEmail
            ? user.primaryEmail
            : user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.firstName}
        </b>
      </MenuButton>
      <MenuList>
        {sessions.map((session) => (
          <MenuItem
            key={session._id}
            flexDirection="column"
            alignItems="flex-start"
            justifyContent="flex-start"
            onClick={() => setSession(session)}
            bg={session._id === user._id ? "bg.subtle" : "bg.primary"}
          >
            {session.firstName && session.lastName
              ? `${session.firstName} ${session.lastName}`
              : session.primaryEmail}
            <Box color="muted" fontSize="xs">
              {session.primaryEmail}
            </Box>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default AuthorizeSessionSelect;
