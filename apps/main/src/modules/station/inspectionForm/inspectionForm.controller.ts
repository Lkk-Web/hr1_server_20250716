import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Body, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req } from '@nestjs/common'
import { StationAuth } from '@core/decorator/controller'
import { InspectionFormService } from './inspectionForm.service'
import { AuditDto, FindPaginationDto, UInspectionFormDto } from '@modules/admin/inspectionForm/inspectionForm.dto'
import { CurrentPage } from '@core/decorator/request'
import { deleteIdsDto } from '@common/dto'
import { InspectionFormService as AdminInspectionFormService } from '@modules/admin/inspectionForm/inspectionForm.service'

@ApiTags('报工检验单')
@ApiBearerAuth()
@StationAuth('inspectionForm')
export class InspectionFormController {
  constructor(private readonly service: InspectionFormService, private readonly adminInspectionFormService: AdminInspectionFormService) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Put(':id')
  async edit(@Body() dto: UInspectionFormDto, @Param() params, @Req() req) {
    const { id } = params
    const result = await this.adminInspectionFormService.edit(dto, id)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Delete(':id')
  async delete(@Param() params, @Req() req) {
    const { id } = params
    const result = await this.adminInspectionFormService.delete(id)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '详情' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Get('find/:id')
  async find(@Param() Param, @Req() req) {
    const result = await this.adminInspectionFormService.find(Param.id)
    return result
  }
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @Get('findPagination')
  async findPagination(@Query() dto: FindPaginationDto, @CurrentPage() pagination: Pagination, @Req() req) {
    const result = await this.adminInspectionFormService.findPagination(dto, pagination, true)
    return result
  }

  @ApiOperation({ summary: '审核' })
  @HttpCode(HttpStatus.OK)
  @Post('audit')
  async audit(@Body() dto: AuditDto, @Req() req) {
    const result = await this.adminInspectionFormService.audit(dto, { id: req.team.teamUser.userId })
    return result
  }

  @ApiOperation({ summary: '批量删除' })
  @HttpCode(HttpStatus.OK)
  @Post('batDelete')
  async batDelete(@Body() dto: deleteIdsDto, @Req() req) {
    const result = await this.adminInspectionFormService.batDelete(dto)
    return result
  }
}
