import {
  RadarDetectionType,
  RadarDetectionSource,
  RadarDetectionEndpointType,
} from '@multiplayer/types'

export interface RadarDetectionQueryFilter {
  workspaceId: string,
  projectId: string,
  integrationId?: string,
  componentAliasName?: boolean
  id?: string | { $or?: string[] }
  Sign?: RadarDetectionSource | RadarDetectionSource[],
  type?: RadarDetectionType | RadarDetectionType[] | { $not: RadarDetectionType } | { $or: RadarDetectionType[] },
  componentName?: { $like?: string, $or?: string[] },
  // environmentName?: string[] | string,
  // platformId?: string[] | string,
  environmentNames?: { $value: string[], $columnType: string },
  platformIds?: { $value: string[], $columnType: string },
  endpointType?: RadarDetectionEndpointType | RadarDetectionEndpointType[],
  sourceComponentName?: { $like?: string, $or?: string[] },
  targetComponentName?: { $like?: string, $or?: string[] },
  httpMethod?: string | { $like: string }
  httpEndpoint?: string | { $like: string }
  sourceEndpointType?: RadarDetectionEndpointType | RadarDetectionEndpointType[],
  targetEndpointType?: RadarDetectionEndpointType | RadarDetectionEndpointType[],
  sourceHttpMethod?: string | { $like: string }
  sourceHttpEndpoint?: string | { $like: string }
  targetHttpMethod?: string | { $like: string }
  targetHttpEndpoint?: string | { $like: string }
  tags?: { $arrayExists: { '1'?: string, '2': string }[] }, // 1 is key, 2 is value
  Timestamp?: {
    $lt?: { $date: Date },
    $gt?: { $date: Date }
  },
  $or?: Omit<RadarDetectionQueryFilter, 'workspaceId' | 'projectId'>[]

  entityId?: string | { $or?: string[] },
  sourceEntityId?: string,
  targetEntityId?: string
}


export interface RadarDetectionDeleteFilter {
  workspaceId: string,
  projectId: string,
  integrationId?: string,
  componentAliasName?: boolean
  id?: string | { $or?: string[] }
  Sign?: RadarDetectionSource | RadarDetectionSource[],
  type?: RadarDetectionType | RadarDetectionType[] | { $not: RadarDetectionType } | { $or: RadarDetectionType[] },
  componentName?: { $like?: string, $or?: string[] },
  environmentName?: string[] | string,
  platformId?: string[] | string,
  endpointType?: RadarDetectionEndpointType | RadarDetectionEndpointType[],
  sourceComponentName?: { $like?: string, $or?: string[] },
  targetComponentName?: { $like?: string, $or?: string[] },
  httpMethod?: string | { $like: string }
  httpEndpoint?: string | { $like: string }
  sourceEndpointType?: RadarDetectionEndpointType | RadarDetectionEndpointType[],
  targetEndpointType?: RadarDetectionEndpointType | RadarDetectionEndpointType[],
  sourceHttpMethod?: string | { $like: string }
  sourceHttpEndpoint?: string | { $like: string }
  targetHttpMethod?: string | { $like: string }
  targetHttpEndpoint?: string | { $like: string }
  tags?: { $arrayExists: { '1'?: string, '2': string }[] }, // 1 is key, 2 is value
  Timestamp?: {
    $lt?: { $date: Date },
    $gt?: { $date: Date }
  },
  $or?: Omit<RadarDetectionDeleteFilter, 'workspaceId' | 'projectId'>[]

  entityId?: string | { $or?: string[] },
  sourceEntityId?: string,
  targetEntityId?: string
}
