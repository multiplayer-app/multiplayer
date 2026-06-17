import { Flex, Text } from "@chakra-ui/react";
import { getEnumsSchema } from "shared/helpers/openApi.helpers";
import { useOpenApi } from "shared/providers/OpenApiContext";
import PropertyValueTag from "../PropertyValueTag";

const Enums = ({ schema }) => {
  const { components } = useOpenApi();
  const enumSchema = getEnumsSchema(schema, components);
  if (!enumSchema.enum) return;
  return (
    <Flex gap="2">
      <Text fontSize="smaller" whiteSpace="nowrap" color="muted" py="1">
        Allowed values:
      </Text>
      <Flex gap="2" flexWrap="wrap">
        {enumSchema.enum.map((e) => (
          <PropertyValueTag key={e}>{e}</PropertyValueTag>
        ))}
      </Flex>
    </Flex>
  );
};

export default Enums;
