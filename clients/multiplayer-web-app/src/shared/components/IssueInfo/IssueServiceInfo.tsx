import { Divider, Flex, Text, Tooltip } from "@chakra-ui/react";
import { IIssue, ComponentType } from "@multiplayer/types";

import NodeIcon from "../NodeIcon";
import Icon from "../Icon";

const IssueServiceInfo = ({ service }: { service: IIssue["service"] }) => {
  if (!service) return null;
  const {
    serviceName,
    release,
    environment,
    releases = [],
    environments = [],
  } = service;
  const env = environment ? [environment] : environments;
  const rel = release ? [release] : releases;

  return (
    <Flex gap="2" minW="0" color="muted" fontSize="xs" alignItems="center">
      {serviceName && (
        <Flex gap="2" alignItems="center" minW="0">
          <NodeIcon type={ComponentType.GENERIC} boxSize="4" p="1px" />
          <Text as="span" noOfLines={1} title={service.serviceName}>
            {service.serviceName}
          </Text>
        </Flex>
      )}
      {env.length > 0 && (
        <>
          <Divider
            height="3"
            orientation="vertical"
            borderColor="border.tertiary"
          />
          <Flex gap="2" alignItems="center">
            <Icon name="Container" boxSize="4" p="1px" />
            {env.join(", ")}
          </Flex>
        </>
      )}
      {rel.length > 0 && (
        <>
          <Divider
            height="3"
            orientation="vertical"
            borderColor="border.tertiary"
          />
          <Flex gap="2" alignItems="center">
            <Icon name="Rocket" boxSize="4" p="1px" />
            {rel[0]}
            {rel.length > 1 && (
              <Tooltip label={rel.slice(1).join(", ")}>
                <Text as="span" cursor="default">
                  +{rel.length - 1}
                </Text>
              </Tooltip>
            )}
          </Flex>
        </>
      )}
    </Flex>
  );
};

export default IssueServiceInfo;
