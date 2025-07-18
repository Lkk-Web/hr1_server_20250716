import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Body, Get, HttpCode, HttpStatus, Param, Post, Req } from '@nestjs/common'
import { StationAuth } from '@core/decorator/controller'
import { EquipmentService } from './equipment.service'
import { CPadRepairOrderDto } from './equipment.dto'
import { EquipmentLedger } from '@model/equipment/equipmentLedger.model'
import { CCheckOrderDto } from '@modules/admin/checkOrder/checkOrder.dto'
import { CMaintenanceOrderDto } from '@modules/admin/maintenanceOrder/maintenanceOrder.dto'
import { MaintenanceOrderService } from '@modules/admin/maintenanceOrder/maintenanceOrder.service'

@ApiTags('设备管理')
@ApiBearerAuth()
@StationAuth('equipment')
export class EquipmentController {
  constructor(private readonly service: EquipmentService, private readonly maintenanceOrderService: MaintenanceOrderService) {}

  @ApiOperation({ summary: '创建保养单' })
  @HttpCode(HttpStatus.OK)
  @Post('maintenance')
  async create(@Body() dto: CMaintenanceOrderDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.maintenanceOrderService.create(dto, { id: req.team.teamUser.userId }, loadModel)
    return result
  }

  @ApiOperation({ summary: '点检报告' })
  @HttpCode(HttpStatus.OK)
  @Post('inspection')
  async createInspection(@Body() dto: CCheckOrderDto) {
    return this.service.createInspection(dto)
  }

  @ApiOperation({ summary: '维修报告' })
  @HttpCode(HttpStatus.OK)
  @Post('repair')
  async createRepair(@Body() dto: CPadRepairOrderDto) {
    const result = await this.service.createRepair(dto)
    return result
  }

  //班组列表
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '班组的设备列表' })
  @Get('ledger')
  async deviceList(@Req() req) {
    return EquipmentLedger.findAll({
      attributes: ['id', 'code', 'equipmentTypeId', 'status', 'spec', 'image'],
      include: [
        { association: 'teamEquipmentLedger', attributes: [], where: { teamId: req.team.id } },
        { association: 'equipment', attributes: ['name'] },
      ],
    })
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '设备台账详情' })
  @Get('ledger/:id')
  async ledgerFind(@Param('id') id: number) {
    return this.service.ledgerFind(id)
  }
}
