import type { NextFunction, Request, Response } from 'express'
import { JSDOM } from 'jsdom'
import { BadRequestError, InternalServerError } from 'restify-errors'
import {
  CommitType,
  EntityCreateResponse,
} from '@multiplayer/types'
import { EntityConverter } from '@multiplayer/entity'
import { slugifyString } from '@multiplayer/util-shared'
import logger from '@multiplayer/logger'
import { fetch } from '@multiplayer/fetch'
import {
  AMQPLib,
  CommitLib,
  EntityLib,
} from '../../lib'
import { ExtensionUtil } from '../../utils'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string
    const {
      type,
      key: _key,
      gitRef,
      metadata = {},
      keyAliases: _keyAliases = [],
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

    const key = slugifyString(_key)
    const keyAliases = _keyAliases?.map(keyAlias => slugifyString(keyAlias)) || []

    const importedFile = req.file

    if (!projectBranch || !lastCommit) {
      throw new InternalServerError('Required data is missed')
    }

    let state = EntityConverter.getInitialContent(type, metadata, key)

    if (sourceUri) {
      try {
        const resp = await fetch.get(sourceUri, { responseType: 'text' })
        const extension = ExtensionUtil.getExtension(sourceUri, resp.headers['content-type'])
        state = EntityConverter.convertSourceToState(type, key, resp.data, extension)
      } catch (err) {
        logger.error(err, 'Failed to fetch source')
        return next(new BadRequestError('Provided source is inaccessible'))
      }
    }

    if (importedFile) {
      state = EntityConverter.convertSourceToState(type, key, importedFile.buffer.toString(), 'json', {
        convertStringToHtmlBody: (value) => {
          // add a wrapper to preserve leading and trailing whitespace
          const dom = new JSDOM(`<body>${value}</body>`)
          return dom.window.document.body
        },
      })
    }

    if (initialState) {
      state = EntityConverter.convertDataToState(type, initialState)
    }

    const { entity, entityCommit } = await EntityLib.createEntity({
      workspaceId,
      projectId,
      projectBranchId,
      type,
      key,
      gitRef,
      state,
      keyAliases,
      tags,
      hostnames,
      sourceUri,
      default: _default,
    })

    const commit = await CommitLib.createCommit({
      projectBranch,
      lastCommit,
      entityCommits: [entityCommit],
      projectBranchState: [],
      message: 'create',
      label: 'create',
      type: CommitType.AUTO,
      workspaceUsers: workspaceUser ? [workspaceUser._id.toString()] : [],
    })

    await AMQPLib.notifyOnEntityCreate({
      entity: entity.toJSON(),
      entityCommit: entityCommit.toJSON(),
      isDefaultBranch: !!projectBranch.default,
    })

    commit.entityCommits.forEach((entityCommit: any) => {
      entityCommit.entity = entityCommit.entity.entityId
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
