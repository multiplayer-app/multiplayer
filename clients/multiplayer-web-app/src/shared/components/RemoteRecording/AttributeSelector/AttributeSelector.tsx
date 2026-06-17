import { memo } from "react";
import { Box, Select, Text } from "@chakra-ui/react";
import { RemoteRecordingResourceAttributes } from "shared/models/enums";

const attributeOptions = [
  {
    value: RemoteRecordingResourceAttributes.SESSION_ATTRIBUTES,
    label: "Session Attributes",
  },
  {
    value: RemoteRecordingResourceAttributes.RESOURCE_ATTRIBUTES,
    label: "Resource Attributes",
  },
  {
    value: RemoteRecordingResourceAttributes.USER_ATTRIBUTES,
    label: "User Attributes",
  },
];

const AttributeSelector = memo(({ register, rowIndex, basePath }: any) => {
  const fieldBase = basePath 
    ? `${basePath}.conditions.start.${rowIndex}`
    : `conditions.start.${rowIndex}`;
  const fieldName = `${fieldBase}.attributeRoot`;

  return (
    <Box w={{ base: "100%", md: "auto" }}>
      <Text fontSize="sm" color="subtle" fontWeight="medium" mb={1}>
        Type
      </Text>
      <Select
        w="auto"
        size="sm"
        height="40px"
        borderRadius="6px"
        {...register(fieldName)}
      >
        {attributeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </Box>
  );
});

export default AttributeSelector;
