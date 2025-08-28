import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Body, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Post, Put, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common'
import { AdminAuth } from '@core/decorator/controller'
import { ProcessService } from './process.service'
import { CProcessDto, findMaterialDto, FindPaginationDto, UProcessDto, FindProcessDto } from './process.dto'
import { FileInterceptor } from '@nestjs/platform-express'
import { Sequelize } from 'sequelize-typescript'
import { CurrentPage } from '@core/decorator/request'
import { ApiPlatformWhitelist, OpenAuthorize } from '@core/decorator/metaData'
import { FileUploadDto } from '@modules/file/file.dto'
import { deleteIdsDto } from '@common/dto'

@ApiTags('工序')
@ApiBearerAuth()
@AdminAuth('process')
export class ProcessController {
  constructor(private readonly service: ProcessService, private readonly sequelize: Sequelize) {}
  @ApiOperation({ summary: '创建' })
  @HttpCode(HttpStatus.OK)
  @Post('/')
  async create(@Body() dto: CProcessDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.create(dto, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Put(':id')
  async edit(@Body() dto: UProcessDto, @Param() params, @Req() req) {
    let { factoryCode, loadModel } = req
    const { id } = params
    const result = await this.service.edit(dto, id, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Delete(':id')
  async delete(@Param() params, @Req() req) {
    let { factoryCode, loadModel } = req
    const { id } = params
    const result = await this.service.delete(id, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiPlatformWhitelist(['admin', 'station'])
  @ApiOperation({ summary: '详情' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Get('find/:id')
  async find(@Param() Param, @Query() dto: FindProcessDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.find(Param.id, loadModel, dto)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @ApiPlatformWhitelist(['admin', 'station'])
  @Get('findPagination')
  async findPagination(@Query() dto: FindPaginationDto, @CurrentPage() pagination: Pagination, @Req() req) {
    const result = await this.service.findPagination(dto, pagination)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '精简列表' })
  @Get('simplify')
  @OpenAuthorize()
  async simplify(@Query() dto: FindPaginationDto, @CurrentPage() pagination: Pagination) {
    const result = await this.service.findPagination(dto, pagination, true)
    return result
  }

  @ApiOperation({ summary: 'excel导入' })
  @HttpCode(HttpStatus.OK)
  @Post('/import')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file, @Body() body: FileUploadDto, @Req() req) {
    let { factoryCode, loadModel } = req
    if (!file) {
      throw new HttpException('File is missing!', 400)
    }
    const result = await this.service.importExcel(file.buffer, loadModel)
    return result
  }

  @ApiOperation({ summary: '批量删除' })
  @HttpCode(HttpStatus.OK)
  @Post('batDelete')
  async batDelete(@Body() dto: deleteIdsDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.batDelete(dto, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '根据工序查找物料' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Get('findMaterial/:id')
  async findMaterial(@Query() dto: findMaterialDto, @Param() Param, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.findMaterial(dto, Param.id, loadModel)
    return result
  }
}
