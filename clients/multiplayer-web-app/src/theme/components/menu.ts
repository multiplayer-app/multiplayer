import { menuAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(menuAnatomy.keys);

const baseStyle = definePartsStyle({
  button: {},
  list: { p: "2", borderColor: "border.secondary", bg: "bg.primary" },
  item: {
    borderRadius: "md",
    px: "2",
    color: "body",
    bg: "bg.primary",
    _hover: {
      bg: "bg.subtle",
    },
  },
  groupTitle: {},
  command: {},
  divider: {},
});

export const menuTheme = defineMultiStyleConfig({ baseStyle });
