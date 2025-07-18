import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Permissions } from '@core/decorator/metaData'
import { Body, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Post, Put, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common'
import { AdminAuth } from '@core/decorator/controller'
import { SYSOrgService } from '../services/SYSOrg.service'
import { CSYSOrgDto, ESYSOrgDto, FindAllDto } from '../dtos/SYSOrg.dto'
import { SYSOrg } from '@model/sys/SYSOrg.model'
import { FileInterceptor } from '@nestjs/platform-express'
import { Sequelize } from 'sequelize-typescript'
import { OpenAuthorize } from '@core/decorator/metaData'
import { FileUploadDto } from '@modules/file/file.dto'

@ApiTags('组织/部门')
@ApiBearerAuth()
@AdminAuth('SYSOrg')
export class SYSOrgController {
  constructor(private readonly service: SYSOrgService, private readonly sequelize: Sequelize) {}
  @ApiOperation({ summary: '创建' })
  @HttpCode(HttpStatus.OK)
  @Post('/')
  @Permissions('sy:or:add')
  async create(@Body() dto: CSYSOrgDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.create(dto, req.user, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Put(':id')
  @Permissions('sy:or:edit')
  async edit(@Body() dto: ESYSOrgDto, @Param() params, @Req() req) {
    let { factoryCode, loadModel } = req
    const { id } = params
    const result = await this.service.edit(dto, id, req.user, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Delete(':id')
  @Permissions('sy:or:del')
  async delete(@Param() params, @Req() req) {
    let { factoryCode, loadModel } = req
    const { id } = params
    const result = await this.service.delete(id, req.user, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '详情' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Get('find/:id')
  @Permissions('sy:or:list')
  async find(@Param() Param, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.find(Param.id, loadModel)
    return result
  }
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @Get('findPagination')
  @OpenAuthorize()
  @Permissions('sy:or:list')
  async findPagination(@Query() dto: FindAllDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.findAll(dto, loadModel)
    return result
  }

  @ApiOperation({ summary: '上移部门' })
  @HttpCode(HttpStatus.OK)
  @Post('move-up/:id')
  async moveUp(@Param('id') id: number, @Req() req) {
    let { factoryCode, loadModel } = req
    return this.service.moveUp(id, loadModel)
  }

  @ApiOperation({ summary: '下移部门' })
  @HttpCode(HttpStatus.OK)
  @Post('move-down/:id')
  async moveDown(@Param('id') id: number, @Req() req) {
    let { factoryCode, loadModel } = req
    return this.service.moveDown(id, loadModel)
  }

  @ApiOperation({ summary: 'excel导入' })
  @HttpCode(HttpStatus.OK)
  @Post('/import')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @OpenAuthorize()
  async import(@UploadedFile() file, @Body() body: FileUploadDto, @Req() req) {
    let { factoryCode, loadModel } = req
    if (!file) {
      throw new HttpException('File is missing!', 400)
    }
    return this.service.importExcel(file.buffer, loadModel)
  }
}
