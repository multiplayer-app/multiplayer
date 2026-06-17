import { defineStyleConfig } from "@chakra-ui/react";

const baseStyle = {
  fontSize: "xs",
  borderRadius: "md",
  backgroundColor: "bg.inverse",
  color: "inverse",
};

export const tooltipTheme = defineStyleConfig({ baseStyle });
