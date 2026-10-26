import dns from 'dns'
import http from 'http'
import https from 'https'
import net from 'net'
import { NOTIFICATION_ALLOW_PRIVATE_NETWORK } from '../../config'

// Outbound requests to user-configured URLs (alert webhooks, Teams). Without this guard an alert
// action could make the API call internal services or the cloud metadata endpoint (SSRF).

export class UnsafeUrlError extends Error {
  name = 'UnsafeUrlError'
}

const blockList = new net.BlockList()
const BLOCKED_SUBNETS: [string, number, 'ipv4' | 'ipv6'][] = [
  ['0.0.0.0', 8, 'ipv4'],
  ['10.0.0.0', 8, 'ipv4'],
  ['100.64.0.0', 10, 'ipv4'], // carrier-grade NAT
  ['127.0.0.0', 8, 'ipv4'],
  ['169.254.0.0', 16, 'ipv4'], // link-local, incl. cloud metadata
  ['172.16.0.0', 12, 'ipv4'],
  ['192.0.0.0', 24, 'ipv4'],
  ['192.0.2.0', 24, 'ipv4'],
  ['192.168.0.0', 16, 'ipv4'],
  ['198.18.0.0', 15, 'ipv4'],
  ['198.51.100.0', 24, 'ipv4'],
  ['203.0.113.0', 24, 'ipv4'],
  ['224.0.0.0', 4, 'ipv4'], // multicast
  ['240.0.0.0', 4, 'ipv4'], // reserved, incl. broadcast
  // IPv4-mapped addresses (::ffff:a.b.c.d) need no rule: BlockList checks them against the IPv4
  // rules above. A ::ffff:0:0/96 rule would instead match every IPv4 address.
  ['::', 96, 'ipv6'], // unspecified, loopback and IPv4-compatible
  ['64:ff9b::', 96, 'ipv6'], // NAT64
  ['100::', 64, 'ipv6'],
  ['2001::', 32, 'ipv6'], // Teredo
  ['2001:db8::', 32, 'ipv6'],
  ['2002::', 16, 'ipv6'], // 6to4 can embed any IPv4 address
  ['fc00::', 7, 'ipv6'], // unique local
  ['fe80::', 10, 'ipv6'], // link-local
  ['ff00::', 8, 'ipv6'], // multicast
]
for (const [address, prefix, type] of BLOCKED_SUBNETS) {
  blockList.addSubnet(address, prefix, type)
}

export const isPrivateAddress = (address: string): boolean => {
  const family = net.isIP(address)

  if (!family) {
    return true
  }

  return blockList.check(address, family === 6 ? 'ipv6' : 'ipv4')
}

export interface SafeRequestOptions {
  headers?: Record<string, string>
  body?: string
  timeoutMs?: number
  maxResponseBytes?: number
  // Local development and tests only: allows http and private/loopback targets
  allowPrivateNetwork?: boolean
}

export interface SafeResponse {
  statusCode: number
  body: string
}

export const sendSafeRequest = (rawUrl: string, options: SafeRequestOptions = {}): Promise<SafeResponse> => {
  const allowPrivateNetwork = options.allowPrivateNetwork ?? NOTIFICATION_ALLOW_PRIVATE_NETWORK
  const timeoutMs = options.timeoutMs ?? 5000
  const maxResponseBytes = options.maxResponseBytes ?? 64 * 1024

  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return Promise.reject(new UnsafeUrlError('Invalid URL'))
  }

  if (url.protocol !== 'https:' && !(allowPrivateNetwork && url.protocol === 'http:')) {
    return Promise.reject(new UnsafeUrlError('Only https URLs are allowed'))
  }

  // Node skips DNS lookup for IP literals, so those are checked here
  const literal = url.hostname.replace(/^\[|\]$/g, '')
  if (net.isIP(literal) && !allowPrivateNetwork && isPrivateAddress(literal)) {
    return Promise.reject(new UnsafeUrlError('URL points to a private or reserved address'))
  }

  // Resolve once, refuse the host if any answer is private, and connect to the validated
  // address itself - so the check can't be bypassed by mixing records or DNS rebinding.
  const lookup = (hostname: string, lookupOptions: any, callback: (...args: any[]) => void) => {
    dns.lookup(hostname, { ...lookupOptions, all: true }, (err, addresses: dns.LookupAddress[]) => {
      if (err) {
        return callback(err)
      }

      if (!addresses.length || (!allowPrivateNetwork && addresses.some(({ address }) => isPrivateAddress(address)))) {
        return callback(new UnsafeUrlError(`${hostname} resolves to a private or reserved address`))
      }

      return lookupOptions?.all
        ? callback(null, addresses)
        : callback(null, addresses[0].address, addresses[0].family)
    })
  }

  const transport = url.protocol === 'https:' ? https : http

  return new Promise((resolve, reject) => {
    const request = transport.request(url, {
      method: 'POST',
      headers: options.headers,
      lookup: lookup as any,
      agent: false,
      timeout: timeoutMs,
    }, (response) => {
      const chunks: Buffer[] = []
      let size = 0

      response.on('data', (chunk: Buffer) => {
        size += chunk.length
        if (size > maxResponseBytes) {
          request.destroy(new Error('Response too large'))
        } else {
          chunks.push(chunk)
        }
      })
      response.on('end', () => resolve({
        statusCode: response.statusCode || 0,
        body: Buffer.concat(chunks).toString('utf8'),
      }))
      response.on('error', reject)
    })

    request.on('timeout', () => request.destroy(new Error(`Request timed out after ${timeoutMs}ms`)))
    request.on('error', reject)
    request.end(options.body)
  })
}

// For channels whose URL is issued by a known provider (Teams, Slack): only its hosts are accepted,
// on top of the SSRF guard. Skipped in development, like the private network checks.
export const assertAllowedHost = (rawUrl: string, isAllowedHost: (hostname: string) => boolean, description: string) => {
  let hostname: string
  try {
    hostname = new URL(rawUrl).hostname
  } catch {
    throw new UnsafeUrlError(`Invalid ${description} URL`)
  }

  if (!NOTIFICATION_ALLOW_PRIVATE_NETWORK && !isAllowedHost(hostname)) {
    throw new UnsafeUrlError(`Not a ${description} URL`)
  }
}

const RETRY_DELAYS_MS = [500, 2000]
const isRetryableStatus = (statusCode: number) => statusCode === 429 || statusCode >= 500

// POSTs with retries on network errors, 429 and 5xx. Redirects are never followed and fail the
// delivery like any other non-2xx answer. `buildRequest` runs per attempt (fresh signatures).
export const postWithRetries = async (
  url: string,
  buildRequest: () => Pick<SafeRequestOptions, 'body' | 'headers'>,
  options: Omit<SafeRequestOptions, 'body' | 'headers'> = {},
): Promise<SafeResponse> => {
  let lastError: Error = new Error('Request not attempted')

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const response = await sendSafeRequest(url, { ...options, ...buildRequest() })

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response
      }

      lastError = new Error(`Responded with HTTP ${response.statusCode}`)

      if (!isRetryableStatus(response.statusCode)) {
        throw lastError
      }
    } catch (err: any) {
      if (err instanceof UnsafeUrlError || err === lastError) {
        throw err
      }

      lastError = err
    }

    if (attempt < RETRY_DELAYS_MS.length) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
    }
  }

  throw lastError
}
