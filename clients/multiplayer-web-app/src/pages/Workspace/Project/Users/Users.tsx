import { useParams } from "react-router-dom";
import { UsersProvider } from "shared/providers/UsersContext";
import { UserProvider } from "shared/providers/UserContext";
import UserContent from "pages/Workspace/Project/Users/UserPreview";
import UsersList from "./UsersList";

const Users = () => {
  const { path: userId } = useParams();

  return (
    <UsersProvider>
      <UserProvider>{userId ? <UserContent /> : <UsersList />}</UserProvider>
    </UsersProvider>
  );
};

export default Users;
