import handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'
import {
  RoleWorkspacePermissionEntity,
  EntityType,
} from '@multiplayer/types'
import {
  FRONTEND_PROTOCOL,
  FRONTEND_DOMAIN,
} from '../../config'

const templates: any = {}

const buildQueryString = (obj: object) => {
  if (!Object.keys(obj).length) {
    return ''
  }

  return `?${Object.keys(obj)
    .reduce(
      (acc: Array<string>, k: string) => ([
        ...acc,
        ...(Array.isArray(obj[k])
          ? obj[k].map((v, i) => `${k}[]=${encodeURIComponent(obj[k][i])}`)
          : [`${k}=${encodeURIComponent(obj[k])}`]),
      ]),
      [],
    ).join('&')}`
}

const createEndpointUrl = (path, query = {}) => {
  return `${FRONTEND_PROTOCOL}://${FRONTEND_DOMAIN}/${path}${buildQueryString(query)}`
}

const getSetPasswordUrl = ({ token }) => createEndpointUrl('auth/reset-password', { token })

const getConfirmEmailUrl = ({ token }) => createEndpointUrl('auth/confirm-email', { token })

const getJoinWorkspaceUrl = ({ token }) => createEndpointUrl('auth/accept-invitation', { token })

const getDesignReviewUrl = ({
  workspace,
  project,
  branch,
  email,
}) => createEndpointUrl(
  'auth/review-invitation',
  {
    workspace: workspace._id,
    project: project._id,
    branch: branch._id,
    email,
  },
)

const getInviteAndDesignReviewUrl = ({
  workspace,
  project,
  branch,
  email,
  token,
}) => createEndpointUrl(
  'auth/accept-invitation',
  {
    callbackUrl: createEndpointUrl(`project/${workspace._id}/${project._id}/${branch._id}#branchDetails`),
    email,
    token,
  },
)

const getWorkspaceBillingUrl = ({
  workspace,
}) => createEndpointUrl(`dashboard/${workspace?._id}/settings/billing`)

const getHumanReadableEntityName = ({ limit }) => {
  const entityNameMapping = {
    [RoleWorkspacePermissionEntity.WORKSPACE_MEMBER]: 'workspace members',
    [RoleWorkspacePermissionEntity.PROJECT]: 'projects',
    [RoleWorkspacePermissionEntity.INTEGRATION]: 'integrations',
    [EntityType.PLATFORM]: 'platforms',
  }

  return entityNameMapping[limit.entity] || limit.entity
}

handlebars.registerHelper('getSetPasswordUrl', getSetPasswordUrl)

handlebars.registerHelper('getConfirmEmailUrl', getConfirmEmailUrl)

handlebars.registerHelper('getJoinWorkspaceUrl', getJoinWorkspaceUrl)

handlebars.registerHelper('getDesignReviewUrl', getDesignReviewUrl)

handlebars.registerHelper('getInviteAndDesignReviewUrl', getInviteAndDesignReviewUrl)

handlebars.registerHelper('getWorkspaceBillingUrl', getWorkspaceBillingUrl)

handlebars.registerHelper('getHumanReadableEntityName', getHumanReadableEntityName)

handlebars.registerHelper('isdefined', function (value) {
  return value !== undefined
})

fs.readdirSync(path.join(__dirname, 'templates'))
  .forEach(templateFolder => {
    templates[templateFolder] = {
      html: fs.readFileSync(path.join(__dirname, 'templates', templateFolder, 'html.hbs')).toString(),
      subject: fs.readFileSync(path.join(__dirname, 'templates', templateFolder, 'subject.hbs')).toString(),
    }
  })

/**
 * @param type - template type
 * @param params - params for template
 */
export const buildEmailTemplate = (type: string, params: any) => {
  if (!templates[type]) {
    throw new Error(`ERR_TEMPLATE_NOT_FOUND "${type}"`)
  }

  if (params?.user?.invite?.queueNumber) {
    params.user.invite.queueNumber = String(params.user.invite.queueNumber).padStart(5, '0')
  }

  return {
    html: handlebars.compile(templates[type].html)(params),
    subject: handlebars.compile(templates[type].subject)(params),
  }
}
