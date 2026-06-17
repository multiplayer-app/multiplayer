import { avatarAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers, defineStyle } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(avatarAnatomy.keys);

const baseStyle = definePartsStyle({
  container: {},
});

const m = defineStyle({
  width: "40px",
  height: "40px",
  fontSize: "sm",
});

const s = defineStyle({
  width: "24px",
  height: "24px",
  fontSize: "sm",
});

const sizes = {
  m: definePartsStyle({ container: m }),
  s: definePartsStyle({ container: s }),
};

export const avatarTheme = defineMultiStyleConfig({ baseStyle, sizes });
