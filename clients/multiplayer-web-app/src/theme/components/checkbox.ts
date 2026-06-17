import { checkboxAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(checkboxAnatomy.keys);

const baseStyle = definePartsStyle({
  control: {
    borderWidth: "1px",
    borderColor: "var(--chakra-colors-gray-300)",
  },
});

export const checkboxTheme = defineMultiStyleConfig({
  baseStyle,
  defaultProps: {
    colorScheme: "brand",
  },
});
