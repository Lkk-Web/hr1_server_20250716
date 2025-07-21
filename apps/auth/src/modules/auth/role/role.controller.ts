import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Body, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Post, Put, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Sequelize } from 'sequelize-typescript'
import { IPUtil } from '@library/utils/ip.util'
import { CurrentPage } from '@core/decorator/request'
import { FileUploadDto } from '@modules/file/file.dto'
import { JwtDecodeController } from '@core/decorator/controller'
import { RoleService } from './role.service'
import { FindPaginationDto, RoleCreateDto, RoleEditDto } from './role.dto'

@ApiTags('角色')
@ApiBearerAuth()
@JwtDecodeController('role')
export class RoleController {
  constructor(private readonly service: RoleService, private readonly sequelize: Sequelize) {}
  @ApiOperation({ summary: '创建' })
  @HttpCode(HttpStatus.OK)
  @Post('/')
  async create(@Body() dto: RoleCreateDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.create(dto, req.user, IPUtil.getIp(req).replace('::ffff:', ''), loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Put(':id')
  async edit(@Body() dto: RoleEditDto, @Param() params, @Req() req) {
    let { factoryCode, loadModel } = req
    const { id } = params
    const result = await this.service.edit(dto, id, req.user, IPUtil.getIp(req).replace('::ffff:', ''), loadModel)
    return result
  }

  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: '修改角色菜单权限' })
  // @ApiParam({ name: 'roleId', required: true, description: 'roleId', type: Number })
  // @Put('editRoleMenuPower/:roleId')
  // async editRoleMenuPower(@Body() dto: ESYSRoleMenuPowerDto, @Param() params, @Req() req) {
  // 	const { roleId } = params;
  // 	const result = await this.service.editRoleMenuPower(dto, roleId, req.user);
  // 	return result;
  // }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Delete(':id')
  async delete(@Param() params, @Req() req) {
    const { id } = params
    let { factoryCode, loadModel } = req
    const result = await this.service.delete(id, req.user, IPUtil.getIp(req).replace('::ffff:', ''), loadModel)
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
