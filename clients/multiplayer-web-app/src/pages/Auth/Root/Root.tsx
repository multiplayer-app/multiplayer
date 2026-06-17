import { Link, useLocation } from "react-router-dom";
import { Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";

import AuthBox from "shared/components/AuthBox";
import { ReactComponent as GithubIcon } from "assets/icons/github.svg";
import { ReactComponent as GoogleIcon } from "assets/icons/google.svg";
import { ReactComponent as GitlabIcon } from "assets/icons/gitlab.svg";
import { useAuth } from "shared/providers/AuthContext";
import { useEffect, useMemo } from "react";
import { useRedirect } from "shared/hooks/useRedirect";
import { config } from "../../../config";

const Root = () => {
  const location = useLocation();
  const { loading, sessions, setSession, updateSessions } = useAuth();
  const { getRedirect, navigateToRedirect } = useRedirect();
  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  const invitation = location.state?.invitation;
  const apiBase = config.REACT_APP_API_BASE_URL;
  const authPrefix = config.REACT_APP_AUTH_PREFIX;

  const refUser = query.get("refUser");
  const errorMessage = query.get("message");
  const redirectTo = query.get("redirectTo") || getRedirect();

  const getParams = (signInMethod: string): string => {
    const baseUrl = window.location.origin;
    const target = redirectTo ? new URL(redirectTo, baseUrl) : new URL(baseUrl);

    target.searchParams.set("signInMethod", signInMethod);

    return new URLSearchParams({
      redirectUrl: target.toString(),
      ...(refUser ? { refUser: query.get("refUser") } : {}),
    }).toString();
  };

  const setExistingSession = (session) => {
    const redirectPath = session.workspaces.length
      ? "/"
      : "/dashboard/create-workspace";
    setSession(session);
    navigateToRedirect(redirectPath);
  };

  useEffect(() => {
    if (!loading && !sessions) {
      updateSessions();
    }
  }, [loading, updateSessions]);

  return (
    <AuthBox>
      <Stack alignItems="center" textAlign="center" spacing="3" mb="12">
        <Heading as="h5" size="md">
          Welcome
        </Heading>
        <Text mx="auto" color="muted" fontSize="md">
          Sign in or create a new account to start your free 7 day trial - no
          credit card required.
        </Text>
        {errorMessage && (
          <Text mx="auto" color="red.500" fontSize="md">
            {errorMessage}
          </Text>
        )}
      </Stack>
      {!!sessions && !invitation && (
        <>
          <Stack spacing={4}>
            {sessions.map((session) => (
              <Button
                key={session._id}
                w="100%"
                size="lg"
                variant="light"
                flexDir="column"
                whiteSpace="normal"
                onClick={() => setExistingSession(session)}
              >
                Continue with {session.primaryEmail}
              </Button>
            ))}
          </Stack>
          <Text my="2" bgClip="text" color="muted" textAlign="center">
            or
          </Text>
        </>
      )}

      <Stack spacing={4}>
        <Button
          as="a"
          w="100%"
          size="lg"
          variant="light"
          willChange="transform"
          leftIcon={<GoogleIcon />}
          href={`${apiBase}${authPrefix}/google/auth?${getParams("google")}`}
        >
          Continue with Google
        </Button>
        <Button
          as="a"
          w="100%"
          size="lg"
          variant="light"
          willChange="transform"
          leftIcon={<GithubIcon />}
          href={`${apiBase}${authPrefix}/github/auth?${getParams("github")}`}
        >
          Continue with GitHub
        </Button>
        <Button
          as="a"
          w="100%"
          size="lg"
          variant="light"
          willChange="transform"
          leftIcon={<GitlabIcon />}
          href={`${apiBase}${authPrefix}/gitlab/auth?${getParams("gitlab")}`}
        >
          Continue with GitLab
        </Button>
      </Stack>
      <Flex
        mt="6"
        as={Link}
        to="check"
        lineHeight="8"
        state={{ refUser, invitation, redirectTo }}
        justifyContent="center"
      >
        <Text
          mr="2"
          bgClip="text"
          bgGradient="linear(146.8deg, #6B29EF 10.81%, #B739E0 42.84%, #EC8436 79.53%, #F3B040 117.38%)"
        >
          or continue with your email instead
        </Text>
        ✨
      </Flex>
    </AuthBox>
  );
};

export default Root;
