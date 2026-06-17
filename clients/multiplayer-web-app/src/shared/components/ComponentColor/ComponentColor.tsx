import {
  Menu,
  MenuButton,
  Button,
  Flex,
  Portal,
  MenuList,
  MenuItem,
  Box,
} from "@chakra-ui/react";
import {
  PlatformComponentColors,
  PlatformComponentColorEnum,
} from "@multiplayer/types";
import { ChevronDownIcon } from "shared/icons";

interface ComponentColorProps {
  readonly?: boolean;
  disabled?: boolean;
  value: PlatformComponentColorEnum | null;
  onChange: (val: PlatformComponentColorEnum | "") => void;
}

const ComponentColor = ({
  value,
  onChange,
  readonly,
  disabled,
}: ComponentColorProps) => {
  return (
    <Menu>
      <MenuButton
        px={4}
        py={2}
        as={Button}
        w="full"
        h="auto"
        variant="light"
        boxShadow="none"
        fontWeight="inherit"
        isDisabled={readonly || disabled}
        _disabled={{ opacity: 1, cursor: "default" }}
        rightIcon={<ChevronDownIcon />}
        borderRadius="md"
        leftIcon={
          value ? (
            <Box
              boxSize="6"
              border="solid 1px"
              borderRadius="base"
              bg={PlatformComponentColors[value][0]}
              borderColor={PlatformComponentColors[value][1]}
            />
          ) : null
        }
        _hover={{ boxShadow: "none" }}
      >
        <Flex
          alignItems="center"
          textTransform="capitalize"
          justifyContent="space-between"
        >
          {value || "Default"}
        </Flex>
      </MenuButton>
      <Portal>
        <MenuList maxH="240px" overflow="auto" zIndex="popover">
          <MenuItem textTransform="capitalize" onClick={() => onChange("")}>
            Default
          </MenuItem>
          {Object.keys(PlatformComponentColors).map((key) => (
            <MenuItem
              key={key}
              textTransform="capitalize"
              onClick={() => onChange(key as PlatformComponentColorEnum)}
              icon={
                <Box
                  boxSize="6"
                  border="solid 1px"
                  borderRadius="base"
                  bg={PlatformComponentColors[key][0]}
                  borderColor={PlatformComponentColors[key][1]}
                />
              }
            >
              {key}
            </MenuItem>
          ))}
        </MenuList>
      </Portal>
    </Menu>
  );
};

export default ComponentColor;
