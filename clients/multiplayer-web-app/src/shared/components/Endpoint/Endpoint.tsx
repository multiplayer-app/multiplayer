import { Flex, FlexProps, Text } from "@chakra-ui/react";
import { OpenAPIV3 } from "openapi-types";

import Method from "./Method";
import { getMethodConfigs } from "shared/configs/openApi.configs";
import React, { useLayoutEffect, useRef } from "react";

interface EndpointProps extends FlexProps {
  path: string;
  baseUrl?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  method: OpenAPIV3.HttpMethods;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

const Endpoint = ({
  path,
  baseUrl,
  method,
  isActive,
  isDeleted,
  textDecoration,
  leftElement = null,
  rightElement = null,
  onClick,
  ...rest
}: EndpointProps) => {
  const itemRef = useRef<HTMLDivElement>();
  const configs = getMethodConfigs(method);
  const isDisabled = isDeleted || !onClick;

  useLayoutEffect(() => {
    if (isActive) {
      setTimeout(() => {
        // wait for collapse animation end
        itemRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }, 500);
    }
  }, []);

  return (
    <Flex
      p="2"
      pr="3"
      gap="2"
      ref={itemRef}
      borderRadius="base"
      alignItems="center"
      onClick={(e) => {
        !isDisabled && onClick(e);
      }}
      cursor={!isDisabled ? "pointer" : "default"}
      bg={`${configs.color}${isActive ? "26" : "0D"}`}
      transition="background .2s cubic-bezier(.87, 0, .13, 1)"
      _hover={{
        bg: `${configs.color}${isActive ? "26" : "1A"}`,
      }}
      {...rest}
    >
      {leftElement}
      <Method name={method} />
      <Text
        as="span"
        flex="1"
        minW="0"
        fontSize="xs"
        wordBreak="break-word"
        fontFamily="JetBrains Mono, sans-serif"
        textDecoration={textDecoration}
      >
        {baseUrl && (
          <Text as="span" color="muted">
            {baseUrl}
          </Text>
        )}
        {path}
      </Text>
      {rightElement}
    </Flex>
  );
};

export default Endpoint;
