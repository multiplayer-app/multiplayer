// theme.ts
import { extendTheme, ThemeConfig } from "@chakra-ui/react";
import { menuTheme } from "../../theme/components/menu";
import { iconTheme } from "../../theme/components/icon";
import { tabsTheme } from "../../theme/components/tabs";
import { tableTheme } from "../../theme/components/table";
import { modalTheme } from "../../theme/components/modal";
import { selectTheme } from "../../theme/components/select";
import { avatarTheme } from "../../theme/components/avatar";
import { buttonTheme } from "../../theme/components/button";
import { tooltipTheme } from "../../theme/components/tooltip";
import { headingTheme } from "../../theme/components/heading";
import { checkboxTheme } from "../../theme/components/checkbox";
import { textareaTheme } from "../../theme/components/textarea";
import { formLabelTheme, inputTheme } from "../../theme/components/input";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

export default extendTheme({
  config,
  styles: {
    global: {
      body: {
        bg: "var(--vscode-editor-background)",
        color: "var(--vscode-editor-foreground)",
        fontFamily: '"Inter", sans-serif',
      },
      "*:focus-visible": {
        outlineColor: "var(--vscode-focusBorder)",
      },
      "svg, img": { display: "initial" },
    },
  },
  semanticTokens: {
    colors: {
      bg: {
        primary: "var(--vscode-editor-background)",
        surface: "blackAlpha.100", //"var(--vscode-panel-background)",
        subtle: "var(--vscode-list-hoverBackground)",
        muted: "var(--vscode-list-inactiveSelectionBackground)",
        highlight: "var(--vscode-list-activeSelectionBackground)",
        inverse: "var(--vscode-list-activeSelectionBackground)",
      },
      border: {
        primary: "var(--vscode-panel-border)",
        secondary: "var(--vscode-dropdown-border)",
        tertiary: "var(--vscode-dropdown-border)",
      },
      muted: { default: "var(--vscode-descriptionForeground)" },
      body: { default: "var(--vscode-editor-foreground)" },
      subtle: { default: "var(--vscode-editor-foreground)" },
      inverse: { default: "var(--vscode-button-foreground)" },
      // Additional VSCode-specific tokens
      input: {
        bg: { default: "var(--vscode-input-background)" },
        border: { default: "var(--vscode-dropdown-border)" },
        readonly: {
          bg: { default: "bg.surface" },
          border: { default: "border.secondary" },
        },
      },
    },
  },
  colors: {
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
    Input: {
      ...inputTheme,
      variants: {
        ...(inputTheme as any).variants,
        outline: {
          field: {
            bg: "var(--vscode-input-background)",
            borderColor: "var(--vscode-dropdown-border)",
            color: "var(--vscode-input-foreground)",
            _hover: {
              borderColor: "var(--vscode-dropdown-border)",
            },
            _placeholder: {
              color: "var(--vscode-input-placeholderForeground)",
            },
            _focusVisible: {
              borderColor: "var(--vscode-focusBorder)",
              boxShadow: "0 0 0 1px var(--vscode-focusBorder)",
            },
          },
        },
      },
    },
    Select: selectTheme,
    Avatar: avatarTheme,
    Button: {
      ...buttonTheme,
      variants: {
        ...(buttonTheme as any).variants,
        light: {
          ...(buttonTheme as any).variants.light,
          bg: "var(--vscode-button-background)",
          color: "var(--vscode-button-foreground)",
          borderColor: "transparent",
          _hover: {
            bg: "var(--vscode-button-hoverBackground)",
            borderColor: "transparent",
          },
          _focusVisible: { boxShadow: "0 0 0 1px var(--vscode-focusBorder)" },
        },
        solid: {
          ...(buttonTheme as any).variants.solid,
          bg: "var(--vscode-button-background)",
          color: "var(--vscode-button-foreground)",
          borderColor: "transparent",
          _hover: {
            bg: "var(--vscode-button-hoverBackground)",
            borderColor: "transparent",
          },
          _focusVisible: { boxShadow: "0 0 0 1px var(--vscode-focusBorder)" },
        },
        ghost: {
          color: "var(--vscode-button-foreground)",
        },
      },
    },
    Heading: headingTheme,
    Checkbox: checkboxTheme,
    FormLabel: formLabelTheme,
    Tooltip: tooltipTheme,
    Textarea: textareaTheme,
    Tabs: tabsTheme,
  },
});
