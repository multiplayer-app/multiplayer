import { IconProps, Image, ImageProps } from "@chakra-ui/react";
import NodeIcon from "shared/components/NodeIcon";
import { ComponentType } from "@multiplayer/types";
import { getTraceResource } from "shared/helpers/debugger.helpers";
import { ITraceNode } from "pages/Workspace/Project/Debugger/DebugSession/types";

interface TraceIconProps extends IconProps {
  trace: ITraceNode;
}

const TraceIcon = ({ trace, ...rest }: TraceIconProps) => {
  const { iconUrl, key } = getTraceResource(trace);

  return iconUrl ? (
    <Image
      boxSize="6!"
      maxW="6!"
      maxH="6!"
      p="0.5"
      title={key}
      fallback={
        <NodeIcon boxSize="6!" type={ComponentType.GENERIC} {...rest} />
      }
      src={iconUrl}
      {...(rest as unknown as ImageProps)}
    />
  ) : (
    <NodeIcon boxSize="6!" mr="0" type={ComponentType.GENERIC} {...rest} />
  );
};

export default TraceIcon;
