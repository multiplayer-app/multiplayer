import redis from '@multiplayer/redis'
import { OauthCodeData } from '@multiplayer/types'

export class OauthTokenStore {
  private static getKey(token: string): string {
    return `authCode:${token}`
  }

  public static async storeAuthorizationCode(code:string, data: OauthCodeData, ttl = 60) {
    await redis.set(OauthTokenStore.getKey(code), data, ttl)
  }

  public static async invalidateAuthorizationCode(code:string) {
    await redis.del(OauthTokenStore.getKey(code))
  }

  public static async getAuthorizationCode(code: string): Promise<OauthCodeData> {
    return redis.get(OauthTokenStore.getKey(code))
  }
}
