import 'dotenv/config'
import mongo from '@multiplayer/mongo'
import {
  IntegrationModel,
} from '@multiplayer/models'
import { IntegrationTypeEnum } from '@multiplayer/types'
import logger from '@multiplayer/logger'
import { App } from '@octokit/app'

const GIT_GITHUB_APP_ID = process.env.GIT_GITHUB_APP_ID as string
const GIT_GITHUB_APP_CLIENT_ID = process.env.GIT_GITHUB_APP_CLIENT_ID as string
const GIT_GITHUB_APP_CLIENT_SECRET = process.env.GIT_GITHUB_APP_CLIENT_SECRET as string
const GIT_GITHUB_APP_WEBHOOK_SECRET = process.env.GIT_GITHUB_APP_WEBHOOK_SECRET as string
const GIT_GITHUB_APP_PRIVATE_KEY = process.env.GIT_GITHUB_APP_PRIVATE_KEY as string

export const githubApp = new App({
  appId: GIT_GITHUB_APP_ID,
  privateKey: GIT_GITHUB_APP_PRIVATE_KEY,
  oauth: {
    clientId: GIT_GITHUB_APP_CLIENT_ID,
    clientSecret: GIT_GITHUB_APP_CLIENT_SECRET,
  },
  webhooks: {
    secret: GIT_GITHUB_APP_WEBHOOK_SECRET,
  },
})

const main = async () => {
  let exitWithError = false
  try {
    await mongo.connect()

    const filter = {
      type: {
        $in: [
          IntegrationTypeEnum.GITHUB,
          IntegrationTypeEnum.GITLAB,
          IntegrationTypeEnum.BITBUCKET,
        ],
      },
    }

    const totalIntegrations = await IntegrationModel.countDocuments(filter)

    let integrationCounter = 1

    for await (const integration of IntegrationModel.find(filter).cursor()) {
      try {
        let integrationSettingsUrl = ''

        if (
          integration.type === IntegrationTypeEnum.GITHUB
          && integration?.metadata?.installationId
        ) {
          const githubAppInstallation = await githubApp.octokit.request('GET /app/installations/{installation_id}', {
            installation_id: integration.metadata.installationId,
            headers: {
              'X-GitHub-Api-Version': '2022-11-28',
            },
          })

          integrationSettingsUrl = githubAppInstallation.data.html_url
        } else if (integration.type === IntegrationTypeEnum.BITBUCKET) {
          integrationSettingsUrl = 'https://bitbucket.org/account/settings/app-authorizations/'
        } else if (integration.type === IntegrationTypeEnum.GITLAB) {
          integrationSettingsUrl = 'https://gitlab.com/-/user_settings/applications'
        }

        if (integrationSettingsUrl?.length) {
          await IntegrationModel.updateIntegrationById(
            integration._id,
            {
              metadata: {
                integrationSettingsUrl,
              },
            },
          )
        } else {
          logger.error({
            integration: JSON.parse(JSON.stringify(integration)),
          }, 'Failed to get url')
        }

      } catch (err) {
        logger.error(err)
      } finally {
        logger.info(`Processed integrations: ${integrationCounter}/${totalIntegrations}`)

        integrationCounter++
      }
    }

  } catch (err) {
    exitWithError = true
    logger.error(err)
  } finally {
    await mongo.disconnect()
    process.exit(Number(exitWithError))
  }
}

main()
