import { useEffect, useState } from "react";
import { Icon, Button, Grid, Flex } from "@chakra-ui/react";
import { GithubIcon, GitlabIcon, GoogleIcon } from "shared/icons";
import useMessage from "shared/hooks/useMessage";
import LabelGroup from "shared/components/LabelGroup";
import { unlinkAccount } from "shared/services/auth.service";
import { getCurrentUser } from "shared/services/user.service";
import { Content, NARROW_CONTENT_PROPS } from "../../SettingsLayout";
import { config } from "../../../../../../config";

const accounts = [
  {
    key: "github",
    title: "Github",
    description: "Connect your GitHub account.",
    connectedDescription: "Disconnect your GitHub account.",
    icon: GithubIcon,
  },
  {
    key: "gitlab",
    title: "Gitlab",
    description: "Connect your Gitlab account.",
    connectedDescription: "Disconnect your Gitlab account.",
    icon: GitlabIcon,
  },
  {
    key: "google",
    title: "Google",
    description: "Connect your Google account.",
    connectedDescription: "Disconnect your Google account.",
    icon: GoogleIcon,
  },
  // {
  //   key: "bitbucket",
  //   title: "Bitbucket",
  //   description: "Connect your Bitbucket account.",
  //   icon: BitbucketIcon,
  // },
];
const LinkedAccounts = () => {
  const message = useMessage();
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    const getUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };

    if (!currentUser) {
      getUser();
    }
  }, [currentUser]);

  const authPrefix = config.REACT_APP_AUTH_PREFIX;
  const apiBase = config.REACT_APP_API_BASE_URL;
  const redirectUrl = window.location.origin + window.location.pathname;

  const handleDisconnect = async (accountType: string) => {
    try {
      await unlinkAccount(accountType);
      setCurrentUser(null);
      message.success("Account successfully disconnected.");
    } catch (error) {
      message.handleError(error);
    }
  };

  return (
    <Content title="Linked Accounts" contentProps={NARROW_CONTENT_PROPS}>
      <Grid
        gap="4"
        gridTemplateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
        flexWrap="wrap"
      >
        {accounts.map((item) => (
          <Flex
            p="4"
            key={item.key}
            bg="bg.subtle"
            borderRadius="md"
            direction="column"
            border="1px solid"
            borderColor="border.secondary"
            justifyContent="space-between"
          >
            <Flex direction="column">
              <Icon
                as={item.icon}
                p="0.5"
                mb="2"
                boxSize="8"
                borderRadius="md"
                border="1px solid"
                verticalAlign="top"
                borderColor="border.secondary"
              />
              <LabelGroup
                mb="4"
                label={item.title}
                description={
                  currentUser?.profiles && currentUser?.profiles[item.key]
                    ? item.connectedDescription
                    : item.description
                }
              />
            </Flex>

            {currentUser?.profiles && currentUser?.profiles[item.key] ? ( // TODO add disconnect onclick action
              <Button
                w="100%"
                variant="dangerLight"
                onClick={async () => {
                  await handleDisconnect(item.key);
                }}
              >
                Disconnect
              </Button>
            ) : (
              <Button
                as="a"
                w="100%"
                variant="light"
                href={`${apiBase}${authPrefix}/${item.key}/auth?redirectUrl=${redirectUrl}&linkToUserId=${currentUser?._id}`}
              >
                Connect
              </Button>
            )}
          </Flex>
        ))}
      </Grid>
    </Content>
  );
};

export default LinkedAccounts;
