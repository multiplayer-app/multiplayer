export interface IAlertHistory {
  _id: string

  workspace: string
  project: string

  alertRule: string

  createdAt: string | Date
  updatedAt: string | Date
}
