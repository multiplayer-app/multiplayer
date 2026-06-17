import 'dotenv/config'
import { App } from '@octokit/app'
export declare const githubApp: App<{
  appId: string;
  privateKey: string;
  oauth: {
    clientId: string;
    clientSecret: string;
  };
  webhooks: {
    secret: string;
  };
}>
//# sourceMappingURL=index.d.ts.map