export interface GitRepository {
  _id: string
  id: string
  name: string
  fullName: string
  private: boolean
  defaultBranch: string
  owner: {
    kind: 'user' | 'organization'
    name: string,
  }
  url: string
}
