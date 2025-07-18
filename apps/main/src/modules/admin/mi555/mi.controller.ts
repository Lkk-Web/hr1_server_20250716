import { OpenAuthorize } from '@core/decorator/metaData'
import { AdminAuth } from '@core/decorator/controller'
import { Body, HttpCode, HttpException, HttpStatus, Post, Request, UploadedFile, UseInterceptors } from '@nestjs/common'
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserLoginDto } from './mi.dto'
import { MiService } from './mi.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { Aide } from '@library/utils/aide'
import { FileUploadDto } from '../../file/file.dto'
import { CensorParamPipe } from '@core/pipe/censorParam.pipe'
import { CurrentUser } from '@core/decorator/request'

@ApiTags('我的')
@AdminAuth('mi')
export class MiController {
  constructor(private readonly service: MiService) {}

  @OpenAuthorize()
  @Post()
  create(@Body() createAdminDto) {
    // return this.service.create(createAdminDto)
  }

  @ApiOperation({ summary: '登录' })
  @OpenAuthorize()
  @Post('login')
  async postToken(@Body(new CensorParamPipe()) dto: UserLoginDto) {
    // return await this.service.postToken(dto)
  }

  @ApiOperation({ summary: '自动登录' })
  @OpenAuthorize()
  @Post('autoLogin')
  async postAutoToken(@Request() req, @CurrentUser() admin: any) {}

  @ApiOperation({ summary: '文件上传示例' })
  @OpenAuthorize()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fieldSize: 55555,
      },
    })
  )
  @ApiBody({
    description: '文件上传',
    type: FileUploadDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('upload')
  async upload(@UploadedFile() file) {
    if (!file) throw new HttpException(null, 400014)
    const result = await Aide.bufferUpOSS(file.buffer, file.originalname)
    return result
  }
}
