import TraceIcon from "shared/components/TraceIcon";

import { Icon, IconProps } from "@chakra-ui/react";
import { TerminalIcon, ErrorIcon } from "shared/icons";

import {
  OtelScope,
  ComponentType,
  IDebugSessionNode,
  DebugSessionNodeType,
} from "@multiplayer/types";
import NodeIcon from "shared/components/NodeIcon";
import { getNestedProperty } from "shared/utils";
import EntityMetaIcon from "shared/components/EntityMetaIcon";
import { useEntities } from "shared/providers/EntitiesContext";
import { EntityWithMeta } from "shared/models/interfaces";
import { memo, useMemo } from "react";
import { logLevelColorMap } from "../../../../DebugSession.configs";
import { IConsoleNode, ITraceNode } from "../../../../types";

interface DebugSessionNodeIconProps extends IconProps {
  node: IDebugSessionNode<any>;
}

const DebugSessionNodeIcon = memo(
  ({ node, ...rest }: DebugSessionNodeIconProps) => {
    const { entityAliasesMap } = useEntities();
    const { type, meta } = node;
    const { entity, metadata } = useMemo(() => {
      const entity = entityAliasesMap.get(meta.ServiceName);
      const metadata = getNestedProperty(entity, ["metadata"], {
        type: ComponentType.GENERIC,
        iconUrl: null,
      });
      return { entity, metadata };
    }, [meta.ServiceName, entityAliasesMap]);

    switch (type) {
      case DebugSessionNodeType.Trace:
        return (
          <TraceNodeIcon
            node={node}
            entity={entity}
            metadata={metadata}
            {...rest}
          />
        );
      case DebugSessionNodeType.Log:
        return (
          <EntityMetaIcon type={entity?.type} metadata={metadata} {...rest} />
        );
      case DebugSessionNodeType.Event:
        return (
          <NodeIcon
            p="1"
            boxSize="6"
            bg="brand.900"
            borderRadius="base"
            type={ComponentType.CLIENT}
            __css={{ "*": { fill: "inverse" } }}
            {...rest}
          />
        );
      case DebugSessionNodeType.Console:
        const data = meta as IConsoleNode;
        const level = data.data?.payload?.level || "log";
        const color = logLevelColorMap[level] || logLevelColorMap.log;
        return (
          <Icon
            p="1"
            bg={color}
            boxSize="6"
            color="inverse"
            borderRadius="base"
            as={TerminalIcon}
            {...rest}
          />
        );
      default:
        return <></>;
    }
  }
);

interface TraceNodeIconProps extends IconProps {
  node: IDebugSessionNode<ITraceNode>;
  entity: EntityWithMeta;
  metadata: { type: ComponentType; iconUrl: any };
}

const TraceNodeIcon = ({
  node,
  entity,
  metadata,
  ...rest
}: TraceNodeIconProps) => {
  const { meta } = node;
  switch (meta.ScopeName) {
    case OtelScope.http:
    case OtelScope.fetch:
    case OtelScope.httpXmlRequest:
      return (
        <EntityMetaIcon type={entity?.type} metadata={metadata} {...rest} />
      );
    case OtelScope.multiplayerNotebookHttp:
    case OtelScope.documentLoad:
    case OtelScope.navigation:
      return (
        <NodeIcon
          p="1"
          boxSize="6"
          bg="green.500"
          borderRadius="base"
          type={ComponentType.CLIENT}
          __css={{ "*": { fill: "inverse" } }}
          {...rest}
        />
      );
    case OtelScope.exception:
      return <Icon boxSize="6" color="red.300" as={ErrorIcon} {...rest} />;
    default:
      return <TraceIcon trace={meta} {...rest} />;
  }
};

export default DebugSessionNodeIcon;
