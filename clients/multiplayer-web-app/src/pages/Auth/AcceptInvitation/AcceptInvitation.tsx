import { Box, Button, Heading, Text } from "@chakra-ui/react";
import { IWorkspace } from "@multiplayer/types";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthBox from "shared/components/AuthBox";
import PageLoading from "shared/components/PageLoading";
import useMessage from "shared/hooks/useMessage";
import { useAuth } from "shared/providers/AuthContext";
import {
  applyToken,
  verifyInvitationToken,
} from "shared/services/tokens.service";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { PostHogEvents } from "shared/models/enums";
import { useRedirect } from "shared/hooks/useRedirect";

interface AcceptInvitationProps {}

interface IInvitation {
  inviter: string;
  email: string;
  workspace: IWorkspace;
}

const AcceptInvitation = (props: AcceptInvitationProps) => {
  const message = useMessage();
  const location = useLocation();
  const navigate = useNavigate();
  const { sessions, authorized, setSession, updateSessions } = useAuth();
  const { trackEvent } = useAnalytics();
  const { clearRedirect, saveRedirect } = useRedirect();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<IInvitation>();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get("token");
    const callbackUrl = query.get("callbackUrl");

    const acceptInvitation = async (invitation: IInvitation) => {
      clearRedirect();
      try {
        await applyToken(token);
        await updateSessions();
        trackEvent(PostHogEvents.ACCEPT_INVITATION, { ...invitation });
        navigate(callbackUrl || "/");
      } catch (error) {
        message.handleError(error);
        setLoading(false);
      }
    };

    const verifyToken = async () => {
      try {
        const invitation = await verifyInvitationToken(token);
        const targetSession = sessions?.find(
          (s) => s.primaryEmail === invitation.email,
        );
        if (!targetSession) {
          setInvitation(invitation);
          setLoading(false);
          saveRedirect();
        } else {
          setSession(targetSession);
          acceptInvitation(invitation);
        }
      } catch (error) {
        setLoading(false);
      }
    };

    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [authorized, location.search]);

  return (
    <AuthBox>
      <Box textAlign="center" position="relative">
        {loading ? (
          <PageLoading />
        ) : invitation ? (
          <>
            <Heading as="h5" size="md">
              {invitation.inviter} has invited you to{" "}
              {invitation.workspace.name}
            </Heading>
            <Text mx="auto" color="muted" fontSize="md" my="4">
              To accept the invitation please login as {invitation.email}
            </Text>
            <Button
              as={Link}
              to={"/auth"}
              w="full"
              size="lg"
              variant="light"
              state={{ invitation }}
            >
              Login
            </Button>
          </>
        ) : (
          <>
            <Heading as="h5" size="md">
              Invalid invitation!
            </Heading>
            <Text mx="auto" color="muted" fontSize="md" my="4">
              Please make sure you are using the correct link provided in your
              invitation email. If you continue to encounter issues, kindly
              reach out to the sender or support for further assistance.
            </Text>
          </>
        )}
      </Box>
    </AuthBox>
  );
};

export default AcceptInvitation;
