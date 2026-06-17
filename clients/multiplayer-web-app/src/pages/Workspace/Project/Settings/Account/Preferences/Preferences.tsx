import {
  Stack,
  Flex,
  Button,
  Switch,
  Menu,
  MenuButton,
  MenuItem,
  Icon,
  MenuList,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "shared/icons";
import { Content, NARROW_CONTENT_PROPS } from "../../SettingsLayout";
import LabelGroup from "shared/components/LabelGroup";

const Preferences = () => {
  return (
    <Content title="Preferences" contentProps={NARROW_CONTENT_PROPS}>
      <Stack gap="12" spacing="0">
        <Flex alignItems="center">
          <LabelGroup
            flex="1"
            label="Font Size"
            description="Adjust your desired font size."
          />
          <Menu>
            <MenuButton
              w="140px"
              as={Button}
              variant="light"
              rightIcon={<Icon color="muted" as={ChevronDownIcon} />}
            >
              Actions
            </MenuButton>
            <MenuList>
              <MenuItem>Download</MenuItem>
              <MenuItem>Create a Copy</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
        <Flex alignItems="center">
          <LabelGroup
            flex="1"
            label="Language"
            description="Select your primary language."
          />
          <Menu>
            <MenuButton
              w="140px"
              as={Button}
              variant="light"
              rightIcon={<Icon color="muted" as={ChevronDownIcon} />}
            >
              Actions
            </MenuButton>
            <MenuList>
              <MenuItem>Download</MenuItem>
              <MenuItem>Create a Copy</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
        <Flex alignItems="center">
          <LabelGroup
            flex="1"
            label="First day of the week"
            description="Select the first day of the week for the date picker."
          />
          <Menu>
            <MenuButton
              w="140px"
              as={Button}
              variant="light"
              rightIcon={<Icon color="muted" as={ChevronDownIcon} />}
            >
              Actions
            </MenuButton>
            <MenuList>
              <MenuItem>Download</MenuItem>
              <MenuItem>Create a Copy</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
        <Flex alignItems="center">
          <LabelGroup
            flex="1"
            mr="auto"
            maxW="586px"
            label="Show Presence in files"
            description="Enable Presence to achieve a better collaboration. Others will be able to see your cursor,
            and you’ll be able to see theirs."
          />
          <Switch id="filesPresence" />
        </Flex>
        <Flex alignItems="center">
          <LabelGroup
            flex="1"
            label="Developer Preview"
            description="Enable experimental features and easter eggs."
          />
          <Switch id="developerPreview" />
        </Flex>
      </Stack>
    </Content>
  );
};

export default Preferences;
