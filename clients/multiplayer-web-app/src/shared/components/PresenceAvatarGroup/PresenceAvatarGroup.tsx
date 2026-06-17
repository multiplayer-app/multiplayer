import { AvatarGroup, Avatar } from "@chakra-ui/react";
import { IPresentUser } from "shared/models/interfaces";

interface PresenceAvatarGroupProps {
  users: IPresentUser[];
}

const PresenceAvatarGroup = ({ users }: PresenceAvatarGroupProps) => {
  if (!users || !users.length) return null;
  return (
    <AvatarGroup size="xs" max={4} spacing="-0.45rem">
      {users.map((user) => (
        <Avatar
          size="xs"
          key={user.name}
          bg={user.color}
          src={user.avatar}
          name={user.name}
        />
      ))}
    </AvatarGroup>
  );
};
export default PresenceAvatarGroup;
