import { Flex, Text, Heading, Stack, Button } from "@chakra-ui/react";
import { Link, useLocation } from "react-router-dom";
import { ReactComponent as Logo } from "assets/images/logo-full.svg";
import AuthBox from "shared/components/AuthBox";
import { useAuth } from "shared/providers/AuthContext";

type NotFoundLocationState = {
  title?: string;
  description?: string;
};

const NotFound = () => {
  const { authorized, signOut } = useAuth();
  const location = useLocation();
  const state = (location.state || null) as NotFoundLocationState | null;

  return (
    <Flex
      flex="1"
      minH="100%"
      bg="bg.primary"
      direction="column"
      alignItems="center"
      justifyContent="start"
      pt="16vh"
    >
      <AuthBox>
        <Stack alignItems="center" textAlign="center" spacing="4">
          <Heading as="h2" size="md">
            {state?.title || "404 | Page Not Found"}
          </Heading>
          <Text mx="auto" color="muted" fontSize="md">
            {state?.description ||
              "You just hit a route that doesn't exist, or you do not have access."}
          </Text>
          <Flex gap="4" direction="column">
            <Button as={Link} replace={true} to="/">
              Back to Home
            </Button>
            {authorized && (
              <Button variant="link" onClick={() => signOut()}>
                Log out
              </Button>
            )}
          </Flex>
        </Stack>
      </AuthBox>
    </Flex>
  );
};

export default NotFound;
