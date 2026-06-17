import { PostmanImporter } from './postman/importer'
import { Collection } from './postman/types'
import { BlocknoteTemplates, VariableGroupTemplates } from '../templates'
import { DataProcessors } from '../converters/yjs-converter'

export function importNotebookData(source: string, processors?: DataProcessors, template = BlocknoteTemplates.empty()) {
  try {
    const data: any = JSON.parse(source)
    if (data?.info?._postman_id) {
      const importer = new PostmanImporter(processors?.convertStringToHtmlBody)
      return importer.setPostmanCollectionToNotebookData(data as Collection, template)
    }
    return template
  } catch (err) {
    template.content?.push({
      type: 'paragraph',
      content: [{
        type: 'text',
        text: 'Cannot import the data',
      }],
    })
    return template
  }
}

export function importVariableGroup(source: string, template = VariableGroupTemplates.empty()) {
  try {
    const data: any = JSON.parse(source)
    if (data?._postman_variable_scope === 'environment') {
      const importer = new PostmanImporter()
      return importer.setPostmanEnvToVariableGroupData(data.values, template)
    }
    return template
  } catch (err: any) {
    template.name = `Failed to import data ${err.message}`
    return template
  }
}