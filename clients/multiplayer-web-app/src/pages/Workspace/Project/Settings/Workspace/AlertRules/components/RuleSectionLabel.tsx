import { FormLabel } from "@chakra-ui/react";
import { ReactNode } from "react";

interface RuleSectionLabelProps {
  children: ReactNode;
}

const RuleSectionLabel = ({ children }: RuleSectionLabelProps) => (
  <FormLabel
    display="inline-block"
    fontWeight="semibold"
    backgroundColor="brand.500"
    color="white"
    px="6px"
    borderRadius="4px"
    m={0}
  >
    {children}
  </FormLabel>
);

export default RuleSectionLabel;

