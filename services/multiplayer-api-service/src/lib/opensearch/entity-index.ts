import client from './opensearch'
import esb from 'elastic-builder'
import { NUM_OF_REPLICAS, NUM_OF_SHARDS } from '../../config'
import { EntityType } from '@multiplayer/types'

export interface EntityIndexDocument {
  workspaceId: string
  projectId: string
  branchId: string
  entityId: string
  entityName: string
  entityType: string
  metadata: Record<string, any>
  tags: string[]
  chunkIndex: number
  keywords: string[]
  content: string
}

export class EntityIndex {
  public static readonly INDEX_NAME = 'entities'
  public static readonly mapping = {
    mappings: {
      properties: {
        workspaceId: { type: 'keyword' },
        projectId: { type: 'keyword' },
        branchId: { type: 'keyword' },
        entityId: { type: 'keyword' },
        entityType: { type: 'keyword' },
        entityName: { type: 'text' },
        metadata: { type: 'object' },
        tags: { type: 'text' },
        chunkIndex: { type: 'integer' },
        content: { type: 'text' },
        keywords: { type: 'text' },
      },
    },
    settings: {
      index: {
        number_of_shards: NUM_OF_SHARDS,
        number_of_replicas: NUM_OF_REPLICAS,
      },
    },
  }

  static async reindex() {
    await client.indices.refresh({ index: EntityIndex.INDEX_NAME })
  }

  static async deleteIndex() {
    const { body: exists } = await client.indices.exists({ index: EntityIndex.INDEX_NAME })

    if (!exists) return { body: { acknowledged: true } }
    return client.indices.delete({
      index: EntityIndex.INDEX_NAME,
    })
  }

  static async createIndex() {
    const { body: exists } = await client.indices.exists({ index: EntityIndex.INDEX_NAME })

    if (exists) return
    return client.indices.create({
      index: EntityIndex.INDEX_NAME,
      body: EntityIndex.mapping,
    })
  }

  static insertDocument(doc: EntityIndexDocument) {
    return client.index({
      index: EntityIndex.INDEX_NAME,
      body: doc,
      refresh: true,
    })
  }

  static deleteDocuments(filter: {
    workspaceId: string,
    projectId?: string,
    branchId?: string,
    entityId?: string,
  }) {
    const body = esb.requestBodySearch()
      .query(
        Object.keys(filter).reduce((boolQuery, key) => {
          if (filter[key]) {
            boolQuery = boolQuery.filter(esb.termQuery(key, filter[key]))
          }
          return boolQuery
        }, esb.boolQuery()))
      .toJSON()

    return client.delete_by_query({
      index: EntityIndex.INDEX_NAME,
      body,
      refresh: true,
    })
  }

  static async search(params: {
    workspaceId: string,
    projectId: string,
    branchId: string,
    entityIds?: string[],
    entityType?: EntityType,
    keywords: string[]
  }, limit = 3) {
    let boolQuery = esb.boolQuery()
      .filter(esb.termQuery('workspaceId', params.workspaceId))
      .filter(esb.termQuery('projectId', params.projectId))
      .filter(esb.termQuery('branchId', params.branchId))
      .should(params.keywords.map((keyword) => esb.matchQuery('content', keyword)))

    if (params.entityIds) {
      boolQuery = params.entityIds?.reduce((acc, entityId) => {
        return boolQuery.filter(esb.termsQuery('entityId', entityId))
      }, boolQuery)
    }
    if (params.entityType) {
      boolQuery = boolQuery.filter(esb.termsQuery('entityType', params.entityType))
    }

    const body = esb.requestBodySearch()
      .size(limit)
      .query(boolQuery).toJSON()
    const { body: { hits: hits } } = await client.search({
      index: EntityIndex.INDEX_NAME,
      body,
    })
    return hits
  }
}


