import { defineStyle, defineStyleConfig } from "@chakra-ui/react";

const variants = {
  outline: defineStyle({
    bg: "bg.primary",
    borderColor: "border.secondary",
    _placeholder: { color: "muted" },
    _focus: {
      borderColor: "brand.500",
      boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
    },
    _hover: {
      borderColor: "border.tertiary",
    },
    _readOnly: {
      bg: "bg.primary",
      cursor: "not-allowed",
      color: "body",
      _focus: {
        borderColor: "border.secondary",
        boxShadow: "0 0 0 1px var(--chakra-colors-border-secondary)",
      },
    },
  }),
};

export const textareaTheme = defineStyleConfig({ variants });
