import { Flex, Box } from "@chakra-ui/react";
import { splitUrl } from "../../../../../utils";
import { ISpanAttributes } from "../../../../../types";
import { HttpMethodConfigs } from "shared/configs/openApi.configs";
import { httpStatusCodes } from "shared/configs/openApi.configs";

const HttpAttributes = ({ data }: { data: ISpanAttributes }) => {
  if (!data || !data["http.url"]) {
    return null;
  }

  const method = data["http.method"];
  const statusCode = data["http.status_code"];
  const statusText =
    data["http.status_text"] || httpStatusCodes[statusCode]?.toUpperCase();
  const path = splitUrl(data["http.url"])?.path || data["http.url"];
  if (!path) return;
  return (
    <Flex
      bg="bg.primary"
      minW="100px"
      flexShrink="1"
      fontSize="13px"
      cursor="pointer"
      color="muted"
      border="solid 1px"
      borderRadius="base"
      borderColor="border.primary"
      fontFamily="JetBrains Mono, sans-serif"
      whiteSpace="nowrap"
      overflow="hidden"
    >
      {method && (
        <Box
          p="1"
          borderRight="1px solid"
          borderColor="border.primary"
          color={HttpMethodConfigs[method.toLowerCase()]?.color || "inherit"}
        >
          {method}
        </Box>
      )}
      <Box
        p="1"
        flex="1"
        minW="0"
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
        title={path}
      >
        {path}
      </Box>
      {statusCode && (
        <Box
          p="1"
          borderLeft="1px solid"
          title={path}
          borderColor="border.primary"
          color={
            statusCode.startsWith("2") || statusCode.startsWith("3")
              ? "green.500"
              : "red.500"
          }
        >
          {statusCode} {statusText}
        </Box>
      )}
    </Flex>
  );
};

export default HttpAttributes;
