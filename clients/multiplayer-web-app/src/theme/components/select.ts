import { selectAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(selectAnatomy.keys);

const variants = {
  outline: definePartsStyle({
    field: {
      bg: "bg.primary",
      _placeholder: { color: "muted" },
      _focus: {
        borderColor: "brand.500",
        boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
      },
    },
  }),
};

const baseStyle = definePartsStyle({
  // define the part you're going to style
});

export const selectTheme = defineMultiStyleConfig({ variants, baseStyle });
