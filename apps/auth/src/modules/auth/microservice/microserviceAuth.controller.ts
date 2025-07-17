import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { MiService } from '../base/base.service'
import { MicroserviceTokenVerifyDto } from '../base/base.dto'

@Controller()
export class MicroserviceAuthController {
  constructor(private readonly miService: MiService) {}

  @MessagePattern('auth.verify.token')
  async verifyToken(@Payload() data: { token: string; serviceId: string }) {
    try {
      const dto: MicroserviceTokenVerifyDto = { token: data.token }

      const result = await this.miService.verifyMicroserviceToken(dto)
      console.log('[MicroserviceAuthController] token验证成功:', dto, result)
      return result
    } catch (error) {
      return {
        valid: false,
        message: error.message || 'Token验证失败',
      }
    }
  }

  @MessagePattern('auth.health.check')
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'auth',
    }
  }
}
