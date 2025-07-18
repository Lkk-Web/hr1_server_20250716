import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { CurrentPage } from '@core/decorator/request'
import { Pagination } from '@common/interface'
import { Body, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Post, Put, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common'
import { AdminAuth } from '@core/decorator/controller'
import { MaterialService } from './material.service'
import { CMaterialDto, FindByWarehouseDto, FindPaginationDto, UMaterialDto } from './material.dto'
import { FileInterceptor } from '@nestjs/platform-express'
import { Sequelize } from 'sequelize-typescript'
import { FileUploadDto } from '@modules/file/file.dto'
import { deleteIdsDto } from '@common/dto'
import { Subject } from 'rxjs'
import { OpenAuthorize } from '@core/decorator/metaData'

@ApiTags('物料')
@ApiBearerAuth()
@AdminAuth('material')
export class MaterialController {
  private sseSubject = new Subject<string>()

  constructor(private readonly service: MaterialService, private readonly sequelize: Sequelize) {}

  @ApiOperation({ summary: '创建' })
  @HttpCode(HttpStatus.OK)
  @Post('/')
  @OpenAuthorize()
  async create(@Body() dto: CMaterialDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.create(dto, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Put(':id')
  @OpenAuthorize()
  async edit(@Body() dto: UMaterialDto, @Param() params, @Req() req) {
    const { id } = params
    let { factoryCode, loadModel } = req
    const result = await this.service.edit(dto, id, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Delete(':id')
  @OpenAuthorize()
  async delete(@Param() params, @Req() req) {
    const { id } = params
    let { factoryCode, loadModel } = req
    const result = await this.service.delete(id, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '详情' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Get('find/:id')
  @OpenAuthorize()
  async find(@Param() Param, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.find(Param.id, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @Get('findPagination')
  @OpenAuthorize()
  async findPagination(@Query() dto: FindPaginationDto, @CurrentPage() pagination: Pagination, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.findPagination(dto, pagination, loadModel)
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
    return this.service.importExcel(file.buffer, loadModel)
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
  @ApiOperation({ summary: '根据仓库查物料库存' })
  @Get('findByWarehouse')
  async findByWarehouse(@Query() dto: FindByWarehouseDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.findByWarehouse(dto, loadModel)
    return result
  }

  // @Sse('sse/batch')
  // @ApiOperation({ summary: "批量上传" })
  // sse(@Query() query): Observable<MessageEvent> {
  //   const { fileName, cover = 'false' } = query
  //   // console.log('fileName: ', fileName);
  //   // const filename = '企业信息批量导入.xlsx'
  //   return BatchUtil.create(fileName, async (item: any[]) => {
  //     // console.log('item: ', item);
  //     // const [name, code, legalPerson, contacts, type, business, area, address, introduce, remark, aboveScaleType,
  //     //   selectionTime] = item
  //     // const params: PACompany = new PACompany()
  //     // Object.assign(params, { name, code, legalPerson, contacts, type, business, area, address, introduce,
  //     //   remark, aboveScaleType, selectionTime })
  //
  //     // 手动执行验证
  //     const errors: ValidationError[] = validateSync(item);
  //     if (errors.length) {
  //       // 拼接错误消息
  //       const errorMessage = errors.map(error => Object.values(error.constraints)).join('。 ');
  //       throw errorMessage
  //     }
  //     return MaterialService.importExcel(item, JSON.parse(cover))
  //   })
  // }
}
