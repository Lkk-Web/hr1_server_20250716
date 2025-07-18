import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger'
import {
  Body,
  Get,
  Req,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Put,
  Delete,
  Controller,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common'
import { FileDto, FileUploadDto } from './file.dto'
import { Request } from 'express'
import { FileInterceptor } from '@nestjs/platform-express'
import * as configs  from "@common/config";

@ApiTags('文件(公共)')
@ApiBearerAuth()
@Controller('file')
export class FileController {
  constructor() {}
  @ApiOperation({ summary: '文件上传，接收 multipart/form-data 的数据。此接口一般不会暴露' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '文件上传',
    type: FileUploadDto,
  })
  @UseInterceptors(
      FileInterceptor('file', {
        limits: {
          fieldSize: 9999999,
        },
      })
  )
  @HttpCode(HttpStatus.OK)
  @Post('upload')
  async upload(@UploadedFile() file) {
    return file
  }
}
