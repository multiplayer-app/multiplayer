import OpenAI from 'openai'
import ChatCompletionTool = OpenAI.ChatCompletionTool

export const get_schema_by_ref: ChatCompletionTool = {
  type: 'function',
  'function': {
    name: 'get_schema_by_ref',
    description: 'Get openapi schema by ref',
    parameters: {
      type: 'object',
      properties: {
        ref: {
          type: 'string',
          description: '$ref value',
        },
      },
      required: ['ref'],
    },
  },
}

export const get_openapi_chunks: ChatCompletionTool = {
  type: 'function',
  'function': {
    name: 'get_openapi_chunks',
    description: 'Get openapi chunks by keywords',
    parameters: {
      type: 'object',
      properties: {
        keywords: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'keywords from user\'s message',
        },
      },
      required: ['keywords'],
    },
  },
}
export const get_service_by_name: ChatCompletionTool = {
  type: 'function',
  'function': {
    name: 'get_service_by_name',
    description: 'Get info for component, platform or services that user mentions',
    parameters: {
      type: 'object',
      properties: {
        aliases: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'aliases for the service name',
        },
      },
      required: ['aliases'],
    },
  },
}