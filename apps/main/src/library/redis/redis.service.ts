import { SuperRedis } from '@sophons/redis'
import * as configs from '@common/config'

export class RedisProvider {
  public static local = 'localRedis'
  private static _redisClient: SuperRedis

  public static get redisClient() {
    return this._redisClient
  }

  public static getProviders() {
    return [
      {
        provide: this.local,
        inject: [],
        useFactory: async (/*configs: ConfigProvider*/) => {
          if (configs.REDIS.host && configs.REDIS.password) {
            const redisClient = new SuperRedis(configs.REDIS)
            this._redisClient = redisClient
            return redisClient
          }
        },
      },
    ]
  }
}
