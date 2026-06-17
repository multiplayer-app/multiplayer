import PageLoading from "shared/components/PageLoading";
import { useWorkspace } from "shared/providers/WorkspaceContext";
import ProfileContent from "./Content";

import { Content, NARROW_CONTENT_PROPS } from "../../SettingsLayout";

const Profile = () => {
  const { user } = useWorkspace();

  return (
    <Content title="Profile" contentProps={NARROW_CONTENT_PROPS}>
      {!user?.data ? <PageLoading /> : <ProfileContent data={user.data} />}
    </Content>
  );
};

export default Profile;
