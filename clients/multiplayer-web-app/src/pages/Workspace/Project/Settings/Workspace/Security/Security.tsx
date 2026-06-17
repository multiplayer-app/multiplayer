import { Box, Button, Flex, Text, Icon, Stack, Switch } from "@chakra-ui/react";
import { LockIcon } from "shared/icons";

import LabelGroup from "shared/components/LabelGroup";
import { Content, NARROW_CONTENT_PROPS } from "../../SettingsLayout";

const Security = () => {
  return (
    <Content title="Security" contentProps={NARROW_CONTENT_PROPS}>
      <Stack gap="12" spacing="0">
        {/* Not in v1 */}
        <Box
          p="4"
          bg="bg.subtle"
          borderRadius="lg"
          border="solid 1px"
          borderColor="border.secondary"
        >
          <Flex alignItems="center" mb="2">
            <Icon
              p="1"
              boxSize="8"
              as={LockIcon}
              borderRadius="8"
              color="body"
            />
            <Text fontWeight="medium">
              Security features require you to switch to a paid plan{" "}
            </Text>
          </Flex>
          <Text color="muted" mb="4">
            Please upgrade your subscription to be able to access advanced
            security features like SAML and SSO.
          </Text>
          <Button isDisabled={true}>Upgrade</Button>
        </Box>

        <Flex alignItems="center">
          <LabelGroup
            flex="1"
            label="SAML"
            description="Allows logins through your SAML identity provider SSO."
          />
          <Button variant="light">Configure</Button>
        </Flex>

        <Flex alignItems="center">
          <LabelGroup
            flex="1"
            label="Google"
            description="Allows logins through Google’s single sign-on functionality."
          />
          <Switch id="google" />
        </Flex>

        <Flex alignItems="center">
          <LabelGroup
            flex="1"
            label="MagicLink"
            description="Allows for a passwordless login through magic links delivered over
            email."
          />
          <Switch id="magic-link" />
        </Flex>
      </Stack>
    </Content>
  );
};

export default Security;
