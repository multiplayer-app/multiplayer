import { RoleProjectPermissionEntity } from '@multiplayer/types'
import { AlertHistoryModel } from '@multiplayer/models'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { Joi } from '@multiplayer/util'

export class AlertHistory extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.ALERT_HISTORY
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
        alertRuleId: Joi.string().hex().length(24).required(),
        alertHistoryId: Joi.string().hex().length(24),
      }).unknown().required(),
      body: Joi.any(),
    })
  }

  getParams(params: any) {
    const contextParams: {
      _id?: string,
      workspaceId: string
      projectId: string
      alertRuleId: string
    } = {
      workspaceId: params.workspaceId,
      projectId: params.projectId,
      alertRuleId: params.alertRuleId,
    }

    if (params.alertHistoryId) {
      contextParams._id = params.alertHistoryId
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const alertHistory = await AlertHistoryModel.findAlertHistoryByIdAndProjectAndWorkspace(
      this.params._id,
      this.params.projectId,
      this.params.workspaceId,
    )

    return !!alertHistory
  }
}
