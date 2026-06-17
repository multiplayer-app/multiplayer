import { useMemo } from "react";
import { Box, Flex, Text, Heading } from "@chakra-ui/react";

import Type from "../Type";
import Body from "../Body";
import SchemaTree from "../../SchemaTree";
import Enums from "../../SchemaTree/Enums";
import SchemaType from "../../SchemaTree/SchemaType";
import ParameterTag from "../../SchemaTree/ParameterTag";
import AdditionalFields from "../../SchemaTree/AdditionalFields";
import { EntityCommitChangeType } from "@multiplayer/types";
import { useOpenApi } from "shared/providers/OpenApiContext";
import VisibilityController from "../../VisibilityController";

const Requests = ({ data, readonly }: { data: any; readonly?: boolean }) => {
  return (
    <Flex direction="column" gap="8">
      <Heading size="md">Request</Heading>
      <Security value={data.security} />
      <ParametersGroup value={data.parameters} />
      <Body
        data={data.requestBody}
        path={["requestBody"]}
        readonly={readonly}
      />
    </Flex>
  );
};

const Security = ({ value }) => {
  if (!Array.isArray(value)) return null;
  return (
    <Box>
      {value.map((item, index) => (
        <Box
          key={index}
          bg="bg.subtle"
          borderWidth="1px"
          borderRadius="lg"
          borderColor="border.secondary"
        >
          <Flex h="16" alignItems="center" p="4">
            Security: {Object.keys(item)[0]}
          </Flex>
        </Box>
      ))}
    </Box>
  );
};

const ParametersGroup = ({ value }) => {
  const groupByIn = useMemo(() => {
    if (!value) return {};
    return value.reduce((acc, item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return acc;
      if (!acc[item.in]) {
        acc[item.in] = [];
      }
      acc[item.in].push(item);
      return acc;
    }, {});
  }, [value]);

  return (
    <>
      {Object.keys(groupByIn).map((key) => (
        <Parameters key={key} location={key} value={groupByIn[key]} />
      ))}
    </>
  );
};

const Parameters = ({ location, value }) => {
  const { getHighlightingStyles, getVisibilityStyles } = useOpenApi();
  if (!value) return null;
  return (
    <Box>
      <Heading size="sm" mb="8" textTransform="capitalize">
        {location} Parameters
      </Heading>
      <Flex direction="column" gap="8">
        {value.map((param, index) => {
          const {
            name,
            type,
            schema,
            readOnly,
            required,
            changes,
            description,
            changeType,
            ...rest
          } = param;

          return (
            <VisibilityController changeType={changeType} key={index}>
              <Flex
                gap="2"
                direction="column"
                {...getVisibilityStyles(changeType)}
              >
                <Flex gap="4" alignItems="center">
                  <ParameterTag {...getHighlightingStyles(changeType)}>
                    {name}
                  </ParameterTag>
                  {type ? (
                    <Type
                      px="1"
                      value={type}
                      borderRadius="base"
                      {...getHighlightingStyles(
                        changes?.type ? EntityCommitChangeType.UPDATE : null
                      )}
                    />
                  ) : schema ? (
                    <SchemaType schema={schema} />
                  ) : null}
                  <Box flex="1" />
                  {readOnly && (
                    <Text color="muted" fontSize="small">
                      read-only
                    </Text>
                  )}
                  {required && (
                    <Text color="red.500" fontSize="small">
                      Required
                    </Text>
                  )}
                </Flex>
                {schema ? (
                  <Enums schema={schema} />
                ) : typeof type === "object" ? (
                  <Enums schema={type} />
                ) : null}
                {description && <Text>{description}</Text>}
                {rest && <AdditionalFields schema={rest} changes={changes} />}
                {schema && (
                  <Box>
                    <SchemaTree schema={schema} />
                  </Box>
                )}
              </Flex>
            </VisibilityController>
          );
        })}
      </Flex>
    </Box>
  );
};

export default Requests;
