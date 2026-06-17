import {
  Tooltip,
  Icon,
  IconButton,
  IconProps,
  IconButtonProps,
  Box,
} from "@chakra-ui/react";
import useMessage from "shared/hooks/useMessage";
import { ClipboardCopyIcon } from "shared/icons";
import { CheckIcon } from "@chakra-ui/icons";
import { useState } from "react";

interface CopyToClipboardProps
  extends Omit<IconButtonProps, "icon" | "aria-label"> {
  icon?: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & {
      title?: string;
    }
  >;
  label: string;
  value: string;
  iconProps?: IconProps;
}

const CopyToClipboard = ({
  icon,
  label,
  value,
  iconProps = {},
  ...buttonProps
}: CopyToClipboardProps) => {
  const message = useMessage();
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const onCopyID = (e) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(value);
      message.success(`Copied!`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      message.handleError({ message: "Something went wrong!" });
    }
  };

  return (
    <Tooltip label={label}>
      <IconButton
        size="sm"
        variant="ghost"
        borderRadius="md"
        aria-label={label}
        {...buttonProps}
        onClick={onCopyID}
        icon={
          <Box position="relative" display="inline-flex" alignItems="center">
            <Icon
              as={icon || ClipboardCopyIcon}
              ml="0.5"
              color={copied ? "body" : "muted"}
              {...iconProps}
            />
            {copied && (
              <Box
                as="span"
                position="absolute"
                right={-3}
                bottom={-1}
                borderRadius="full"
                bg="m.green"
                boxSize="12px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <CheckIcon boxSize="8px" color="white" />
              </Box>
            )}
          </Box>
        }
      />
    </Tooltip>
  );
};

export default CopyToClipboard;
