import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { Flex, IconButton, useColorMode } from "@chakra-ui/react";

const ColorModeToggle = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === "dark";

  return (
    <Flex
      alignItems="center"
      borderRadius="full"
      px="1"
      py="0.5"
      bg="bg.primary"
      border="1px solid"
      borderColor="border.secondary"
      boxShadow="sm"
      _hover={{ bg: "bg.subtle", boxShadow: "base" }}
      gap="1"
      role="group"
      onClick={toggleColorMode}
    >
      <IconButton
        aria-label="Light mode"
        size="xs"
        variant="ghost"
        isRound
        icon={<SunIcon />}
        color={isDark ? "muted" : "brand.500"}
        _hover={{ bg: "transparent" }}
      />
      <IconButton
        aria-label="Dark mode"
        size="xs"
        variant="ghost"
        isRound
        icon={<MoonIcon />}
        color={isDark ? "brand.500" : "muted"}
        _hover={{ bg: "transparent" }}
      />
    </Flex>
  );
};

export default ColorModeToggle;
