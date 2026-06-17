export interface ISharedEntityLink {
  _id: string

  shortLink: string

  workspace: string
  project: string

  entity: string

  createdAt?: string | Date
  updatedAt?: string | Date
}
