import type { Request } from 'express'
import {
  ForbiddenError,
  InvalidArgumentError,
} from 'restify-errors'
import logger from '@multiplayer/logger'
import {
  RoleAccessAction,
  ErrorMessage,
  RoleProjectPermissionEntity,
  RoleWorkspacePermissionEntity,
  RoleAccountPermissionEntity,
} from '@multiplayer/types'
import { JoiValidator, Joi } from '@multiplayer/util'
import { Context } from '../types/context'
import { Params } from '../types/params'

export abstract class EntityBase {
  protected context: Context
  protected currentUserId: string
  protected entityType!: RoleWorkspacePermissionEntity | RoleProjectPermissionEntity | RoleAccountPermissionEntity
  protected params: Params
  protected _accessActions: RoleAccessAction[]
  protected bulk: boolean

  constructor(req: Request) {
    this.currentUserId = req.session.current
    this.entityType = this.getEntityType()
    this.params = this.getValidatedParams(
      req.params,
      req.query,
      req.body,
      req,
    )
    this.context = req.context
    this.bulk = !!req.bulk
    this._accessActions = []
  }

  protected abstract getEntityType(): RoleWorkspacePermissionEntity | RoleProjectPermissionEntity | RoleAccountPermissionEntity
  protected abstract getParams(
    params: any,
    queryParams: any,
    body: any,
    req: Request
  ): Params
  protected abstract getValidationSchema(): Joi.Schema<any>
  protected abstract hasContextResourceAccess(): Promise<boolean>
  protected abstract getAccessActions(): Promise<RoleAccessAction[]>

  private getValidatedParams(
    params: any,
    queryParams: any,
    body: any,
    req: Request,
  ): Params {
    JoiValidator.validate(
      {
        params,
        queryParams,
        body: body || {},
      },
      this.getValidationSchema(),
    )
    return this.getParams(params, queryParams, body || {}, req)
  }

  async ability(action: RoleAccessAction): Promise<boolean> {
    this._accessActions = await this.getAccessActions()

    if (
      !this.params._id
      && !this.bulk
      && [
        RoleAccessAction.DELETE,
        RoleAccessAction.UPDATE,
      ].includes(action)
    ) {
      throw new InvalidArgumentError('Invalid context params')
    }

    if (!this._accessActions.includes(action)) {
      return false
    }

    const sharedObject = this.context?.objects
      ?.find(sharedObject => sharedObject.objectType.toLowerCase() === this.entityType.toLowerCase())
    if (
      sharedObject
      && sharedObject.objectId !== this.params._id
    ) {
      throw new ForbiddenError(ErrorMessage.ACTION_NOT_ALLOWED)
    }

    if (
      this.params._id
      && !this.context.superAdmin
      && !(await this.hasContextResourceAccess())
    ) {
      logger.debug(
        {
          entity: this.entityType,
          action,
          userId: this.currentUserId,
          context: this.context,
          params: this.params,
          accessActions: this._accessActions,
        },
        '[ACCESS] No resource access',
      )

      throw new ForbiddenError(ErrorMessage.ACTION_NOT_ALLOWED)
    }

    return true
  }

  async hasBillingPlanLimitation(action: RoleAccessAction): Promise<{
    currentCount?: number,
    maxCount?: number,
    enabled?: boolean,
    entity: string,
  } | false> {
    return false
  }

  public get accessActions(): RoleAccessAction[] {
    return this._accessActions
  }
}
