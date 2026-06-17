import {
  Tooltip,
  IconButton as ChakraIconButton,
  IconButtonProps as ChakraIconButtonProps,
} from "@chakra-ui/react";

interface IconButtonProps extends Omit<ChakraIconButtonProps, "aria-label"> {
  label: string;
}

const IconButton = ({ label, ...props }: IconButtonProps) => {
  return (
    <Tooltip label={label} openDelay={500}>
      <ChakraIconButton aria-label={label} {...props} />
    </Tooltip>
  );
};

export default IconButton;
