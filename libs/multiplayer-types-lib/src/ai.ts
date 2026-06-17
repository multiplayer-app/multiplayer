import { ITag } from './tag'
export interface AIExtractedComponent {
  name: string
  position?: {
    x: number
    y: number
  }
  type: string
  metadata: Record<string, string>
  tags?: ITag[]
  dependencies?: string[]
}

export interface AIExtractedPlatform {
  components: AIExtractedComponent[]
}
