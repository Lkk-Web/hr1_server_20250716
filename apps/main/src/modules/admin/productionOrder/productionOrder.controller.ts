import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Body, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Post, Put, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common'
import { AdminAuth } from '@core/decorator/controller'
import { ProductionOrderService } from './productionOrder.service'
import { actionDto, CProductionOrderDTO, ERPFindPaginationDto, FindPaginationDto, pobDto, POBPaginationDto, priorityDto } from './productionOrder.dto'
import { FileInterceptor } from '@nestjs/platform-express'
import { Sequelize } from 'sequelize-typescript'
import { CurrentPage } from '@core/decorator/request'
import { OpenAuthorize } from '@core/decorator/metaData'
import { deleteIdsDto } from '@common/dto'
import { FileUploadDto } from '@modules/file/file.dto'

@ApiTags('生产工单')
@ApiBearerAuth()
@AdminAuth('productionOrder')
export class ProductionOrderController {
  constructor(private readonly service: ProductionOrderService, private readonly sequelize: Sequelize) {}
  @ApiOperation({ summary: '创建' })
  @HttpCode(HttpStatus.OK)
  @Post('/')
  async create(@Body() dto: CProductionOrderDTO, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.create(dto, loadModel)
    return result
  }
  //
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: '修改' })
  // @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  // @Put(':id')
  // async edit(@Body() dto: UProductionOrderDTO, @Param() params, @Req() req) {
  //   let { factoryCode, loadModel } = req
  //   const { id } = params
  //   const result = await this.service.edit(dto, id, loadModel)
  //   return result
  // }

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
  @ApiOperation({ summary: '详情' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Get('find/:id')
  async find(@Query() dto: pobDto, @Param() Param, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.find(Param.id, loadModel, dto)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改优先级' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Put('changePriority/:id')
  async changePriority(@Body() dto: priorityDto, @Param() Param, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.changePriority(dto, Param.id, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @Get('findPagination')
  async findPagination(@Query() dto: FindPaginationDto, @CurrentPage() pagination: Pagination, @Req() req) {
    const result = await this.service.findPagination(dto, pagination, req.user)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取部门不同工单数量' })
  @Get('getOrderCount')
  async getOrderCount(@Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.getOrderCount(req.user, loadModel)
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

  @ApiOperation({ summary: '操作' })
  @HttpCode(HttpStatus.OK)
  @Post('action')
  async action(@Body() dto: actionDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.action(dto, loadModel)
    return result
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
    const result = await this.service.importExcel(file.buffer, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用于选择的工单列表' })
  @Get('simpleList')
  async simpleList(@Query() dto: FindPaginationDto, @CurrentPage() pagination: Pagination, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.simpleList(dto, pagination, req.user, loadModel)
    return result
  }

  @ApiOperation({ summary: '批量同步金蝶生产领料数据', description: '只同步：业务状态开工 单据状态已审核' })
  @HttpCode(HttpStatus.OK)
  @Post('/asyncKingdee')
  @OpenAuthorize()
  async asyncKingdee() {
    const result = await this.service.asyncKingdee()
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'EPRCode选择工单' })
  @Get('ERPCodeSelect')
  async ERPCodeSelect(@Query() dto: ERPFindPaginationDto, @CurrentPage() pagination: Pagination, @Req() req) {
    const result = await this.service.ERPCodeSelect(dto, pagination, req.user)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用料清单列表' })
  @Get('findAllPOB')
  async findAllPOB(@Query() dto: POBPaginationDto, @CurrentPage() pagination: Pagination, @Req() req) {
    const result = await this.service.findAllPOB(dto, pagination, req.user)
    return result
  }
}
