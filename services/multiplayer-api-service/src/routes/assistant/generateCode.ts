import type { Request, Response, NextFunction } from 'express'
import { AIService } from '../../services/ai.service'
import { Blocknote, EntityType } from '@multiplayer/types'
import logger from '@multiplayer/logger'
import { BlocknoteHelper, EntityConverter } from '@multiplayer/entity'
import { openai } from '../../lib'
import { multiplayerInternalVersionService } from '../../services'
import {
  apiBlockPrompt,
  categorizePrompt,
  codeBlockPrompt,
  generateChartPrompt,
  generateTipTapBlockPrompt,
} from './prompts'
import OpenAI from 'openai'
import ChatCompletionChunk = OpenAI.ChatCompletionChunk
import ChatCompletionTool = OpenAI.ChatCompletionTool
import { Stream } from 'openai/streaming'
import { ChatCompletion } from 'openai/resources/index'
import { EntityModel } from '@multiplayer/models'
import { get_openapi_chunks, get_schema_by_ref, get_service_by_name } from './tools'

export type BranchScopeParams = {
  workspaceId: string,
  projectId: string,
  projectBranchId: string
}

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string
    const { message, system, model, block, adjustmentMessage } = req.body
    const entityId = req.query.entityId as string

    let category: string | null = null
    if (block && typeof block === 'object') {
      category = block.type
    }
    if (!category) {
      category = await getAiResults({
        workspaceId,
        projectId,
        projectBranchId,
      }, [message], categorizePrompt, model, [], undefined, false)
    }
    const result = await generateBlockByCategory(category || 'paragraph', {
      workspaceId,
      projectId,
      projectBranchId,
      message: message || '',
      system,
      model,
      block,
      adjustmentMessage,
      entityId,
    })

    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(500).json(err)
  }
}

async function generateBlockByCategory(category: string, params: {
  workspaceId: string,
  projectId: string,
  projectBranchId: string
  message: string,
  block?: Blocknote.BlockElement,
  adjustmentMessage?: string,
  system?: string,
  model?: string,
  entityId?: string,
}) {
  switch (category) {
    case 'restApiBlock':
      return generateApiBlock(params)
    case 'runnableCodeBlock':
      return generateCodeBlock(params)
    case 'chartBlock':
      return generateChartBlock(params)
    default:
      return generateTipTapBlock({ ...params, category })
  }
}

async function generateTipTapBlock(params: {
  workspaceId: string,
  projectId: string,
  projectBranchId: string,
  message: string,
  category: string,
  model?: string,
  block?: Blocknote.BlockElement,
  adjustmentMessage?: string,
}) {
  const response = await getAiResults(params,
    [`Block type: ${params.category}\n User content description: ${params.message}`],
    generateTipTapBlockPrompt,
    params.model)
  return JSON.parse(response || '')
}

async function generateCodeBlock(params: {
  workspaceId: string,
  projectId: string,
  projectBranchId: string,
  message: string,
  system?: string,
  model?: string,
  entityId?: string,
  block?: Blocknote.BlockElement,
  adjustmentMessage?: string,
}) {
  const {
    workspaceId,
    projectId,
    projectBranchId,
    message,
    system,
    model,
    entityId,
  } = params
  let context = ''
  if (entityId) {
    try {
      const data = await multiplayerInternalVersionService.getEntityContent({
        workspaceId,
        projectId,
        projectBranchId,
        entityId: entityId as string,
      })
      if (data) {
        context = '#Context: \n' + EntityConverter.stringifyData(data.type, data.data) + '\n'
      }
    } catch (e) {
      logger.error(e)
    }
  }
  const result = await getAiResults(
    params,
    [context, message],
    system || codeBlockPrompt,
    model,
    [get_service_by_name],
  )
  return {
    type: 'runnableCodeBlock',
    attrs: Object.assign(params.block?.attrs || {}, JSON.parse(result || '')),
  }
}
async function generateChartBlock(params: {
  workspaceId: string,
  projectId: string,
  projectBranchId: string,
  message: string,
  system?: string,
  model?: string,
  block?: Blocknote.BlockElement,
  adjustmentMessage?: string,
}) {
  const {
    message,
    system,
    model,
  } = params
  const result = await getAiResults(
    params,
    [message],
    system || generateChartPrompt,
    model,
  )
  return {
    type: 'chartBlock',
    attrs: Object.assign(params.block?.attrs || {}, JSON.parse(result || '')),
  }
}

async function generateApiBlock(params: {
  workspaceId: string,
  projectId: string,
  projectBranchId: string,
  message: string,
  system?: string,
  model?: string,
  block?: Blocknote.BlockElement,
  adjustmentMessage?: string,
}) {
  const {
    message,
    system,
    model,
  } = params
  let result = ''

  await getAiResults(
    params,
    [message],
    system || apiBlockPrompt,
    model,
    [get_schema_by_ref, get_openapi_chunks],
    (chunk: string) => {
      //res.write(chunk)
      result += chunk.toString()
    },
  )

  const parsed = JSON.parse(result)
  return BlocknoteHelper.convertToRestApiBlock(parsed, params.block)
}

async function getOpenapiChunks(toolParams: { keywords: string[] }, params: BranchScopeParams) {
  if (!toolParams.keywords) {
    return 'Cannot fetch api data'
  }
  const results = (await AIService.getOpenSearchRecords({
    workspaceId: params.workspaceId,
    projectId: params.projectId,
    branchId: params.projectBranchId,
    entityType: EntityType.API,
    keywords: toolParams.keywords,
  }, 3))

  return JSON.stringify(results.filter(({ score }) => score).map((content) => content))
}

async function getSchemaByRef(toolParams: { ref: string }, params: BranchScopeParams) {
  if (!toolParams.ref) return ''

  const refParams = toolParams.ref.split('/')
  const schemaName = refParams[refParams.length - 1]
  const res = await AIService.getOpenSearchRecords({
    workspaceId: params.workspaceId,
    projectId: params.projectId,
    branchId: params.projectBranchId,
    entityType: EntityType.API,
    keywords: [`schemas:${schemaName}`],
  }, 1)
  if (res.length) {
    return res[0].content
  }
  return 'Unknown schema, try to answer without it'
}

async function getEntitiesByAlias(toolParams: { aliases: string[] }, params: BranchScopeParams) {
  if (!toolParams.aliases) return ''

  const entities = await EntityModel.getEntitiesInBranchByKeys(toolParams.aliases, params.projectBranchId, {
    workspace: params.workspaceId, project: params.projectId,
  })
  return entities.map((entity) => {
    return {
      entityId: entity.entityId,
      key: entity.key,
      keyAliases: entity.keyAliases,
      metadata: entity.metadata,
      type: entity.type,
    }
  })
}

async function respondOnToolCall(toolCall, params: BranchScopeParams): Promise<any> {
  const availableTools = {
    get_schema_by_ref: getSchemaByRef,
    get_openapi_chunks: getOpenapiChunks,
    get_service_by_name: getEntitiesByAlias,
  }

  const toolName = toolCall.function?.name
  const args = toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments): {}
  if (!toolName || !availableTools[toolName]) return {
    role: 'tool',
    content: 'Not found',
    tool_call_id: toolCall.id,
  }
  const resp = await availableTools[toolName](args, params)
  return {
    role: 'tool',
    content: resp,
    tool_call_id: toolCall.id,
  }
}

async function getAiResults(param: {
  workspaceId: string,
  projectId: string,
  projectBranchId: string,
  block?: any,
  adjustmentMessage?: string,
}, userMessages: string[], system: string, model?: string, tools: ChatCompletionTool[] = [], onChunkCallback?: (chunk: string) => void, isJson: boolean = true) {
  const messages = [
    {
      role: 'system',
      content: system,
    },
    ...(userMessages.map((message) => ({
      role: 'user',
      content: message,
    }))),
  ]

  if (param.block) {
    messages.push({
      role: 'assistant',
      content: JSON.stringify(param.block),
    })
  }
  if (param.adjustmentMessage) {
    messages.push({
      role: 'user',
      content: param.adjustmentMessage,
    })
  }

  return askAi(messages, param, model, tools, isJson, onChunkCallback)
}

async function askAi(messages: any[], param: BranchScopeParams, model?: string, aiTools: ChatCompletionTool[] = [], isJson: boolean = true, onChunkCallback?: (chunk: string) => void, count = 0) {
  const isStreamed = !!onChunkCallback
  const aiResp = await openai.chat.completions.create({
    temperature: 0.1,
    model: model || 'openai/gpt-4o-mini',
    max_tokens: 1500,
    stream: isStreamed,
    tool_choice: count < 2 ? 'auto' : 'none',
    tools: aiTools,
    response_format: { type: isJson ? 'json_object': 'text' },
    messages: messages,
  })

  try {
    if (isStreamed) {
      let tools = {}
      for await (const chunk of aiResp as Stream<ChatCompletionChunk>) {
        if (chunk.choices[0]?.delta?.tool_calls?.length) {
          chunk.choices[0].delta.tool_calls.forEach((tool) => {
            if (!tools[tool.index]) {
              tools[tool.index] = tool
              return
            }
            tools[tool.index].function.arguments += tool.function?.arguments
          })
          continue
        }
        if (chunk.choices[0]?.finish_reason === 'tool_calls') {
          const toolsResp = await Promise.all(Object.values(tools).map((tool) =>
            respondOnToolCall(tool, param),
          ))
          await askAi([
            ...messages,
            { role: 'assistant', tool_calls: Object.values(tools) },
            ...toolsResp,
          ], param, model, aiTools, isJson, onChunkCallback, ++count)
          tools = {}
          continue
        }
        if (chunk.choices[0].delta.content) {
          onChunkCallback(chunk.choices[0].delta.content)
        }
      }
      return null
    } else {
      if ((aiResp as any).error) {
        logger.error((aiResp as any).error)
        throw new Error((aiResp as any).error.message)
      }
      const choice = (aiResp as ChatCompletion).choices[0]
      if (!choice) {
        return null
      }

      if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
        const toolsResp = await Promise.all(Object.values(choice.message.tool_calls).map((tool) =>
          respondOnToolCall(tool, param),
        ))
        return askAi([
          ...messages,
          { role: 'assistant', tool_calls: Object.values(choice.message.tool_calls) },
          ...toolsResp,
        ], param, model, aiTools, isJson, onChunkCallback, ++count)
      }

      return (aiResp as ChatCompletion).choices[0].message.content
    }
  } catch (err) {
    logger.error(err)
    throw new Error('Cannot fetch data out of the message')
  }
}
