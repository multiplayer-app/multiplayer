import { TooltipProps as ChakraTooltipProps } from "@chakra-ui/react";
import { Tooltip as ChakraTooltip, Box } from "@chakra-ui/react";
import { useMemo } from "react";
import { formatKeyboardShortcutForDisplay } from "shared/utils";

interface TooltipProps extends ChakraTooltipProps {
  command?: string;
}

// Component for rendering a complete keyboard shortcut
const ShortcutDisplay = ({ shortcut }: { shortcut: string }) => {
  const formattedShortcut = useMemo(() => {
    return formatKeyboardShortcutForDisplay(shortcut, false);
  }, [shortcut]);

  // Split the shortcut into individual keys
  const keys = useMemo(() => {
    return formattedShortcut.split(/([⌘⌥⇧])/).filter(Boolean);
  }, [formattedShortcut]);

  return (
    <>
      {keys.map((key, index) => (
        <Box as="span" key={index}>
          {key}
        </Box>
      ))}
    </>
  );
};

const Tooltip = (props: TooltipProps) => {
  const { command, label, ...rest } = props;

  return (
    <ChakraTooltip
      {...rest}
      label={
        <>
          {label}
          {command && (
            <Box ml="2" gap="1" as="span" color="muted" display="inline-flex">
              <ShortcutDisplay shortcut={command} />
            </Box>
          )}
        </>
      }
    >
      {props.children}
    </ChakraTooltip>
  );
};

export default Tooltip;
