import { Button, ButtonProps } from "@chakra-ui/react";
import { forwardRef } from "react";

const BlueButton = forwardRef((props: ButtonProps, ref) => {
  return (
    <Button
      ref={ref}
      size="sm"
      color="inverse"
      variant="base"
      border="1px solid whiteAlpha.50"
      backgroundImage="linear-gradient(180deg, #3C80F6 0%, #2359DF 100%)"
      {...props}
    >
      {props.children}
    </Button>
  );
});

export default BlueButton;
