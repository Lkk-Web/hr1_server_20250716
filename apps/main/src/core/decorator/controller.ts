import { PLATFORM } from '@common/enum'
import { applyDecorators, Controller, HttpCode, UseGuards } from '@nestjs/common'
import { MicroserviceAuthGuard } from '@core/guards/Auth.guard'
import { PlatformGuard as PlatformGuardClass } from '@core/guards/Platform.guard'
import { ApiResponse } from '@nestjs/swagger'
import { ApiPlatformWhitelist } from './metaData'

/**
 * 客户端平台鉴权装饰器
 * 自动应用客户端平台守卫和微服务认证
 */
export function ClientAuth(prefix: string) {
  return applyDecorators(
    Controller(`/${PLATFORM.client}/v1/${prefix}`),
    ApiPlatformWhitelist([PLATFORM.client]), // 只允许客户端平台访问
    UseGuards(MicroserviceAuthGuard, PlatformGuardClass) // 先微服务认证，再平台验证
  )
}

/**
 * 管理员平台鉴权装饰器
 */
export function AdminAuth(prefix: string) {
  return applyDecorators(
    Controller(`/${PLATFORM.admin}/v1/${prefix}`),
    ApiPlatformWhitelist([PLATFORM.admin]), // 只允许管理员平台访问
    UseGuards(MicroserviceAuthGuard, PlatformGuardClass)
  )
}

/**
 *  工控屏（工位）平台鉴权装饰器
 */
export function StationAuth(prefix: string) {
  return applyDecorators(Controller(`/${PLATFORM.station}/v1/${prefix}`), ApiPlatformWhitelist([PLATFORM.station]), UseGuards(MicroserviceAuthGuard, PlatformGuardClass))
}

/**
 *  第三方API对接
 */
export function ThirdController(prefix: string) {
  return applyDecorators(Controller(`/api/v1/${prefix}`))
}

export function ApiRes(statusCode: number, config?: { desc?: string; type?: any }) {
  config = config || {}
  return applyDecorators(HttpCode(statusCode), ApiResponse({ status: statusCode, description: config.desc || '成功', type: config.type || Object }))
}
