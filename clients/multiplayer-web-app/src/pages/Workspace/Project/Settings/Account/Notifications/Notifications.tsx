import { Stack, Flex, Switch } from "@chakra-ui/react";

import LabelGroup from "shared/components/LabelGroup";
import { Content, NARROW_CONTENT_PROPS } from "../../SettingsLayout";

const Notifications = () => {
  return (
    <Content title="Notifications" contentProps={NARROW_CONTENT_PROPS}>
      <Stack gap="12" spacing="0">
        <Flex alignItems="center">
          <LabelGroup
            flex="1"
            mr="auto"
            maxW="650px"
            label="Email Notifications"
            description="You will receive instant notifications for your unread notifications. They are grouped together and
            sent based on the urgency of the notifications."
          />
          <Switch id="email" />
        </Flex>

        <Flex alignItems="center">
          <LabelGroup
            flex="1"
            mr="auto"
            maxW="650px"
            label="Desktop notifications"
            description="If you use the Multiplayer app, you’ll receive local notifications and their status will be
            reflected on the app icon."
          />
          <Switch id="desktop" />
        </Flex>
      </Stack>
    </Content>
  );
};

export default Notifications;
