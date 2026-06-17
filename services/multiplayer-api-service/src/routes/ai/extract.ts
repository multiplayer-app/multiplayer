import { ErrorMessage } from '@multiplayer/types'
import logger from '@multiplayer/logger'
import { WorkspaceModel } from '@multiplayer/models'
import { AIExtractedPlatform } from '@multiplayer/types'
import type { Request, Response, NextFunction } from 'express'
import { FailedDependencyError } from 'restify-errors'
import { openai } from '../../lib'
import { DEFAULT_MODEL_NAME } from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const image = req.file
    const workspaceId = req.query.workspace as string

    let platform: AIExtractedPlatform

    const response = await openai.chat.completions.create({
      temperature: 0.1,
      model: DEFAULT_MODEL_NAME,
      max_tokens: 4096,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that converts architecture diagram into csv format',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${image?.buffer.toString('base64')}`,
              },
            },
            {
              type: 'text',
              text: `
                Convert diagram to json, in format: box representing component, which has dependencies.
                Component can have such types: GENERIC, PLATFORM, SERVICE, CLIENT. Response structure is like that:
                {components: {name: String, position: {x: number, y: number}, type: string, dependencies: string[]}[]}.
                Keep in mind that position of boxes should not overlap.
                Leave only json in response
              `,
            },
          ],
        },
      ],
    })

    const jsonString = response.choices?.[0]?.message?.content?.match(/```json([^`]*)```/)?.[1]
      || response.choices?.[0]?.message?.content

    if (!jsonString) {
      throw new FailedDependencyError(ErrorMessage.AI_CANNOT_EXTRACT_COMPONENTS)
    }

    try {
      const platformJson = JSON.parse(jsonString)

      platform = {
        components: platformJson.components.map(component => ({
          name: component.name,
          position: {
            x: component.position.x,
            y: component.position.y,
          },
          type: component.type,
          dependencies: component.dependencies,
        })),
      }
    } catch (parseError) {
      logger.error(parseError, jsonString, 'Failed to parse JSON from openai')
      throw new FailedDependencyError(ErrorMessage.AI_CANNOT_EXTRACT_COMPONENTS)
    }

    await WorkspaceModel.increaseAiRequestsCounter(workspaceId)

    return res.status(200).json(platform)
  } catch (err) {
    return next(err)
  }
}
