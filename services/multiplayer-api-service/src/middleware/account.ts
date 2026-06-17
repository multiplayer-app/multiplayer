import type { Request, Response, NextFunction } from 'express'
import {
  ForbiddenError,
  NotFoundError,
  InvalidArgumentError,
} from 'restify-errors'
import {
  AccountModel,
  UserModel,
  IUserDocument,
} from '@multiplayer/models'
import { AccountType } from '@multiplayer/types'
import { isFreeEmail } from '@multiplayer/util-shared'
import { stripe } from '../lib'

export const attachAccountToWorkspace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user
    const workspace = req.workspace

    if (!user) {
      throw new ForbiddenError()
    }

    const account = await AccountModel.findAccountById(
      workspace.account,
    )

    if (!account) {
      throw new NotFoundError('Account not found')
      // const customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim()

      // const stripeCustomer = await stripe.createCustomer(customerName, user.primaryEmail)

      // account = await AccountModel.createAccount({
      //   type: AccountType.PRIVATE,
      //   owner: user._id,
      //   name: customerName,
      //   billing: {
      //     stripe: {
      //       customerId: stripeCustomer.id,
      //     },
      //   },
      // })
    }

    // if ()

    req.account = account

    next()
  } catch (err) {
    next(err)
  }
}

export const createAccountForUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let user = req.user as IUserDocument

    if (req.isInternal) {
      const { userId } = req.body
      user = await UserModel.findUserById(userId) as IUserDocument
      if (!user) {
        throw new NotFoundError('User not found')
      }
    } else if (req.body.userId) {
      throw new InvalidArgumentError('Not allowed to specify userId')
    }

    let companyName = ''

    if (!isFreeEmail(user.primaryEmail)) {
      companyName = user.primaryEmail.match(/@(.*)(\..*)$/)?.[1] as string
    }

    const customerName = `${user.firstName || ''} ${user.lastName || ''} ${companyName.length ? `at ${companyName}` : ''}`.trim()
    const stripeCustomer = await stripe.createCustomer(customerName, user.primaryEmail)
    const account = await AccountModel.createAccount({
      type: AccountType.PRIVATE,
      owner: user._id,
      name: customerName,
      billing: {
        usedTrial: false,
        stripe: {
          customerId: stripeCustomer.id,
        },
      },
    })

    req.account = account

    next()
  } catch (err) {
    next(err)
  }
}
