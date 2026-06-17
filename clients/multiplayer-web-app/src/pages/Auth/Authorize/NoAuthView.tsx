import { Box, Button, Link, Stack, Text } from "@chakra-ui/react";
import { IOauthClient } from "@multiplayer/types";

interface NoAuthViewProps {
  clientInfo: Partial<IOauthClient>;
  onSignIn: () => void;
}

const NoAuthView = ({ clientInfo, onSignIn }: NoAuthViewProps) => {
  return (
    <Box maxW="700px" padding="12" pb={"6"}>
      <Stack spacing={4} alignItems="center">
        <Text
          fontSize="24px"
          fontWeight="500"
          textAlign="center"
          lineHeight={"36px"}
        >
          Sign in or create an account
        </Text>
        {clientInfo && (
          <>
            {clientInfo.logoUri && (
              <Box display="flex" justifyContent="center">
                <img
                  src={clientInfo.logoUri}
                  alt={`${clientInfo?.clientName} logo`}
                  style={{ maxHeight: "80px", maxWidth: "200px" }}
                />
              </Box>
            )}
            <Text color="muted" fontSize="sm" textAlign="center">
              <Link
                fontSize="sm"
                color="blue.500"
                href={clientInfo.clientUri}
                target="_blank"
                rel="noopener noreferrer"
                marginRight={"5px"}
              >
                {clientInfo.clientName}
              </Link>
              is requesting access to your account.
            </Text>
          </>
        )}
        <Text color="muted" fontSize="sm" textAlign="center">
          You need a Multiplayer account to authorize this application. If you
          don't have one yet, you can create it on the next screen.
        </Text>
        <Button mt="48px" colorScheme="blue" onClick={onSignIn}>
          Sign in or create account
        </Button>
      </Stack>
    </Box>
  );
};

export default NoAuthView;
