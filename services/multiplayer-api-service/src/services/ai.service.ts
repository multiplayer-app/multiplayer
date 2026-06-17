import { Opensearch, openai } from '../lib'
import { EntityType } from '@multiplayer/types'
import logger from '@multiplayer/logger'
import { DEFAULT_MODEL_NAME } from '../config'

enum LLMProvider {
  OPENAI='OPENAI'
}

export type SearchResult = {
  content: string,
  score: number,
  entityId: string,
  chunkIndex: number
}

export class AIService {
  static async getEmbeddings(message: string, dimensions = 256, provider: LLMProvider = LLMProvider.OPENAI) {
    return openai.embeddings.create({
      model: 'openai/text-embedding-3-small',
      input: message,
      encoding_format: 'float',
      dimensions,
    })
  }

  static getTopNResults(keywordSearchResults: SearchResult[], vectorSearchResults: SearchResult[], n = 3): SearchResult[] {
    const ratedResults = [
      ...vectorSearchResults,
    ].reduce((acc, res) => {
      const key = `${res.entityId}.${res.chunkIndex}`
      if (acc[key]) {
        acc[key].score += res.score
      } else {
        acc[key] = res
      }
      return acc
    }, {} as Record<string, SearchResult>)

    keywordSearchResults.forEach((res) => {
      const key = `${res.entityId}.${res.chunkIndex}`
      if (ratedResults[key]) {
        ratedResults[key].score += res.score
      }
    })
    return Object.values(ratedResults)
      .sort((a, b) => (b.score - a.score))
      .slice(0, n)
  }

  static async getOpenSearchRecords(
    params: {
      workspaceId: string
      branchId: string,
      projectId: string,
      entityIds?: string[],
      entityType?: EntityType,
      keywords: string[]
    }, limit: number): Promise<(Opensearch.EntityIndexDocument & { score: number })[]> {
    const resp = await Opensearch.EntityIndex.search(params, limit)
    return resp.hits.map((hit) => {
      return {
        score: hit._score,
        ...hit._source,
      }
    })
  }

  static async getMessageSummary(message: string, model = DEFAULT_MODEL_NAME) {
    const response = await openai.chat.completions.create({
      temperature: 0.1,
      model,
      max_tokens: 100,
      messages: [
        {
          role: 'system',
          content: 'Use less then five words to summarize the message',
        },
        {
          role: 'user',
          content: `${message}. Summary: `,
        }],
    })
    const name = response.choices?.[0]?.message.content
    return name || 'Unknown'
  }

  static async getKeywords(message: string, model = DEFAULT_MODEL_NAME) {
    const response = await openai.chat.completions.create({
      temperature: 0.1,
      model,
      max_tokens: 100,
      messages: [
        {
          role: 'system',
          content: 'return keywords out of the message',
        },
        {
          role: 'user',
          content: message,
        }],
    })
    return (response.choices?.[0]?.message.content || '').split(', ')
  }

  static async getMessageData(message: string, model = DEFAULT_MODEL_NAME) {
    const response = await openai.chat.completions.create({
      temperature: 0.1,
      model,
      max_tokens: 100,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are helpful assistant that fetches data out of messages. ' +
            'Message can have serviceName, apiOperationId, apiSchema, action. Order is unknown. ' +
            'Some data parts can be missed. Return json structure as result\n' +
            'message: "fetch data from api service using list comments api"\n' +
            'result: {serviceName: "api", apiOperationId: "listComments", action: "fetch"}',
        },
        {
          role: 'user',
          content: message,
        }],
    })
    try {
      return JSON.parse(response.choices?.[0]?.message.content || '')
    } catch (err) {
      logger.error(err)
      throw new Error('Cannot fetch data out of the message')
    }
  }
}
