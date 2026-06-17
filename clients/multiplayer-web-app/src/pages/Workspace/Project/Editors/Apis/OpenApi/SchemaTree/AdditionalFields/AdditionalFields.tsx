import { Flex, FlexProps } from "@chakra-ui/react";
import PropertyValueTag from "../PropertyValueTag";
import { getChangeType } from "shared/helpers/changes.helpers";
import { getNestedProperty } from "shared/utils";
import { EntityCommitChangeType } from "@multiplayer/types";
import { useOpenApi } from "shared/providers/OpenApiContext";

interface AdditionalFieldsProps extends FlexProps {
  schema: any;
  changes?: any;
}

/**
 * array
 *  - uniqueItems: boolean
 *  - minItems: number
 *  - maxItems: number
 * string
 *  - pattern:  regexp
 *  - minLength: number
 *  - maxLength: number
 * number
 *  - multipleOf: number
 *  - minimum: number
 *  - exclusiveMinimum: boolean
 *  - maximum: number
 *  - exclusiveMaximum: boolean
 */
const AdditionalFields = ({
  schema,
  changes = {},
  ...rest
}: AdditionalFieldsProps) => {
  const { getHighlightingStyles } = useOpenApi();
  const isEmpty = !Object.keys(additionalFields).some(
    (key) => schema.hasOwnProperty(key) || changes.hasOwnProperty(key)
  );

  if (isEmpty) return null;

  return (
    <Flex gap="2" {...rest}>
      {Object.keys(additionalFields).map((key) => {
        const contentFn = additionalFields[key];
        const paramChange = getNestedProperty(changes, [key]);
        const changeType = getChangeType(paramChange);

        if (schema.hasOwnProperty(key)) {
          const value = schema[key];
          return (
            <PropertyValueTag key={key} {...getHighlightingStyles(changeType)}>
              {contentFn(value, schema)}
            </PropertyValueTag>
          );
        }
        if (paramChange && changeType === EntityCommitChangeType.DELETE) {
          return (
            <PropertyValueTag
              key={key}
              {...getHighlightingStyles(EntityCommitChangeType.DELETE)}
            >
              {contentFn(changes[key][0], schema)}
            </PropertyValueTag>
          );
        }
        return null;
      })}
    </Flex>
  );
};

const additionalFields = {
  uniqueItems: (value) => <>unique items: {value}</>,
  minItems: (value) => <>&gt;= {value} items</>,
  maxItems: (value) => <>&lt;= {value} items</>,
  pattern: (value) => <>&pattern: {value}</>,
  min: (value) => <>&gt;= {value}</>,
  max: (value) => <>&lt;= {value}</>,
  minLength: (value) => <>&gt;= {value} characters</>,
  maxLength: (value) => <>&lt;= {value} characters</>,
  multipleOf: (value) => <>multiple of {value}</>,
  minimum: (value, allFields) => (
    <>
      &gt;{!allFields.exclusiveMinimum ? "" : "="} {value}
    </>
  ),
  maximum: (value, allFields) => (
    <>
      &lt;{!allFields.exclusiveMaximum ? "" : "="} {value}
    </>
  ),
};

export default AdditionalFields;
