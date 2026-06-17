import { extendTheme } from "@chakra-ui/react";

import { menuTheme } from "./components/menu";
import { iconTheme } from "./components/icon";
import { buttonTheme } from "./components/button";
import { avatarTheme } from "./components/avatar";
import { headingTheme } from "./components/heading";
import { formLabelTheme, inputTheme } from "./components/input";
import { tableTheme } from "./components/table";
import { modalTheme } from "./components/modal";
import { checkboxTheme } from "./components/checkbox";
import { selectTheme } from "./components/select";
import { textareaTheme } from "./components/textarea";
import { tooltipTheme } from "./components/tooltip";
import { tabsTheme } from "./components/tabs";

export default extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        color: "body",
        fontFamily: '"Inter", sans-serif',
        background: "bg.primary",
      },
      "svg, img": {
        display: "initial",
      },
      "*": {
        borderColor: "border.primary",
      },
    },
  },
  semanticTokens: {
    colors: {
      bg: {
        primary: { default: "white", _dark: "black" },
        surface: { default: "gray.50", _dark: "gray.950" },
        subtle: { default: "gray.100", _dark: "gray.900" },
        muted: { default: "gray.200", _dark: "gray.800" },
        highlight: { default: "gray.300", _dark: "gray.600" },
        neutral: { default: "gray.400", _dark: "gray.500" },
        inverse: { default: "gray.700", _dark: "gray.200" },
      },
      border: {
        primary: { default: "gray.100", _dark: "gray.900" },
        secondary: { default: "gray.200", _dark: "gray.800" },
        tertiary: { default: "gray.300", _dark: "gray.700" },
      },
      neutral: { default: "gray.400", _dark: "gray.500" },
      muted: { default: "gray.500", _dark: "gray.400" },
      body: { default: "gray.600", _dark: "gray.300" },
      subtle: { default: "gray.700", _dark: "gray.200" },
      inverse: { default: "white", _dark: "gray.900" },
      input: {
        bg: { default: "bg.primary", _dark: "bg.primary" },
        border: { default: "border.secondary", _dark: "border.secondary" },
        readonly: {
          bg: { default: "bg.surface", _dark: "bg.surface" },
          border: { default: "border.secondary", _dark: "border.secondary" },
        },
      },
    },
  },
  colors: {
    gray: {
      50: "#fafafa",
      100: "#f4f4f5",
      200: "#e4e4e7",
      300: "#d4d4d8",
      400: "#a1a1aa",
      500: "#71717a",
      600: "#52525b",
      700: "#3f3f46",
      800: "#27272a",
      900: "#18181b",
      950: "#111111",
    },
    brand: {
      50: "#eee8fe",
      100: "#d1c6fd",
      200: "#b1a0fd",
      300: "#8e79fe",
      400: "#6e5afd",
      500: "#473cfb",
      600: "#3238f4",
      700: "#0030eb",
      800: "#002ae6",
      900: "#1A2B58",
    },
    yellow: {
      50: "#FFF6E5",
      100: "#FFE7B8",
      200: "#FFD78A",
      300: "#FFC75C",
      400: "#FFB72E",
      500: "#FFA800",
      600: "#CC8600",
      700: "#996500",
      800: "#664300",
      900: "#332200",
    },
    m: {
      blue: "#0069FF",
      green: "#18DE97",
      red: "#E74C3C",
    },
  },
  components: {
    Icon: iconTheme,
    Menu: menuTheme,
    Table: tableTheme,
    Modal: modalTheme,
    Input: inputTheme,
    Select: selectTheme,
    Avatar: avatarTheme,
    Button: buttonTheme,
    Heading: headingTheme,
    Checkbox: checkboxTheme,
    FormLabel: formLabelTheme,
    Tooltip: tooltipTheme,
    Textarea: textareaTheme,
    Tabs: tabsTheme,
  },
});
