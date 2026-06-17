import { RoleProjectPermissionEntity } from '@multiplayer/types'
import { AlertRuleModel } from '@multiplayer/models'
import { EntityBaseProjectLevel } from '../base/base-entity-project'
import { Joi } from '@multiplayer/util'

export class AlertRule extends EntityBaseProjectLevel {
  getEntityType() {
    return RoleProjectPermissionEntity.ALERT_RULE
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        workspaceId: Joi.string().hex().length(24).required(),
        projectId: Joi.string().hex().length(24).required(),
        alertRuleId: Joi.string().hex().length(24),
      }).unknown().required(),
      body: Joi.any(),
    })
  }

  getParams(params: any) {
    const contextParams: {
      _id?: string,
      workspaceId: string
      projectId: string
    } = {
      workspaceId: params.workspaceId,
      projectId: params.projectId,
    }

    if (params.alertRuleId) {
      contextParams._id = params.alertRuleId
    }

    return contextParams
  }

  async hasContextResourceAccess(): Promise<boolean> {
    const alertRule = await AlertRuleModel.findAlertRuleByIdAndProjectAndWorkspace(
      this.params._id,
      this.params.projectId,
      this.params.workspaceId,
    )

    return !!alertRule
  }
}
