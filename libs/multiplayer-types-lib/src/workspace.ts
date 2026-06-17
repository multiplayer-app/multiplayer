import { IWorkspaceUser } from './workspace-user'
import { IAccess } from './access'
import {
  FeatureFlag,
  WorkspaceBillingFeatures,
  RoleAccessAction,
} from './enums'

export interface IWorkspaceMember {
  _id: string
  role: string
  workspaceUser: string | IWorkspaceUser
  workspaceAdmin?: boolean
  workspaceOwner?: boolean
}

export interface IWorkspaceDomain {
  _id?: string
  domain: string
  createdAt?: string
  updatedAt?: string
}

export interface IWorkspaceBillingFeature {
  name: WorkspaceBillingFeatures
  metadata: {
    count?: number
    unlimited?: boolean
    enabled?: boolean
  }
}

export interface IWorkspaceBilling {
  aiRequests?: number,
  stripe: {
    subscriptionId?: string,
    trialEndsAt?: Date,
    paidAtLeastOneTime?: boolean,
    productName: string,
    features?: IWorkspaceBillingFeature[]
  }
}

export interface IWorkspaceMemberProjectAccess {
  enabled: boolean
  projectRoleId?: string
}

export interface IWorkspaceDomainAutoJoin {
  enabled: boolean
  workspaceRoleId: string | null
}

export interface IWorkspaceSettings {
  memberProjectAccess: IWorkspaceMemberProjectAccess
  domainAutoJoin: IWorkspaceDomainAutoJoin
}

export interface IWorkspace {
  _id: string
  account: string

  access: IAccess & { permissions?: RoleAccessAction[] }
  settings: IWorkspaceSettings

  archived?: boolean
  iconUrl: string
  name: string
  handle: string
  domains: IWorkspaceDomain[]
  users: IWorkspaceMember[]
  ownerUser: string
  billing: IWorkspaceBilling
  featureFlags: Record<FeatureFlag, boolean>
  isWorkspaceOnboarded: boolean
  finishedCopyingSampleData: boolean
  createdAt: string
  updatedAt: string
}
