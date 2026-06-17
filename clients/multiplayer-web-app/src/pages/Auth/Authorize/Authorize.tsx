import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Button, Stack, Text } from "@chakra-ui/react";
import { useAuth } from "shared/providers/AuthContext";
import useMessage from "shared/hooks/useMessage";
import { useRedirect } from "shared/hooks/useRedirect";
import { getClientInfo } from "shared/services/auth.service";
import { IOauthClient, OauthTokenType } from "@multiplayer/types";
import NoAuthView from "./NoAuthView";
import ProjectOauthView from "./ProjectOauthView";
import AccountOauthView from "./AccountOauthView";
import AuthorizeSessionSelect from "shared/components/AuthorizeSessionSelect";

const Authorize = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const message = useMessage();
  const { user, authorized } = useAuth();
  const { clearRedirect } = useRedirect();
  const [clientInfo, setClientInfo] = useState<Partial<IOauthClient>>(null);
  const [loading, setLoading] = useState(true);
  const [tokenType, setTokenType] = useState<string>(null);

  useEffect(() => {
    if (authorized) {
      clearRedirect();
    }
  }, [authorized, clearRedirect]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const clientId = query.get("client_id");
    const redirectUri = query.get("redirect_uri");
    const responseType = query.get("response_type");
    const tokenTypeParam = query.get("token_type");

    setTokenType(tokenTypeParam);

    const fetchData = async () => {
      try {
        setLoading(true);
        const clientInfo = await getClientInfo(clientId, {
          response_type: responseType,
          redirect_uri: redirectUri,
        });
        setClientInfo(clientInfo);
      } catch (err) {
        message.handleError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [location.search, user]);

  const onAuthorize = async (code: string | undefined, err?: any) => {
    const query = new URLSearchParams(location.search);
    const redirectUri = query.get("redirect_uri");
    const state = query.get("state");

    if (err || !code) {
      window.location.href = `${redirectUri}?error=${
        err?.message || "Unknown error"
      }`;
      return;
    }
    window.location.href = `${redirectUri}?code=${code}&state=${state}`;
  };

  const handleDeny = () => {
    const query = new URLSearchParams(location.search);
    const redirectUri = query.get("redirect_uri");
    window.location.href = `${redirectUri}?error=access_denied`;
  };

  const handleAuth = () => {
    localStorage.setItem("redirectTo", `/auth/authorize${location.search}`);
    navigate("/auth");
  };

  if (loading || !clientInfo) {
    return (
      <Box maxW="700px" padding="12" pb={"6"}>
        <Stack spacing={4} alignItems="center">
          <Text>Loading...</Text>
        </Stack>
      </Box>
    );
  }

  if (!authorized) {
    return <NoAuthView clientInfo={clientInfo} onSignIn={handleAuth} />;
  }

  return (
    <Box maxW="700px" px="12" py={"6"}>
      <Stack spacing={6} alignItems="center">
        <AuthorizeSessionSelect />
        <Text
          fontSize="24px"
          fontWeight="500"
          textAlign="center"
          lineHeight={"36px"}
        >
          Authenticate your {clientInfo?.clientName} session
        </Text>

        {tokenType === OauthTokenType.PERSONAL ? (
          <AccountOauthView clientInfo={clientInfo} onAuthorize={onAuthorize} />
        ) : (
          <ProjectOauthView clientInfo={clientInfo} onAuthorize={onAuthorize} />
        )}

        <Stack spacing={4}>
          <Button variant="outline" onClick={handleDeny}>
            Deny
          </Button>
          <Text
            fontSize="sm"
            color="muted"
            textAlign="center"
            cursor="pointer"
            onClick={handleAuth}
          >
            Change account
          </Text>
        </Stack>
      </Stack>
    </Box>
  );
};

export default Authorize;
