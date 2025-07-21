import { SetMetadata } from '@nestjs/common'

export const AUTHORIZE_KEY_METADATA = 'AUTHORIZE_KEY_METADATA'
/**
 * 平台白名单元数据键
 */
export const PLATFORM_WHITELIST_KEY = 'platform_whitelist'

/**
 * 开放授权Api
 * 使用该注解则无需校验Token及权限
 */
export const OpenAuthorize = () => SetMetadata(AUTHORIZE_KEY_METADATA, true)

/**
 * 平台白名单装饰器
 * 用于设置允许访问接口的平台列表
 * @param platforms 允许的平台列表，如 ['admin', 'client']
 * @returns 装饰器函数
 */
export const ApiPlatformWhitelist = (platforms: string[]) => SetMetadata(PLATFORM_WHITELIST_KEY, platforms)
