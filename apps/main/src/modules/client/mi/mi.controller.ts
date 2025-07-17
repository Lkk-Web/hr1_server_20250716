import { ApiPlatformWhitelist, OpenAuthorize } from '@core/decorator/metaData'
import { Controller, HttpCode, HttpException, HttpStatus, Post, Req, Request, UploadedFile, UseInterceptors } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { MiService } from './mi.service'
import { CurrentUser } from '@core/decorator/request'
import { FileInterceptor } from '@nestjs/platform-express'
import { FileUploadDto } from '../../file/file.dto'
import { Express } from 'express'
import { FileService } from '@modules/file/file.service'
import { FileSizeValidationPipe } from '@core/pipe/fileSizeValidationPipe'
import { ClientAuth } from '@core/decorator/controller'

@ClientAuth('mi')
@ApiTags('我的')
@ApiBearerAuth()
export class MiController {
  constructor(private readonly service: MiService, private readonly fileService: FileService) {}

  @ApiOperation({ summary: 'API health check' })
  @ApiPlatformWhitelist(['admin'])
  @Post('health')
  async postAutoToken(@Request() req, @CurrentUser() user: any) {
    return { message: 'success', code: 200, data: user }
  }

  @ApiOperation({ summary: '文件上传示例' })
  @OpenAuthorize()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({
    description: '文件上传',
    type: FileUploadDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('upload')
  async upload(@UploadedFile(new FileSizeValidationPipe(1024 * 100)) file: Express.Multer.File, @Req() req) {
    if (!file) throw new HttpException(null, 400014)
    file.originalname = req.headers['filename'] || file.originalname
    const result = await this.fileService.uploadFile(file)
    return result
  }
}
