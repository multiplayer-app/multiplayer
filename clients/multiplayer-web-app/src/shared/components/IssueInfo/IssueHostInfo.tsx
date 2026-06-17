import { useMemo } from "react";
import { IIssue } from "@multiplayer/types";
import { Box, Flex, FlexProps, Text, TextProps } from "@chakra-ui/react";
import { HttpMethodConfigs } from "shared/configs/openApi.configs";
import MonoText from "../MonoText";

const IssueHostInfo = ({
  metadata,
  ...rest
}: { metadata: IIssue["metadata"] } & FlexProps) => {
  const { httpMethod, httpUrl, httpRoute, httpTarget } = metadata || {};

  const url = useMemo(() => {
    const candidate = httpUrl || httpRoute || httpTarget;
    if (!candidate) return null;
    try {
      return new URL(candidate);
    } catch (_) {
      return candidate;
    }
  }, [httpUrl, httpRoute, httpTarget]);

  if (!url) return null;
  const method = httpMethod && HttpMethodConfigs[httpMethod.toLowerCase()];

  return (
    <Flex
      gap="2"
      color="muted"
      fontSize="xs"
      lineHeight="1.2"
      alignItems="center"
      {...rest}
    >
      {method && (
        <Box as="span" color={method.color}>
          {method.label}
        </Box>
      )}
      <Box position="relative" flex="1" h="5" w="full">
        <ParsedUrl url={url} inset="0" lineHeight="5" position="absolute" />
      </Box>
    </Flex>
  );
};

const ParsedUrl = ({ url, ...rest }: { url: URL | string } & TextProps) => {
  return (
    <MonoText
      fontSize="inherit"
      as="span"
      noOfLines={1}
      title={decodeURIComponent(url instanceof URL ? url.toString() : url)}
      {...rest}
    >
      {url instanceof URL ? (
        <>
          <Text
            as="span"
            color={url.protocol === "https:" ? "green.500" : "orange.500"}
          >
            {url.protocol}//
          </Text>
          {url.hostname}
          {url.port && (
            <Text as="span" color="orange.400">
              :{url.port}
            </Text>
          )}
          {decodeURIComponent(url.pathname)}
          {decodeURIComponent(url.search)}
          {url.hash}
        </>
      ) : (
        url
      )}
    </MonoText>
  );
};

export default IssueHostInfo;
