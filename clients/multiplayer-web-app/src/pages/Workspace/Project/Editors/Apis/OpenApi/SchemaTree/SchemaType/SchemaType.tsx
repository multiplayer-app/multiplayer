import { Fragment } from "react";
import { Flex, Link } from "@chakra-ui/react";
import { useOpenApi } from "shared/providers/OpenApiContext";
import { getRefName, getRefSchema } from "shared/helpers/openApi.helpers";

import Type from "../../Details/Type";

const SchemaType = ({ schema, refKey = "" }) => {
  const { components } = useOpenApi();
  const { type, oneOf, allOf, anyOf, items, format, $ref } = schema;

  if (type) {
    switch (type) {
      case "object":
        return (
          <Flex display="inline-flex">
            <Type value={type} />
            {refKey && <Type value={`(${refKey})`} />}
          </Flex>
        );
      case "array":
        const subtype = items && (items.type || getRefName(items.$ref));
        return (
          <Flex display="inline-flex">
            <Type value={type} />
            {subtype && <Type value={`[${subtype}]`} />}
          </Flex>
        );
      default:
        return refKey ? (
          <Type value={refKey} />
        ) : (
          <Flex display="inline-flex">
            <Type value={type} />
            {format && <Type value={`<${format}>`} />}
          </Flex>
        );
    }
  }

  if ($ref) {
    if ($ref.startsWith("#")) {
      const ref = getRefSchema(schema, components);
      return <SchemaType schema={ref} refKey={getRefName($ref)} />;
    } else {
      return (
        <Link href={$ref} target="_parent">
          <Type value={getRefName($ref)} />;
        </Link>
      );
    }
  }

  const oneOrAnyOf = oneOf || anyOf || allOf;
  if (oneOrAnyOf) {
    return (
      <Flex gap="2">
        {oneOrAnyOf.map((item, index) => (
          <Fragment key={index}>
            {index > 0 && (allOf ? " and" : " or ")}
            <SchemaType schema={item} />
          </Fragment>
        ))}
      </Flex>
    );
  }
  if (items) {
    const subtype = items && (items.type || getRefName(items.$ref));
    return (
      <Flex display="inline-flex">
        <Type value={type} />
        {subtype && <Type value={`array[${subtype}]`} />}
      </Flex>
    );
  }

  // TODO: handle allOf
  console.log(
    "%c RenderType",
    "background: #222; color: #bada55",
    JSON.stringify(schema)
  );
  return null;
};

export default SchemaType;
