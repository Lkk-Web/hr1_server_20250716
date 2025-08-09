import { CanActivate, ExecutionContext, Injectable, ForbiddenException, HttpException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { jwtDecode } from '@library/utils/crypt.util'
import { AUTHORIZE_KEY_METADATA, PLATFORM_WHITELIST_KEY } from '@core/decorator/metaData'

@Injectable()
export class PlatformGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 检查是否跳过授权验证
    const skipAuth = this.reflector.getAllAndOverride<boolean>(AUTHORIZE_KEY_METADATA, [context.getHandler(), context.getClass()])

    if (skipAuth) {
      return true
    }

    const request = context.switchToHttp().getRequest()

    // 获取装饰器中设置的平台白名单
    const allowedPlatforms = this.reflector.getAllAndOverride<string[]>(PLATFORM_WHITELIST_KEY, [context.getHandler(), context.getClass()])

    console.log(allowedPlatforms)

    if (!allowedPlatforms.includes(request.user.platform)) {
      throw new ForbiddenException(`无权访问，当前用户平台:${request.user.platform}, 允许的平台:${allowedPlatforms.join(', ')}`)
    }

    return true
  }
}
