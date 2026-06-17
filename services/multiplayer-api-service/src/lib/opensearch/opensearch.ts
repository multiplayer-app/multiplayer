import { Client, ClientOptions } from '@opensearch-project/opensearch'
import { AWS_REGION, OPENSEARCH_LOGIN, OPENSEARCH_PASSWORD, OPENSEARCH_URI } from '../../config'
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws'
import { defaultProvider } from '@aws-sdk/credential-provider-node'

let options: ClientOptions = {
  requestTimeout: 20000,
  maxRetries: 3,
  node: OPENSEARCH_URI,
  ...AwsSigv4Signer({
    region: AWS_REGION,
    service: 'es',
    getCredentials: () => defaultProvider()(),
  }),
}

if (!OPENSEARCH_URI.includes('aws')) {
  options = {
    requestTimeout: 20000,
    node: OPENSEARCH_URI,
    maxRetries: 3,
    auth: {
      username: OPENSEARCH_LOGIN,
      password: OPENSEARCH_PASSWORD,
    },
  }
}
const client = new Client(options)
export default client
