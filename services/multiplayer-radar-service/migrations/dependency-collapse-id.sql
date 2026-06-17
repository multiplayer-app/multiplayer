INSERT INTO radar.detections
SELECT
  concat(
      toString(Sign), ':',
      workspaceId, ':', projectId, ':', type ,':',
      sourceComponentName, ':', sourceEndpointType, ':', sourceHttpMethod, ':', sourceHttpEndpoint, ':',
      sourceRpcSystem, ':', sourceRpcService, ':', sourceRpcMethod, ':', sourceMessagingDestination, ':',
      sourceMessagingSystem, ':', targetComponentName, ':', targetEndpointType, ':', targetHttpMethod, ':',
      targetHttpEndpoint, ':', targetRpcSystem, ':', targetRpcService, ':', targetRpcMethod, ':',
      targetMessagingDestination, ':', targetMessagingSystem, ':', platformId, ':', environmentName
  ) AS collapse_id,
  concat(
      workspaceId, ':', projectId, ':', type ,':',
      sourceComponentName, ':', sourceEndpointType, ':', sourceHttpMethod, ':', sourceHttpEndpoint, ':',
      sourceRpcSystem, ':', sourceRpcService, ':', sourceRpcMethod, ':', sourceMessagingDestination, ':',
      sourceMessagingSystem, ':', targetComponentName, ':', targetEndpointType, ':', targetHttpMethod, ':',
      targetHttpEndpoint, ':', targetRpcSystem, ':', targetRpcService, ':', targetRpcMethod, ':',
      targetMessagingDestination, ':', targetMessagingSystem
  ) AS id,
  Sign,
  workspaceId,
  projectId,
  integrationId,
  platformId,
  entityId,
  type,
  tags,
  componentName,
  componentAliasName,
  mainRefId,
  environmentName,
  endpointType,
  httpMethod,
  httpEndpoint,
  rpcSystem,
  rpcService,
  rpcMethod,
  messagingSystem,
  messagingDestination,
  dependencyType,
  sourceComponentName,
  sourceEntityId,
  sourceEndpointType,
  sourceHttpMethod,
  sourceHttpEndpoint,
  sourceRpcSystem,
  sourceRpcService,
  sourceRpcMethod,
  sourceMessagingSystem,
  sourceMessagingDestination,
  targetComponentName,
  targetEntityId,
  targetEndpointType,
  targetHttpMethod,
  targetHttpEndpoint,
  targetRpcSystem,
  targetRpcService,
  targetRpcMethod,
  targetMessagingSystem,
  targetMessagingDestination,
  Timestamp
FROM radar.detections
WHERE type = 'DEPENDENCY';

ALTER TABLE radar.detections
DELETE WHERE
    type = 'DEPENDENCY'
    AND id = concat(
      workspaceId, ':', projectId, ':', type ,':',
      sourceComponentName, ':', targetComponentName
    );
