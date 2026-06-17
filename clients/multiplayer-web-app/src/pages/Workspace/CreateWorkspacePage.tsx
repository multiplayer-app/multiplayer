import { useState } from "react";
import { useNavigate } from "react-router-dom";

import CreateWorkspaceModal from "shared/components/CreateWorkspaceModal";
import { useAuth } from "shared/providers/AuthContext";
import { navigateToCreatedWorkspaceProject } from "shared/navigation/navigateAfterWorkspaceCreation";

const CreateWorkspacePage = () => {
  const navigate = useNavigate();
  const { sessions, user, updateSessions, setSession } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = async (res) => {
    if (res?.workspace?._id) {
      const sessionsAfter = (await updateSessions()) ?? sessions;
      await navigateToCreatedWorkspaceProject({
        createdWorkspaceId: res.workspace._id,
        sessions: sessionsAfter,
        navigate,
        setSession,
        currentUserId: user?._id,
      });
      setIsOpen(false);
      return;
    }

    setIsOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <CreateWorkspaceModal
      isOpen={isOpen}
      onClose={handleClose}
      isClosable={sessions.length > 1}
    />
  );
};

export default CreateWorkspacePage;
