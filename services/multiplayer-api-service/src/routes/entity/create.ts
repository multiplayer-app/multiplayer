import type { NextFunction, Request, Response } from 'express'
import { JSDOM } from 'jsdom'
import { InternalServerError } from 'restify-errors'
import { EntityCreateResponse } from '@multiplayer/types'
import { EntityConverter } from '@multiplayer/entity'
import { EntityLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string
    const {
      type,
      key,
      gitRef,
      metadata = {},
      keyAliases = [],
      hostnames,
      tags,
      sourceUri,
      initialState,
      default: _default,
    } = req.body
    const {
      workspaceUser,
      projectBranch,
      lastCommit,
    } = req

    const importedFile = req.file

    if (!projectBranch || !lastCommit) {
      throw new InternalServerError('Required data is missed')
    }

    const precomputedState = importedFile
      ? EntityConverter.convertSourceToState(type, key, importedFile.buffer.toString(), 'json', {
        convertStringToHtmlBody: (value) => {
          // add a wrapper to preserve leading and trailing whitespace
          const dom = new JSDOM(`<body>${value}</body>`)
          return dom.window.document.body
        },
      })
      : undefined

    const { entity, entityCommit, commit } = await EntityLib.createEntityWithCommit({
      workspaceId,
      projectId,
      projectBranchId,
      type,
      key,
      gitRef,
      metadata,
      keyAliases,
      hostnames,
      tags,
      sourceUri,
      initialState,
      precomputedState,
      default: _default,
      projectBranch,
      lastCommit,
      workspaceUser,
    })

    const response: EntityCreateResponse = {
      entity: entity.toJSON(),
      entityCommit: entityCommit.toJSON(),
      commit,
    }

    return res.status(200).json(response)
  } catch (err) {
    return next(err)
  }
}
