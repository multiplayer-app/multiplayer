import { defineStyle, defineStyleConfig } from "@chakra-ui/react";

const baseStyle = defineStyle({
  fontWeight: "semibold",
  fontFamily: '"Inter", sans-serif',
});

export const headingTheme = defineStyleConfig({
  baseStyle
});
