import { RadarDetectionEndpointType } from "@multiplayer/types";

import GenericEndpoint from "shared/components/GenericEndpoint";
import { ISpanAttributes } from "pages/Workspace/Project/Debugger/DebugSession/types";
import HttpAttributes from "pages/Workspace/Project/Debugger/DebugSession/DebugSessionDetails/components/DebugSessionNode/TraceNode/HttpAttributes";

const EndpointComponent = (props: any) => {
  if (!props && !props.endpointType) {
    return;
  }

  const {
    id,
    endpointType,
    httpMethod,
    httpEndpoint,
    messagingSystem,
    messagingDestination,
    rpcSystem,
    rpcService,
    rpcMethod,
  } = props;
  switch (endpointType) {
    case RadarDetectionEndpointType.HTTP:
      return (
        <HttpAttributes
          key={id}
          data={
            {
              "http.url": httpEndpoint,
              "http.method": httpMethod,
            } as ISpanAttributes
          }
        />
      );
    case RadarDetectionEndpointType.MESSAGING:
      return (
        <GenericEndpoint chunks={[messagingSystem, messagingDestination]} />
      );
    case RadarDetectionEndpointType.RPC:
      return <GenericEndpoint chunks={[rpcSystem, rpcService, rpcMethod]} />;
  }
};

export default EndpointComponent;
