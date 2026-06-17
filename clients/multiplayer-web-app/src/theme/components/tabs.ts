import { tabsAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(tabsAnatomy.keys);

const lineVariant = definePartsStyle(() => ({
  tab: {
    border: "unset",
    bg: "transparent",
    color: "body",
    fontSize: "var(--chakra-fontSizes-sm)",
    fontWeight: "medium",
    padding: "0 0 12px",
    margin: "0 16px",
    flex: "0",
    position: "relative",
    _selected: {
      color: "brand.600",
      _after: {
        content: "''",
        position: "absolute",
        width: "100%",
        height: "3px",
        bottom: "0",
        borderRadius: "3px 3px 0 0",
        backgroundColor: "brand.500",
      },
    },
  },
  tablist: {
    borderBottom: "1px solid",
    borderBottomColor: "border.primary",
  },
}));

const reverseVariant = definePartsStyle(() => ({
  tab: {
    border: "unset",
    bg: "transparent",
    color: "body",
    fontSize: "var(--chakra-fontSizes-sm)",
    fontWeight: "medium",
    padding: "8px 0 0",
    marginRight: 4,
    flex: "0",
    justifyContent: "flex-start",
    position: "relative",
    _after: {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "4px",
      top: "-4px",
      borderRadius: "2px",
      backgroundColor: "border.secondary",
    },
    _selected: {
      color: "subtle",
      _after: {
        backgroundColor: "brand.500",
      },
    },
  },
}));

const variants = {
  line: lineVariant,
  reverse: reverseVariant,
};

export const tabsTheme = defineMultiStyleConfig({ variants });
