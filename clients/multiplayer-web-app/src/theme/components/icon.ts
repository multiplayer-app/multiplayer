import { defineStyle, defineStyleConfig } from "@chakra-ui/react";

const baseStyle = defineStyle({
  boxSize: "20px",
});

export const iconTheme = defineStyleConfig({
  baseStyle,
});
