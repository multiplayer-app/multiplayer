import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Box,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { SUPPORTED_LANGUAGES } from "shared/configs/wizard.configs";

const LanguageDropdown = ({ selectedLanguage, setSelectedLanguage }) => {
  return (
    <Box mb={3}>
      <Menu>
        <MenuButton
          as={Button}
          rightIcon={<ChevronDownIcon />}
          fontWeight="semibold"
          border="1px solid"
          borderColor="border.secondary"
        >
          {selectedLanguage}
        </MenuButton>
        <MenuList>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <MenuItem
              key={lang.value}
              onClick={() => setSelectedLanguage(lang.value)}
            >
              {lang.label}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Box>
  );
};

export default LanguageDropdown;
