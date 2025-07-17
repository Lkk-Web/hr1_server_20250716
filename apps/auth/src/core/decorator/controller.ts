import { applyDecorators, Controller, HttpCode, UseGuards } from '@nestjs/common'
import { JwtDecodeGuard } from '../guards/jwt-decode.guard'
import { ApiResponse } from '@nestjs/swagger'

/**
 * 自动加入web/前缀路由的Controller注解守卫 UseGuards(WebAuthGuard)
 */
export function JwtDecodeController(prefix: string) {
  return applyDecorators(Controller(`auth/v1/${prefix}`), UseGuards(JwtDecodeGuard))
}

export function ApiRes(statusCode: number, config?: { desc?: string; type?: any }) {
  config = config || {}
  return applyDecorators(HttpCode(statusCode), ApiResponse({ status: statusCode, description: config.desc || '成功', type: config.type || Object }))
}

/**
 * JWT解码守卫装饰器，自动解码JWT token并附加到请求对象
 */
