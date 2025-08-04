import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common'
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { MiService } from './base.service'
import { TokenGetUserDto, UserLoginDto, MicroserviceTokenVerifyDto, RefreshTokenDto, LogoutDto, UserRegisterDto } from './base.dto'
import { CensorParamPipe } from '@core/pipe/censorParam.pipe'
import { OpenAuthorize } from '@core/decorator/metaData'
import { FileService } from '@modules/file/file.service'
import { CurrentUser } from '@core/decorator/request'
import { JwtDecodeController } from '@core/decorator/controller'

@ApiTags('我的')
@ApiBearerAuth()
@JwtDecodeController('base')
export class MiController {
  constructor(private readonly service: MiService, private readonly fileService: FileService) {}

  @ApiOperation({ summary: '用户注册' })
  @OpenAuthorize()
  @Post('register')
  async register(@Body(new CensorParamPipe()) dto: UserRegisterDto) {
    return await this.service.register(dto)
  }

  @ApiOperation({ summary: '登录' })
  @OpenAuthorize()
  @Post('login')
  async login(@Body(new CensorParamPipe()) dto: UserLoginDto, @Req() req: any) {
    const ipAddress = req.ip || req.connection.remoteAddress
    const userAgent = req.headers['user-agent']
    return await this.service.login(dto, ipAddress, userAgent)
  }

  @ApiOperation({ summary: '根据token获取用户信息' })
  @OpenAuthorize()
  @Post('info')
  async getUserInfo(@Body(new CensorParamPipe()) dto: TokenGetUserDto, @Req() req) {
    return await this.service.tokenGetUser(dto)
  }

  @ApiOperation({ summary: '微服务Token验证' })
  @OpenAuthorize()
  @Post('verify')
  async verifyMicroserviceToken(@Body(new CensorParamPipe()) dto: MicroserviceTokenVerifyDto, @Req() req) {
    const clientInfo = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    }
    return await this.service.verifyMicroserviceToken(dto, clientInfo)
  }

  @ApiOperation({ summary: '刷新Token' })
  @OpenAuthorize()
  @Post('refresh')
  async refreshToken(@Body(new CensorParamPipe()) dto: RefreshTokenDto, @Req() req) {
    const clientInfo = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    }
    return await this.service.refreshToken(dto, clientInfo)
  }

  @ApiOperation({ summary: '登出' })
  @Post('logout')
  async logout(@Body(new CensorParamPipe()) dto: LogoutDto, @CurrentUser() user: any) {
    return await this.service.logout(dto, user)
  }

  @ApiOperation({ summary: '获取用户所有Token' })
  @Get('tokens')
  async getUserTokens(@CurrentUser() user: any, @Query('platform') platform?: string) {
    return await this.service.getUserTokens(user.id, platform)
  }

  @ApiOperation({ summary: '撤销指定Token' })
  @Post('revoke')
  async revokeToken(@Body('tokenId') tokenId: number, @CurrentUser() user: any) {
    return await this.service.revokeToken(tokenId, user.id)
  }
}
