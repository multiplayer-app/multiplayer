import { RUNNABLE_API_BLOCK_NAME, RUNNABLE_CODE_BLOCK_NAME } from 'src/lib/constants'
import { HttpMethodConfigs } from '../RestApiBlock/consts'

export const buildTableOfContents = ({ editor, storage, options }) => {
  const entries: any[] = []
  const content: any = []

  let minHeadingLevel = Infinity

  editor.state.doc.descendants((node, pos) => {
    if (options.anchorTypes.includes(node.type.name)) {
      entries.push({ node, pos })

      if (node.type.name === 'heading') {
        minHeadingLevel = Math.min(minHeadingLevel, node.attrs.level)
      }
    }
  })

  entries.forEach(({ node, pos }) => {
    const domNode =
      node.type.name === 'heading'
        ? (editor.view.domAtPos(pos + 1).node as HTMLElement)
        : ((editor.view.nodeDOM(pos) as HTMLElement)?.firstChild as HTMLElement) ||
          (editor.view.nodeDOM(pos) as HTMLElement)

    let adjustedLevel

    if (node.type.name === 'heading') {
      adjustedLevel = node.attrs.level - minHeadingLevel + 1
      adjustedLevel = Math.min(2, adjustedLevel)
    } else {
      adjustedLevel = 1
    }

    const indexPosition = content.length + 1
    const { label, tagStyle } = getLabelConfigs(node)
    content.push({
      pos,
      node,
      label,
      tagStyle,
      dom: domNode || null,
      level: adjustedLevel,
      itemIndex: indexPosition,
      id: node.attrs['data-toc-id'],
      textContent: node.textContent || node.attrs._globalName || 'Untitled Block',
    })
  })

  storage.content = content
  editor.view.dispatch(editor.state.tr.setMeta('toc', content))
}

const getLabelConfigs = node => {
  switch (node.type.name) {
    case 'heading':
      return { label: `Headline ${node.attrs.level}` }
    case RUNNABLE_API_BLOCK_NAME:
      const methodConf = HttpMethodConfigs[node.attrs.method] || HttpMethodConfigs.GET
      return {
        label: `API Call`,
        tagStyle: { color: methodConf.color, borderColor: methodConf.color, background: methodConf.color + '1A' },
      }
    case RUNNABLE_CODE_BLOCK_NAME:
      return {
        label: `Code Block`,
        tagStyle: { color: '#A0AEC0', borderColor: '#EDF2F7', background: '#F7FAFC' },
      }
    default:
      return { label: '' }
  }
}
