import { Box, Button, Heading, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthBox from "shared/components/AuthBox";
import PageLoading from "shared/components/PageLoading";
import { useAuth } from "shared/providers/AuthContext";
import useMessage from "shared/hooks/useMessage";
import { useRedirect } from "shared/hooks/useRedirect";

const ReviewInvitation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const message = useMessage();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>();
  const { authorized, sessions, setSession, updateSessions } = useAuth();
  const { saveRedirect, clearRedirect } = useRedirect();

  useEffect(() => {
    const params = Object.fromEntries(
      new URLSearchParams(window.location.search),
    );

    const reviewInvitation = async () => {
      const targetSession = sessions?.find(
        (s) => s.primaryEmail === params.email,
      );

      if (!targetSession) {
        setInvitation(params);
        setLoading(false);
        saveRedirect();
      } else {
        setSession(targetSession);
        setTimeout(() => {
          clearRedirect();
          try {
            updateSessions();
            navigate(
              `/project/${params.workspace}/${params.project}/${params.branch}#branchDetails`,
            );
          } catch (error) {
            message.handleError(error);
            setLoading(false);
          }
        }, 500);
      }
    };

    if (
      params?.workspace &&
      params?.project &&
      params?.branch &&
      params?.email
    ) {
      reviewInvitation();
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
              You have a pending design request review
            </Heading>
            <Text mx="auto" color="muted" fontSize="md" my="4">
              To review the invitation please login as {invitation.email}
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
              Invalid review request invitation!
            </Heading>
            <Text mx="auto" color="muted" fontSize="md" my="4">
              Please make sure you are using the correct link provided in your
              email. If you continue to encounter issues, kindly reach out to
              the sender or support for further assistance.
            </Text>
          </>
        )}
      </Box>
    </AuthBox>
  );
};

export default ReviewInvitation;
