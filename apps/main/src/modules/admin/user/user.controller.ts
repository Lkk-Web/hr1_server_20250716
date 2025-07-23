import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Body, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Post, Put, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common'
import { AdminAuth } from '@core/decorator/controller'
import { UserService } from './user.service'
import { CUserDto, FindPaginationDto, SUserDto, UUserDto } from './user.dto'
import { FileInterceptor } from '@nestjs/platform-express'
import { CurrentPage } from '@core/decorator/request'
import { OpenAuthorize } from '@core/decorator/metaData'
import { FileUploadDto } from '@modules/file/file.dto'
import { ApiDictService } from '@modules/admin/apiDict/apiDict.service'

@ApiTags('员工')
@ApiBearerAuth()
@AdminAuth('user')
export class UserController {
  constructor(private readonly service: UserService, private readonly apiDictService: ApiDictService) {}
  @ApiOperation({ summary: '创建' })
  @HttpCode(HttpStatus.OK)
  @Post('/')
  async create(@Body() dto: CUserDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.create(dto, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Put(':id')
  async edit(@Body() dto: UUserDto, @Param() params, @Req() req) {
    let { factoryCode, loadModel } = req
    const { id } = params
    const result = await this.service.edit(dto, id, loadModel)
    return result
  }

  @ApiOperation({ summary: '批量同步金蝶员工数据，同时同步部门' })
  @HttpCode(HttpStatus.OK)
  @Post('/asyncKingdee')
  async asyncKingdee() {
    //先同步任岗再同步用户
    await this.apiDictService.syncDict()
    const result = await this.service.asyncKingdee()
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '同步用户' })
  @Post('syncUser')
  async syncUser(@Body() dto: SUserDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.syncUser(dto, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '重置密码' })
  @OpenAuthorize()
  @ApiParam({ name: 'id', required: true, description: '用户id', type: Number })
  @Put('resetPassword/:id')
  async resetPassword(@Param() params, @Req() req) {
    const { id } = params
    const result = await this.service.resetPassword(id, req.user)
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
  @ApiOperation({ summary: '详情' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Get('find/:id')
  async find(@Param() Param, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.find(Param.id, loadModel)
    return result
  }
  
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @Get('findPagination')
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
}
