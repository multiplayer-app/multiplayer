import { Blocknote, SessionNoteType } from '@multiplayer/types'
import { DataProcessors } from '../../converters/yjs-converter'

export class TipTapToMarkdown {
  private getImageUrl?: DataProcessors['getImageUrl']
  private processBlockContent: (content: string, blockId?: string) => string

  constructor(dataProcessors: DataProcessors) {
    this.getImageUrl = dataProcessors.getImageUrl
    this.processBlockContent = dataProcessors.processBlockContent || ((content) => content)
  }

  convertDocToMarkdown(doc: Blocknote.BlockElement): string {
    if (doc.type !== 'doc') throw new Error('Root node must be type \'doc\'')
    return (doc.content || []).map(this.blockToMarkdown.bind(this)).join('\n')
  }

  private blockToMarkdown(node): string {
    const type = node.type

    switch (type) {
      case 'heading':
        return this.processBlockContent(`${'#'.repeat(node.attrs?.level || 1)} ${this.getText(node)}\n`)

      case 'paragraph':
        return this.processBlockContent(`${this.getText(node)}\n`)

      case 'blockquoteFigure':
        return this.processBlockContent(`> ${this.getText(node)}\n`)

      case 'codeBlock':
      case 'runnableCodeBlock':
        return this.processBlockContent(`\`\`\`${node.attrs?.language || ''}\n${this.getText(node)}\n\`\`\`\n`)

      case 'taskList':
        return this.processBlockContent((node.content || []).map(this.blockToMarkdown.bind(this)).join(''))

      case 'taskItem':
        return `- [${node.attrs?.checked ? 'x' : ' '}] ${this.getText(node)}\n`

      case 'horizontalRule':
        return '---'

      case 'link':
        return `[${this.getText(node)}](${node.attrs?.href || ''})`

      case 'imageBlock':
      case 'imageUpload':
        return this.processBlockContent(`![${node.attrs?.alt || ''}](${this.getImageUrl?.(node.attrs?.src) || node.attrs?.src || ''})\n`)
      case 'session-note-block':
        if (node.attrs?.type === SessionNoteType.Span) {
          return this.processBlockContent(`${node.attrs.note} \n\`\`\`json\n${node.attrs.metadata || ''}\n\`\`\`\n`, node.attrs.id)
        }
        return this.processBlockContent(`${node.attrs.note})\n`, node.attrs.id)
      case 'table':
        return this.processBlockContent((node.content || []).map(this.blockToMarkdown.bind(this)).join('\n') + '')

      case 'tableRow':
        return (node.content || []).map(this.blockToMarkdown.bind(this)).join(' | ')

      case 'tableHeader':
      case 'tableCell':
        return this.getText(node)

      case 'emoji':
        return node.text || ''

      case 'underline':
      case 'highlight':
        return `**${this.getText(node)}**`

      case 'subscript':
        return `~${this.getText(node)}~`

      case 'superscript':
        return `^${this.getText(node)}^`

      // custom or unknown → skip
      default:
        return this.getText(node)
    }
  }

  private getText(node): string {
    if (node.text) return node.text
    if (node.content) return node.content.map((node) => this.blockToMarkdown(node)).join('')
    return ''
  }
}