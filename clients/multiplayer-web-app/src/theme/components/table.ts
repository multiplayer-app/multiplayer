import { tableAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(tableAnatomy.keys);

const baseStyle = definePartsStyle({
  table: {},
  thead: {},
  tbody: {},
  tr: {
    height: "38px",
    background: "bg.primary",
    borderBottom: "1px solid",
    borderColor: "border.secondary",
  },
  th: {
    color: "muted",
    fontWeight: "semibold",
    borderBottom: "solid 1px",
    borderColor: "border.primary",
  },
  td: {},
  tfoot: {},
  caption: {},
});

const sizes = {
  sm: {
    th: {
      px: 0,
      py: "2",
      fontSize: "xs",
    },
    td: {
      px: 0,
      py: "3",
      fontSize: "sm",
    },
  },
  md: {
    tr: {
      height: "38px",
    },
    th: {
      fontSize: "sm",
      px: "3",
      fontWeight: 500,
    },
    td: {
      px: "3",
      position: "relative",
      overflowWrap: "break-word",
      // maxWidth: "300px",
      height: "38px",
      fontSize: "sm",
      fontWeight: 500,
      paddingTop: 0,
      paddingBottom: 0,
      textarea: {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        maxWidth: "365px",
        height: "36px",
        minHeight: "36px",
        paddingLeft: "29px",
        ml: "1px",
        wrap: "break-word",
        resize: "none",
        overflow: "hidden",
        fontSize: "sm",
        fontWeight: "500",
      },
    },
  },
};

const variants = {
  simple: {
    tr: {
      background: "bg.primary",
      borderBottom: "1px solid",
      borderColor: "border.secondary",
    },
    th: {
      color: "body",
      fontFamily: '"Inter", sans-serif',
      borderColor: "border.secondary",
      borderBottomWidth: "1px",
    },
    td: {
      color: "body",
      fontFamily: '"Inter", sans-serif',
      borderColor: "border.secondary",
      borderBottomWidth: "1px",
      background: "bg.primary",
      textarea: {
        color: "subtle",
        background: "bg.primary",
      },
    },
  },
};

export const tableTheme = defineMultiStyleConfig({
  baseStyle,
  sizes,
  variants,
});
