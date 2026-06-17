import { Box } from "@chakra-ui/react";
import { OpenAPIV3 } from "openapi-types";
import { getMethodConfigs } from "shared/configs/openApi.configs";

interface MethodProps {
  badge?: boolean;
  name: OpenAPIV3.HttpMethods;
}

const Method = ({ name, badge = true }: MethodProps) => {
  const method = getMethodConfigs(name);
  if (badge) {
    return (
      <Box
        w="12"
        color="inverse"
        lineHeight="6"
        fontSize="0.5rem"
        textAlign="center"
        fontWeight="medium"
        borderRadius="base"
        display="inline-block"
        textDecoration="none"
        bg={method.color}
      >
        {method.label}
      </Box>
    );
  } else {
    return (
      <Box
        fontSize="xs"
        fontWeight="medium"
        display="inline-block"
        color={method.color}
      >
        {method.label}
      </Box>
    );
  }
};

export default Method;
