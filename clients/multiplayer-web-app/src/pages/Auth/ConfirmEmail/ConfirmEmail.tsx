import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Text, Stack, Heading, Spinner, Button, Flex } from "@chakra-ui/react";
import AuthBox from "shared/components/AuthBox";

import * as AuthService from "shared/services/auth.service";

const ConfirmEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const confirmEmail = useCallback(async (token) => {
    try {
      await AuthService.confirmEmail({ token });
      setSuccess(true);
    } catch (error) {
      setSuccess(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get("token");
    if (token) {
      confirmEmail(token);
    } else {
      navigate("/auth/registration");
    }
  }, [confirmEmail, navigate, location.search]);

  return (
    <AuthBox>
      {loading ? (
        <Flex justifyContent="center">
          <Spinner color="brand.500" m="auto" alignSelf="center" />
        </Flex>
      ) : (
        <Stack alignItems="center" textAlign="center" spacing="4">
          {success ? (
            <>
              <Heading as="h5" size="md">
                All set!
              </Heading>
              <Text mx="auto" color="muted" fontSize="md">
                You've successfully completed registration.
              </Text>
              <Button
                mt="8"
                w="100%"
                as={Link}
                size="lg"
                type="submit"
                variant="light"
                to="/auth/login"
              >
                Go to Log In
              </Button>
            </>
          ) : (
            <>
              <Heading as="h5" size="md">
                Oops! That link didn’t quite work..
              </Heading>
              <Text color="muted" fontSize="md">
                Please double-check your email or head back to the login screen
                to try again.
              </Text>
              <Button
                mt="8"
                w="100%"
                as={Link}
                size="lg"
                type="submit"
                variant="light"
                to="/auth/login"
              >
                Go to Log In
              </Button>
            </>
          )}
        </Stack>
      )}
    </AuthBox>
  );
};

export default ConfirmEmail;
