import { modalAnatomy as parts } from "@chakra-ui/anatomy";
import {
  createMultiStyleConfigHelpers,
  defineStyle,
} from "@chakra-ui/styled-system";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(parts.keys);

const baseStyle = definePartsStyle({
  overlay: {
    bg: "blackAlpha.100",
    backdropFilter: "blur(4px)",
  },
  dialogContainer: {
    px: "4",
  },
  dialog: {
    bg: "bg.primary",
    border: "1px solid",
    borderColor: "border.primary",
    boxShadow: "xl",
  },
  footer: {
    // borderTop: "1px solid",
    // borderTopColor: "border.primary",
  },
});

const sizes = {
  "4xl": definePartsStyle({
    dialog: defineStyle({ maxW: "800px", borderRadius: "2xl" }),
  }),
};

export const modalTheme = defineMultiStyleConfig({
  sizes,
  baseStyle,
});
