import * as Y from 'yjs'
import { EntityData } from '@multiplayer/types'
import { Setters } from '../setters'
import * as BlocknoteTemplates from '../../templates/blocknote.template'
import { EntityInformationSetters } from './entity-information.setters'
import { BlocknoteHelper } from '../../helpers/blocknote.helper'

export class EntityDataSetters implements Setters<EntityData> {
  nameMap: Y.Map<unknown>
  versionMap: Y.Map<unknown>
  informationMap: Y.Map<string>
  description: Y.XmlFragment

  constructor(doc: Y.Doc) {
    this.nameMap = doc.getMap('name')
    this.versionMap = doc.getMap('version')
    this.informationMap = doc.getMap('information')
    this.description = doc.getXmlFragment('description')
  }

  setFields(data: EntityData) {
    this.setName(data)
    this.setDescription(data)
    this.setMpVersion(data)
    this.setInformation(data)
  }
  setDescription(data: EntityData) {
    this.description.push([BlocknoteHelper.convertJsonToYXml(data.description || BlocknoteTemplates.docTemplate())])
  }

  setName(data: EntityData) {
    this.nameMap.set('name', data.name || '')
  }

  setMpVersion(data: EntityData) {
    this.versionMap.set('mpVersion', data.mpVersion || 0)
  }

  setInformation(data: EntityData) {
    const setters = new EntityInformationSetters(this.informationMap)
    setters.setFields(data.information)
  }
}
