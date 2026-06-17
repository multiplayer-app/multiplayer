import {
  RoleAccountPermissionEntity,
} from '@multiplayer/types'
import { Joi } from '@multiplayer/util'
import { AccountModel } from '@multiplayer/models'
import { EntityBaseAccountLevel } from '../base/base-entity-account'

export class Account extends EntityBaseAccountLevel {
  getEntityType() {
    return RoleAccountPermissionEntity.ACCOUNT
  }

  protected getValidationSchema(): Joi.ObjectSchema<unknown> {
    return Joi.object({
      queryParams: Joi.object(),
      params: Joi.object({
        accountId: Joi.string().hex().length(24).required(),
      }).unknown().required(),
      body: Joi.any(),
    })
  }

  getParams(params: any): { _id?: string } {
    const contextParams: {
      _id?: string,
    } = {
      _id: params.accountId,
    }

    return contextParams
  }

  async ability() {
    return true
  }

  async hasContextResourceAccess(): Promise<boolean> {
    if (!this.context.userId) {
      return false
    }

    const account = await AccountModel.findAccountByIdAndOwner(
      this.params._id,
      this.context.userId,
    )

    return !!account
  }
}
