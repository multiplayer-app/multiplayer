import { Heading, Box, Flex, Badge } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { OpenAPIV3 } from "openapi-types";
import Body from "../Body";
import SelectDropdown from "shared/components/SelectDropdown";
import { isObject } from "shared/utils";

interface ResponsesProps {
  data: OpenAPIV3.ResponsesObject;
  readonly?: boolean;
}

const Responses = ({ data, readonly }: ResponsesProps) => {
  const [currentType, setCurrentType] = useState<string>();
  const [resTypes, setResTypes] = useState<
    { value: string | number; label: string }[]
  >([]);

  useEffect(() => {
    if (isObject(data)) {
      const resTypes = Object.keys(data)?.map((type) => ({
        value: type,
        label: type,
      }));
      setResTypes(resTypes);
      setCurrentType(resTypes[0]?.value);
    }
  }, [data]);

  if (!isObject(data)) return null;

  const contentByType = data[currentType];

  return (
    <Box mt="8">
      <Flex mb="8" alignItems="center">
        <Heading size="md" mr="auto">
          Responses
        </Heading>
        {readonly ? (
          <Badge
            borderRadius={8}
            border="1px solid"
            borderColor="border.secondary"
            textTransform="unset"
            backgroundColor="bg.primary"
            fontSize="sm"
            fontWeight="medium"
            py={2}
            px={4}
          >
            {currentType}
          </Badge>
        ) : (
          <SelectDropdown
            value={currentType}
            options={resTypes}
            onChange={(opt) => setCurrentType(opt.value)}
          />
        )}
      </Flex>
      {contentByType && (
        <Body
          data={contentByType}
          path={["responses", currentType]}
          readonly={true}
        />
      )}
    </Box>
  );
};

export default Responses;
