import MarkdownIt, { Options } from 'markdown-it'
import { unwrapElement } from './dom'
import { DataProcessors } from '../../../converters/yjs-converter'

export class MarkdownParser {
  md: MarkdownIt
  stringToHtmlConverter: DataProcessors['convertStringToHtmlBody'] | undefined

  constructor(options:Options={}, stringToHtmlConverter?: DataProcessors['convertStringToHtmlBody']) {
    this.stringToHtmlConverter = stringToHtmlConverter
    this.md = this.withPatchedRenderer(
      MarkdownIt({
        html: true,
        linkify: true,
        breaks: true,
        ...options,
      }),
    )
  }

  parse(content, { inline } = { inline: true }) {
    if (typeof content === 'string') {
      const renderedHTML = this.md.render(content)
      if (!this.stringToHtmlConverter) {
        return renderedHTML
      }
      const element = this.stringToHtmlConverter(`<body>${renderedHTML}</body>`)
      this.normalizeDOM(element, { inline, content })

      return renderedHTML
    }

    return content
  }

  normalizeDOM(node, { inline, content }) {
    // this.normalizeBlocks(node)

    // remove all \n appended by markdown-it
    // node.querySelectorAll('*').forEach((el) => {
    //   if (el.nextSibling?.nodeType === Node.TEXT_NODE && !el.closest('pre')) {
    //     el.nextSibling.textContent = el.nextSibling.textContent.replace(
    //       /^\n/,
    //       '',
    //     )
    //   }
    // })

    if (inline) {
      this.normalizeInline(node, content)
    }

    return node
  }

  normalizeBlocks(node) {
    // const blocks = Object.values(this.editor.schema.nodes).filter(
    //   (node) => node.isBlock,
    // )

    // const selector = blocks
    //   .map((block) => block.spec.parseDOM?.map((spec) => spec.tag))
    //   .flat()
    //   .filter(Boolean)
    //   .join(',')

    // if (!selector) {
    //   return
    // }

    // [...node.querySelectorAll(selector)].forEach((el) => {
    //   if (el.parentElement.matches('p')) {
    //     extractElement(el)
    //   }
    // })
  }

  normalizeInline(node, content) {
    if (node.firstElementChild?.matches('p')) {
      const firstParagraph = node.firstElementChild
      const { nextElementSibling } = firstParagraph
      const startSpaces = content.match(/^\s+/)?.[0] ?? ''
      const endSpaces = !nextElementSibling
        ? content.match(/\s+$/)?.[0] ?? ''
        : ''

      if (content.match(/^\n\n/)) {
        firstParagraph.innerHTML = `${firstParagraph.innerHTML}${endSpaces}`
        return
      }

      unwrapElement(firstParagraph)

      node.innerHTML = `${startSpaces}${node.innerHTML}${endSpaces}`
    }
  }

  /**
   * @param {markdownit} md
   */
  withPatchedRenderer(md) {
    const withoutNewLine =
      (renderer) =>
        (...args) => {
          const rendered = renderer(...args)
          if (rendered === '\n') {
            return rendered // keep soft breaks
          }
          if (rendered[rendered.length - 1] === '\n') {
            return rendered.slice(0, -1)
          }
          return rendered
        }

    md.renderer.rules.hardbreak = withoutNewLine(md.renderer.rules.hardbreak)
    md.renderer.rules.softbreak = withoutNewLine(md.renderer.rules.softbreak)
    md.renderer.rules.fence = withoutNewLine(md.renderer.rules.fence)
    md.renderer.rules.code_block = withoutNewLine(md.renderer.rules.code_block)
    md.renderer.renderToken = withoutNewLine(
      md.renderer.renderToken.bind(md.renderer),
    )

    return md
  }
}
