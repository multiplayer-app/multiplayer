import { inputAnatomy } from "@chakra-ui/anatomy";
import {
  createMultiStyleConfigHelpers,
  defineStyleConfig,
  defineStyle,
} from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(inputAnatomy.keys);

const baseStyle = definePartsStyle({
  field: {
    _readOnly: {
      bg: "input.readonly.bg",
      borderColor: "input.readonly.border",
      cursor: "not-allowed",
      color: "body",
      _focus: {
        borderColor: "input.readonly.border",
        boxShadow: "0 0 0 1px var(--chakra-colors-input-readonly-border)",
      },
    },
  },
});

const md = defineStyle({
  fontSize: "sm",
});

const variants = {
  outline: definePartsStyle({
    field: {
      bg: "input.bg",
      borderColor: "input.border",
      _placeholder: { color: "muted" },
      _focus: {
        borderColor: "brand.500",
        boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
      },
    },
  }),
};

const sizes = {
  md: definePartsStyle({ field: md, addon: md }),
};

export const inputTheme = defineMultiStyleConfig({
  sizes,
  variants,
  baseStyle,
});

export const formLabelTheme = defineStyleConfig({
  baseStyle: defineStyle({
    fontSize: "sm",
    mb: 1,
  }),
});
