import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Inject } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AUTHORIZE_KEY_METADATA } from '@core/decorator/metaData'
import { ClientProxy } from '@nestjs/microservices'
import { firstValueFrom, timeout, catchError } from 'rxjs'
import { of } from 'rxjs'

@Injectable()
export class MicroserviceAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const start: any = new Date()
    // 检查是否跳过授权验证
    const skipAuth = this.reflector.getAllAndOverride<boolean>(AUTHORIZE_KEY_METADATA, [context.getHandler(), context.getClass()])

    if (skipAuth) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization

    if (!authHeader) throw new UnauthorizedException('缺少Authorization token')

    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      throw new UnauthorizedException('Token格式错误')
    }

    // 获取请求路径和方法
    const requestPath = request.url
    const requestMethod = request.method
    const requestBody = request.body ? JSON.stringify(request.body) : ''
    const requestParams = request.params ? JSON.stringify(request.params) : ''
    const requestQuery = request.query ? JSON.stringify(request.query) : ''

    try {
      // 发送微服务消息到Auth服务
      const result = await firstValueFrom(
        this.authClient
          .send('auth.verify.token', {
            token,
            serviceId: 'main-service',
            path: requestPath,
            method: requestMethod,
            body: requestBody,
            params: requestParams,
            query: requestQuery,
            ip: request.ip,
          })
          .pipe(
            timeout(5000), // 5秒超时
            catchError(error => {
              console.error('[MicroserviceAuthGuard] 微服务调用失败:', error.message)
              return of({ valid: false, message: error.message })
            })
          )
      )

      const end = Date.now()
      console.log(`耗时：${end - start} ms`)

      if (result.valid) {
        // 将用户信息附加到请求对象
        request.user = result.user
        return true
      } else {
        throw new UnauthorizedException(result.message)
      }
    } catch (error) {
      throw new UnauthorizedException(error)
    }
  }
}
