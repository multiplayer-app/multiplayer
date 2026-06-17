import type { Request, Response, NextFunction } from 'express'
import logger from '@multiplayer/logger'
import { openai } from '../../lib'
import { InternalError } from 'restify-errors'

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
    const { messages, system, model } = req.body
    const defaultSystem = `You are a helpful assistant that helps users build and edit structured documents using Tiptap, a rich-text editor framework based on ProseMirror.
- Your responses should:
- Guide users in creating, editing, or extending Tiptap-compatible JSON documents.
- Ask clarifying questions when the user’s intent is unclear.
- Suggest document structures (e.g., paragraphs, headings, lists, code blocks, tables) based on the user's input.
- Output valid Tiptap JSON structure when needed, formatted in a code block.
- Explain briefly what each part of the JSON does when appropriate.
- Assume users are not necessarily technical, so be concise, friendly, and non-jargony unless the user demonstrates technical knowledge.
- Do not generate HTML unless explicitly asked. Focus on producing or modifying the Tiptap JSON document format.`
    await getAiResults(
      { workspaceId, projectId, projectBranchId },
      messages,
      system || defaultSystem,
      model || 'openai/gpt-4o-mini',
      (chunk: string) => {
        res.write(chunk)
      },
    )
    res.end()
  } catch (err: any) {
    res.destroy()
    return next(new InternalError(err.message))
  }
}

async function getAiResults(param: {
  workspaceId: string,
  projectId: string,
  projectBranchId: string,
}, messages: string[], system: string, model: string, onChunkCallback: (chunk: string) => void) {
  return askAi([
    {
      role: 'system',
      content: system,
    },
    ...(messages.map((message) => ({ role: 'user', content: message }))),
  ], param, model, onChunkCallback)

}
//todo remove
async function respondOnToolCall(toolCall, params: BranchScopeParams): Promise<any> {
  const availableTools = {
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

async function askAi(messages: any[], param: BranchScopeParams, model: string, onChunkCallback: (chunk: string) => void, count = 0) {
  const aiResp = await openai.chat.completions.create({
    temperature: 0.1,
    model,
    max_tokens: 1500,
    stream: true,
    messages: messages,
  })
  try {
    let tools = {}
    for await (const chunk of aiResp) {
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
        ], param, model, onChunkCallback, ++count)
        tools = {}
        continue
      }
      if (chunk.choices[0].delta.content) {
        onChunkCallback(chunk.choices[0].delta.content)
      }
    }
  } catch (err) {
    logger.error(err)
    throw new Error('Cannot fetch data out of the message')
  }
}
