import { Flex, Box, Heading, Badge } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { getNestedProperty, isObject, setNestedProperty } from "shared/utils";
import SchemaTree from "../../SchemaTree";
import SelectDropdown from "shared/components/SelectDropdown";
import { OpenAPIV3 } from "openapi-types";
import {
  isSchemaObject,
  isReferenceObject,
} from "shared/helpers/openApi.helpers";
import Description from "../Description";
import { useOpenApi } from "shared/providers/OpenApiContext";

const Body = ({
  data,
  path,
  readonly,
}: {
  path: string[];
  data:
    | OpenAPIV3.ReferenceObject
    | OpenAPIV3.RequestBodyObject
    | OpenAPIV3.ResponseObject;
  readonly?: boolean;
}) => {
  const { onMethodChange } = useOpenApi();
  const [currentType, setCurrentType] = useState<string>();
  const [contentTypes, setContentTypes] = useState<
    { value: string | number; label: string }[]
  >([]);
  const isRef = !!isReferenceObject(data);

  useEffect(() => {
    if (data && !isRef && data.content) {
      const contentTypes = Object.keys(data.content)?.map((type) => ({
        value: type,
        label: type,
      }));
      if (contentTypes[0].value !== currentType) {
        setContentTypes(contentTypes);
        setCurrentType(contentTypes[0].value);
      }
    }
  }, [isRef, data, currentType]);

  if (!isObject(data)) return null;
  const descriptionPath = path.concat(["description"]);
  const contentPath = isRef ? [] : ["content", currentType];
  const contentByType = getNestedProperty(data, contentPath);

  return (
    <Flex mt="8" gap="6" direction="column">
      <Flex alignItems="center">
        <Heading size="sm" mr="auto">
          Body
        </Heading>

        {contentTypes.length ? (
          readonly ? (
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
              options={contentTypes}
              onChange={(opt) => setCurrentType(opt.value)}
            />
          )
        ) : null}
      </Flex>

      {!isRef && (
        <Description
          rows={2}
          path={descriptionPath}
          value={data.description}
          readonly={readonly}
          onChange={(description) => {
            const newData = {};
            setNestedProperty(newData, descriptionPath, description);
            onMethodChange(newData);
          }}
        />
      )}
      <Box>
        <Heading size="xs" mb="4">
          Content
        </Heading>
        <BodyContent value={contentByType} path={path.concat(contentPath)} />
      </Box>
    </Flex>
  );
};

const BodyContent = ({
  value,
  path,
}: {
  value: OpenAPIV3.MediaTypeObject;
  path: string[];
}) => {
  if (!isObject(value)) return null;

  if (isSchemaObject(value)) {
    return <SchemaTree schema={value.schema} path={path} />;
  }
  if (isReferenceObject(value)) {
    return <SchemaTree schema={value} path={path} />;
  }
  return null;
};

export default Body;
