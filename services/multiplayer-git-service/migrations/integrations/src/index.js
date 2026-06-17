"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubApp = void 0;
require("dotenv/config");
const mongo_1 = __importDefault(require("@multiplayer/mongo"));
const models_1 = require("@multiplayer/models");
const types_1 = require("@multiplayer/types");
const logger_1 = __importDefault(require("@multiplayer/logger"));
const app_1 = require("@octokit/app");
const GIT_GITHUB_APP_ID = process.env.GIT_GITHUB_APP_ID;
const GIT_GITHUB_APP_CLIENT_ID = process.env.GIT_GITHUB_APP_CLIENT_ID;
const GIT_GITHUB_APP_CLIENT_SECRET = process.env.GIT_GITHUB_APP_CLIENT_SECRET;
const GIT_GITHUB_APP_WEBHOOK_SECRET = process.env.GIT_GITHUB_APP_WEBHOOK_SECRET;
const GIT_GITHUB_APP_PRIVATE_KEY = process.env.GIT_GITHUB_APP_PRIVATE_KEY;
exports.githubApp = new app_1.App({
    appId: GIT_GITHUB_APP_ID,
    privateKey: GIT_GITHUB_APP_PRIVATE_KEY,
    oauth: {
        clientId: GIT_GITHUB_APP_CLIENT_ID,
        clientSecret: GIT_GITHUB_APP_CLIENT_SECRET,
    },
    webhooks: {
        secret: GIT_GITHUB_APP_WEBHOOK_SECRET,
    },
});
const main = async () => {
    var _a;
    let exitWithError = false;
    try {
        await mongo_1.default.connect();
        const filter = {
            type: {
                $in: [
                    types_1.IntegrationTypeEnum.GITHUB,
                    types_1.IntegrationTypeEnum.GITLAB,
                    types_1.IntegrationTypeEnum.BITBUCKET,
                ],
            },
        };
        const totalIntegrations = await models_1.IntegrationModel.countDocuments(filter);
        let integrationCounter = 1;
        for await (const integration of models_1.IntegrationModel.find(filter).cursor()) {
            try {
                let integrationSettingsUrl = '';
                if (integration.type === types_1.IntegrationTypeEnum.GITHUB
                    && ((_a = integration === null || integration === void 0 ? void 0 : integration.metadata) === null || _a === void 0 ? void 0 : _a.installationId)) {
                    const githubAppInstallation = await exports.githubApp.octokit.request('GET /app/installations/{installation_id}', {
                        installation_id: integration.metadata.installationId,
                        headers: {
                            'X-GitHub-Api-Version': '2022-11-28',
                        },
                    });
                    integrationSettingsUrl = githubAppInstallation.data.html_url;
                }
                else if (integration.type === types_1.IntegrationTypeEnum.BITBUCKET) {
                    integrationSettingsUrl = 'https://bitbucket.org/account/settings/app-authorizations/';
                }
                else if (integration.type === types_1.IntegrationTypeEnum.GITLAB) {
                    integrationSettingsUrl = 'https://gitlab.com/-/user_settings/applications';
                }
                if (integrationSettingsUrl === null || integrationSettingsUrl === void 0 ? void 0 : integrationSettingsUrl.length) {
                    await models_1.IntegrationModel.updateIntegrationById(integration._id, {
                        metadata: {
                            integrationSettingsUrl,
                        },
                    });
                }
                else {
                    logger_1.default.error({
                        integration: JSON.parse(JSON.stringify(integration)),
                    }, 'Failed to get url');
                }
            }
            catch (err) {
                logger_1.default.error(err);
            }
            finally {
                logger_1.default.info(`Processed integrations: ${integrationCounter}/${totalIntegrations}`);
                integrationCounter++;
            }
        }
    }
    catch (err) {
        exitWithError = true;
        logger_1.default.error(err);
    }
    finally {
        await mongo_1.default.disconnect();
        process.exit(Number(exitWithError));
    }
};
main();
//# sourceMappingURL=index.js.map