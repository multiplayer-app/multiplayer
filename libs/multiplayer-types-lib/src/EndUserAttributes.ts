import { EndUserType } from './enums/end-user-type.enum'

export interface IEndUserAttributes {
  type: EndUserType
  id?: string
  name?: string
  groupId?: string
  groupName?: string
  environment?: string
  environmentSlug?: string

  userEmail?: string
  userId?: string
  userName?: string
  accountId?: string
  accountName?: string
  orgId?: string
  orgName?: string
  tags?: string[]
}
