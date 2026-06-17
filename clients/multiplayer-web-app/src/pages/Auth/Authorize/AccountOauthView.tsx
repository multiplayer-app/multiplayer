import { Button, Link, Stack, Text } from "@chakra-ui/react";
import { IOauthClient, OauthTokenType } from "@multiplayer/types";
import useMessage from "shared/hooks/useMessage";
import { generateAuthCode } from "shared/services/auth.service";
import { useLocation } from "react-router-dom";

interface AccountOauthViewProps {
  clientInfo: Partial<IOauthClient>;
  onAuthorize: (code: string | undefined, err?: any) => void;
}

const AccountOauthView = ({
  clientInfo,
  onAuthorize,
}: AccountOauthViewProps) => {
  const message = useMessage();
  const location = useLocation();

  const handleAuthorize = async () => {
    try {
      const query = new URLSearchParams(location.search);
      const codeChallenge = query.get("code_challenge");
      const clientId = query.get("client_id");
      const redirectUri = query.get("redirect_uri");
      const codeChallengeMethod = query.get("code_challenge_method");

      try {
        const code = await generateAuthCode(clientId, {
          codeChallenge,
          codeChallengeMethod,
          redirectUri,
          tokenType: OauthTokenType.PERSONAL,
        });

        onAuthorize(code);
      } catch (err) {
        onAuthorize(undefined, err);
      }
    } catch (error) {
      message.handleError(error);
      onAuthorize(undefined, error);
    }
  };

  return (
    <>
      <Stack spacing={4} alignItems="center">
        <Text color="muted" fontSize="sm" textAlign="center">
          <Link
            fontSize="sm"
            color="blue.500"
            href={clientInfo?.clientUri}
            target="_blank"
            rel="noopener noreferrer"
            mr="5px"
            ml="5px"
          >
            {clientInfo?.clientName}
          </Link>
          requests full <b>READ</b> access to your account on your behalf.{" "}
          {clientInfo?.clientName} will have the same read permissions as you in
          all your workspaces.
        </Text>
      </Stack>
      <Stack spacing={4}>
        <Button colorScheme="blue" onClick={handleAuthorize}>
          Authenticate {clientInfo?.clientName}
        </Button>
      </Stack>
    </>
  );
};

export default AccountOauthView;
