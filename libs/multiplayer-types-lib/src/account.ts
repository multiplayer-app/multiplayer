import { AccountType } from './enums'

export interface IAccount {
  _id: string
  type: AccountType
  name: string
  owner: string
  billing: {
    usedTrial: boolean,
    stripe: {
      customerId: string
    }
  }
}
