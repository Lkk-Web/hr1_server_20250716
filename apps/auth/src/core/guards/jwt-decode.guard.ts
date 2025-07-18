import { CanActivate, ExecutionContext, Injectable, HttpException } from '@nestjs/common'
import { jwtDecode } from '@library/utils/crypt.util'
import { Reflector } from '@nestjs/core'
import { AUTHORIZE_KEY_METADATA } from '@core/decorator/metaData'

@Injectable()
export class JwtDecodeGuard implements CanActivate {
  constructor(private reflector: Reflector = null) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    // 检查是否需要跳过JWT解码
    const openAuthorize = this.reflector.get<boolean>(AUTHORIZE_KEY_METADATA, context.getHandler())
    if (openAuthorize) {
      return true
    }

    // 从请求中获取token
    let token: string

    // 优先从Authorization header获取
    if (request.headers['authorization']) {
      token = request.headers['authorization']
    }
    // 其次从请求体中获取
    else if (request.body && request.body.token) {
      token = request.body.token
    }
    // 最后从查询参数中获取
    else if (request.query && request.query.token) {
      token = request.query.token
    }

    if (!token) throw new HttpException('Token不能为空', 401)

    try {
      // 解码JWT token
      const payload = jwtDecode(token)

      if (!payload || !payload.id) {
        throw new HttpException('无效的token', 401)
      }

      request.decodedJwt = {
        token: token,
        payload: payload,
        userId: payload.id,
        platform: payload.platform,
      }

      return true
    } catch (error) {
      throw new HttpException('Token解码失败', 401)
    }
  }
}
