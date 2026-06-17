import {
  type IRadarDetection,
  ApplyDetectionMessage,
  RadarDetectionEntityType,
} from '@multiplayer/types'
import { ApplyDetection } from '../util'

export const autoApplyDetectionQueueListener = async (
  message: { variables: ApplyDetectionMessage },
) => {
  const {
    workspaceId,
    projectId,
    projectBranchId,
    type,
    platformEntityId,
    // environmentEntityId,
    detection,
  } = message.variables

  if (type === RadarDetectionEntityType.DETECTION) {
    await ApplyDetection.applyDetection(
      detection as IRadarDetection,
      projectBranchId,
      workspaceId,
      projectId,
      platformEntityId,
      undefined,
      undefined,
    )
  } else {
    throw new Error(`Only ${RadarDetectionEntityType.DETECTION} type supported`)
  }
}
