import { defineStyle, defineStyleConfig } from "@chakra-ui/react";

const baseStyle = defineStyle({
  fontWeight: "medium",
  fontFamily: '"Inter", sans-serif',
  textAlign: "center",
});

const primary = defineStyle({
  bg: "brand.500",
  color: "white",
  boxShadow: "sm",
  border: "1px solid",
  borderColor: "brand.500",
  _hover: {
    bg: "brand.700",
    borderColor: "brand.700",
    boxShadow: "base",
  },
  _disabled: {
    _hover: {
      bg: "brand.500 !important",
      borderColor: "brand.700  !important",
    },
  },
});

const danger = defineStyle({
  bg: "red.500",
  color: "white",
  boxShadow: "sm",
  border: "1px solid",
  borderColor: "red.500",
  _hover: {
    bg: "red.600",
    borderColor: "red.600",
    boxShadow: "base",
  },
});

const secondary = defineStyle({
  bg: "brand.900",
  color: "white",
  boxShadow: "sm",
  border: "1px solid",
  borderColor: "brand.900",
  _hover: {
    bg: "brand.900",
    boxShadow: "base",
  },
});

const light = defineStyle({
  bg: "bg.primary",
  color: "body",
  border: "1px solid",
  borderColor: "border.secondary",
  boxShadow: "sm",
  _hover: {
    bg: "bg.subtle",
    boxShadow: "base",
  },
});
const dangerLight = defineStyle({
  bg: "bg.primary",
  color: "red.600",
  border: "1px solid",
  borderColor: "red.500",
  boxShadow: "sm",
  _hover: {
    bg: "bg.subtle",
    boxShadow: "base",
  },
});

const success = defineStyle({
  bg: "green.500",
  color: "white",
  border: "1px solid",
  borderColor: "green.500",
  boxShadow: "sm",
});

const successLight = defineStyle({
  bg: "green.50",
  color: "green.600",
  border: "1px solid",
  borderColor: "green.500",
  boxShadow: "sm",
  _hover: {
    boxShadow: "base",
  },
});

const base = defineStyle({
  bg: "none",
  color: "body",
  border: "1px solid",
  borderColor: "transparent",
  textAlign: "left",
});

const link = defineStyle({
  color: "brand.500",
  _hover: {
    textDecoration: "none",
  },
});

const outline = defineStyle({
  color: "body",
});

export const buttonTheme = defineStyleConfig({
  baseStyle,
  sizes: {
    xxs: {
      h: "5",
      fontSize: "sm",
      borderRadius: "base",
    },
    xs: {
      h: "6",
      fontSize: "sm",
      borderRadius: "base",
    },
    sm: {
      h: "8",
      fontSize: "sm",
      borderRadius: "16px",
    },
    md: {
      h: "40px",
      px: "18px",
      fontSize: "sm",
      borderRadius: "8px",
    },
    lg: {
      h: "44px",
      px: "12px",
      fontSize: "sm",
      borderRadius: "20px",
    },
  },
  variants: {
    primary,
    secondary,
    light,
    link,
    base,
    danger,
    dangerLight,
    success,
    successLight,
    outline,
  },
  defaultProps: {
    size: "md",
    variant: "primary",
  },
});
