import { useMemo, useState } from "react";
import {
  Box,
  Flex,
  Icon,
  Text,
  Collapse,
  IconButton,
  Link,
} from "@chakra-ui/react";
import { OpenAPIV3 } from "openapi-types";
import { EntityCommitChangeType } from "@multiplayer/types";

import { ChevronRightIcon } from "shared/icons";
import {
  parseRef,
  hasChildren,
  getRefSchema,
  getSchemaType,
  isArraySchema,
  hasRelativeRef,
  isReferenceObject,
} from "shared/helpers/openApi.helpers";
import { getNestedProperty, isObject } from "shared/utils";
import { useOpenApi } from "shared/providers/OpenApiContext";

import Enums from "./Enums";
import SchemaType from "./SchemaType";
import ParameterTag from "./ParameterTag";
import AdditionalFields from "./AdditionalFields";
import VisibilityController from "../VisibilityController";

interface SchemaTreeProps {
  path?: string[];
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;
}

const SchemaTree = ({ schema, path = [] }: SchemaTreeProps) => {
  const { components } = useOpenApi();
  if (!isObject(schema)) return null;

  // is ref schema
  if (isReferenceObject(schema)) {
    if (hasRelativeRef(schema)) {
      const nestedSchema = getRefSchema(schema, components);
      const path = ["components", parseRef(schema.$ref).join(":")];
      return <SchemaTree schema={nestedSchema} path={path} />;
    } else {
      return (
        <Link href={schema.$ref} target="_blank">
          Open in new tab
        </Link>
      );
    }
  }

  if (isArraySchema(schema)) {
    if (!path.length) {
      return <SchemaTree schema={schema.items} path={path} />;
    } else {
      return (
        <Box>
          <RenderProperty
            schema={schema.items}
            path={path.concat("items")}
            property={getSchemaType(schema)}
          />
        </Box>
      );
    }
  }

  if (schema.properties) {
    return (
      <RenderProperties
        path={path}
        required={schema.required}
        properties={schema.properties}
      />
    );
  }

  // is All off
  if (schema.allOf) {
    return (
      <>
        {schema.allOf.map((item, index) => (
          <Box key={index}>
            {index > 0 && <RenderDivider>and</RenderDivider>}
            <SchemaTree schema={item} path={path} />
            {/* <RenderProperty
              property={getSchemaType(item)}
              path={path}
              schema={item}
            /> */}
          </Box>
        ))}
      </>
    );
  }

  // is oneOf or anyOf
  const oneOrAnyOf = schema.oneOf || schema.anyOf;
  if (oneOrAnyOf) {
    return (
      <>
        {oneOrAnyOf.map((item, index) => (
          <Box key={index}>
            {index > 0 && <RenderDivider>or</RenderDivider>}
            {/* <SchemaTree data={data} schema={item} /> */}
            <RenderProperty
              schema={item}
              property={getSchemaType(item)}
              path={path.concat([schema.oneOf ? "oneOf" : "anyOf"])}
            />
          </Box>
        ))}
      </>
    );
  }

  if (schema.type) {
    return (
      <RenderProperty
        path={path}
        schema={schema}
        property={schema.enum ? "enum" : ""}
      />
    );
  }

  console.log(
    "%c SchemaTree - Unhandled Schema:",
    "background: #222; color: #bada55",
    JSON.stringify(schema)
  );

  return null;
};

export const RenderProperties = ({ properties, required, path }) => {
  const { changes, changeTypes, isRadarView } = useOpenApi();

  const additionalProperties = useMemo(() => {
    const basePath = path.concat(["properties"]);
    return Object.entries(getNestedProperty(changes, basePath, {})).reduce(
      (acc, [key, val]) => {
        const changeType = changeTypes.get(basePath.concat([key]).join("."));
        if (
          changeType === EntityCommitChangeType.DELETE ||
          (isRadarView && changeType === EntityCommitChangeType.CREATE)
        ) {
          acc[key] = val[0];
        }
        return acc;
      },
      {}
    );
  }, [changes, isRadarView, path]);

  const allProperties = Object.assign({}, properties, additionalProperties);

  return (
    <>
      {Object.entries(allProperties).map(([key, value]) => {
        if (!isObject(value)) return null;
        const isRequired = value["required"] || required?.includes(key);
        return (
          <RenderProperty
            key={key}
            property={key}
            schema={value}
            required={isRequired}
            path={path.concat(["properties"])}
          />
        );
      })}
    </>
  );
};

export const RenderProperty = ({
  property = null,
  required = false,
  schema,
  path = [],
}) => {
  const {
    components,
    getVisibility,
    getVisibilityStyles,
    getHighlightingStyles,
    changeTypes,
    changes,
  } = useOpenApi();

  const [collapsed, setCollapsed] = useState(true);
  const isParentProperty = hasChildren(schema, components);
  const propertyPath = path.concat([property]);
  const propertyChanges = getNestedProperty(changes, propertyPath);
  const changeType =
    changeTypes.get(propertyPath.join(".")) || changeTypes.get(schema.$ref);

  return (
    <VisibilityController changeType={changeType}>
      <Box {...getVisibilityStyles(changeType)}>
        <Flex
          py="3"
          gap="2"
          borderLeft="1px"
          direction="column"
          borderLeftColor="border.secondary"
        >
          <Flex alignItems="center" role="group" gap="4">
            <Flex w="10" gap="1" alignItems="center">
              <Box
                as="span"
                flex="1"
                borderTop="1px"
                borderTopColor="bg.muted"
              />
              {isParentProperty && (
                <IconButton
                  size="xs"
                  variant="base"
                  aria-label="collapse"
                  icon={
                    <Icon
                      as={ChevronRightIcon}
                      transform={`rotate(${collapsed ? 0 : 90}deg)`}
                    />
                  }
                  onClick={() => setCollapsed((prev) => !prev)}
                />
              )}
            </Flex>

            {property && (
              <ParameterTag {...getHighlightingStyles(changeType)}>
                {property}
              </ParameterTag>
            )}
            <SchemaType schema={schema} />
            <Box
              as="hr"
              flex="1"
              opacity="0"
              transition="all .3s ease-in-out"
              _groupHover={{ opacity: "1" }}
            />
            {(schema.readOnly || schema.writeOnly || required) && (
              <Flex alignItems="center" ml="2" gap="4">
                {schema.readOnly && (
                  <Text color="muted" fontSize="small">
                    read-only
                  </Text>
                )}
                {schema.writeOnly && (
                  <Text color="muted" fontSize="small">
                    write-only
                  </Text>
                )}
                {required && (
                  <Text color="red.500" fontSize="small">
                    Required
                  </Text>
                )}
              </Flex>
            )}
          </Flex>

          {/* Body */}
          <Flex pl="12" gap="2" direction="column" _empty={{ display: "none" }}>
            <RenderDescription schema={schema} />
            <AdditionalFields schema={schema} changes={propertyChanges} />
            <Enums schema={schema} />
          </Flex>
        </Flex>

        {/* Children */}
        <Collapse in={!collapsed} unmountOnExit={true}>
          <Box pl="12">
            {isParentProperty && <SchemaTree schema={schema} />}
          </Box>
        </Collapse>
      </Box>
    </VisibilityController>
  );
};

export const RenderDescription = ({ schema }) => {
  const { components } = useOpenApi();
  const { description } = hasRelativeRef(schema)
    ? getRefSchema(schema, components)
    : schema;
  if (description) {
    return <Text fontSize="small">{description}</Text>;
  }
  return null;
};

export const RenderDivider = ({ children }) => {
  return (
    <Flex alignItems="center" gap="2">
      <Box as="hr" flex="1" />
      {children}
      <Box as="hr" flex="1" />
    </Flex>
  );
};

export default SchemaTree;
