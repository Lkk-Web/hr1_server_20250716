import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { CurrentPage } from '@core/decorator/request'
import { Pagination } from '@common/interface'
import { Body, Get, HttpCode, HttpException, HttpStatus, Param, Post, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common'
import { AdminAuth } from '@core/decorator/controller'
import { ManHourService } from './manHour.service'
import { CBatchManHourDto, ManHourPageDto } from './manHour.dto'
import { FileUploadDto } from '@modules/file/file.dto'
import { FileInterceptor } from '@nestjs/platform-express'

@ApiTags('工时配置')
@ApiBearerAuth()
@AdminAuth('hour')
export class ManHourController {
  constructor(private readonly service: ManHourService) {}
  @ApiOperation({ summary: '创建或编辑' })
  @HttpCode(HttpStatus.OK)
  @Post('')
  async create(@Body() dto: CBatchManHourDto, @Req() req) {
    return this.service.createOrUpdate(dto, req.user.id)
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '详情' })
  @ApiParam({ name: 'id', required: true, description: '物料id', type: Number })
  @Get('find/:id')
  async find(@Param('id') id: number) {
    return this.service.find(id)
  }
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '工时配置列表' })
  @Get('')
  async findPagination(@Query() dto: ManHourPageDto, @CurrentPage() pagination: Pagination) {
    return this.service.findPagination(dto, pagination)
  }

  @ApiOperation({ summary: '工时配置导入' })
  @HttpCode(HttpStatus.OK)
  @Post('/import')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file, @Body() body: FileUploadDto, @Req() req) {
    if (!file) {
      throw new HttpException('File is missing!', 400)
    }
    return this.service.import(file.buffer, req.user.id)
  }

  /*  @ApiOperation({ summary: '批量删除' })
  @HttpCode(HttpStatus.OK)
  @Post('batDelete')
  async batDelete(@Body() dto: deleteIdsDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.batDelete(dto, loadModel)
    return result
  }*/
}
