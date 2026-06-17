import { Text, Stack, Heading, Flex, Button } from "@chakra-ui/react";

import AuthBox from "shared/components/AuthBox";
import { useLocation } from "react-router-dom";
import { resendConfirmEmail } from "shared/services/auth.service";
import useMessage from "shared/hooks/useMessage";

const AuthCallback = () => {
  const location = useLocation();
  if (!location.state) return;

  return (
    <AuthBox>
      <Stack
        justifyContent="center"
        alignItems="center"
        textAlign="center"
        minHeight="350"
        spacing="4"
      >
        <Heading as="h5" size="md">
          {location.state.title}
        </Heading>
        {location.state.messages.map((m: string, i: number) => (
          <Text maxW="350px" mx="auto" color="muted" fontSize="md" key={i}>
            {m}
          </Text>
        ))}
        {location.state.actionType ? (
          <AuthCallbackActions
            email={location.state.email}
            actionType={location.state.actionType}
          />
        ) : null}
      </Stack>
    </AuthBox>
  );
};

const AuthCallbackActions = ({ actionType, email }) => {
  const message = useMessage();
  const resendConfirmation = async () => {
    try {
      await resendConfirmEmail({ email });
      message.success("Confirmation email successfully resent!");
    } catch (error) {
      message.handleError(error);
    }
  };

  const handleResend = () => {
    switch (actionType) {
      case "registration":
        resendConfirmation();
        break;
      default:
        break;
    }
  };
  return (
    <Flex flexDir="column" mt="auto" gap="6">
      <Text color="muted" fontSize="md">
        If your link has expired or is not working, please request a new link.
      </Text>
      <Button
        w="100%"
        size="lg"
        type="submit"
        variant="light"
        onClick={handleResend}
      >
        Send me a new email with the link
      </Button>
    </Flex>
  );
};

export default AuthCallback;
