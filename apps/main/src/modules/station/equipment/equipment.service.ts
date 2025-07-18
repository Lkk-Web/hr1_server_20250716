import { HttpException, Injectable } from '@nestjs/common'
import { CPadRepairOrderDto } from './equipment.dto'
import { CheckOrder } from '@model/equipment/checkOrder.model'
import { FindOptions, Op } from 'sequelize'
import { CheckOrderDetail } from '@model/equipment/checkOrderDetail.model'
import { EquipmentLedger } from '@model/equipment/equipmentLedger.model'
import { RepairOrder } from '@model/equipment/repairOrder.model'
import { RepairOrderDetail } from '@model/equipment/repairOrderDetail.model'
import { CCheckOrderDto } from '@modules/admin/checkOrder/checkOrder.dto'

@Injectable()
export class EquipmentService {
  public async createInspection(dto: CCheckOrderDto) {
    if (dto.code) {
      const temp = await CheckOrder.findOne({ where: { code: dto.code } })
      if (temp) throw new HttpException('已存在相同编号的入库单', 400)
    } else {
      const date = new Date()
      const year = date.getFullYear().toString().substring(2)
      const month = date.getMonth().toString().padStart(2, '0')
      const day = date.getDay().toString().padStart(2, '0')
      const temp = await CheckOrder.findOne({
        order: [['id', 'DESC']],
        where: { code: { [Op.like]: `DJ${year}${month}${day}%` } },
      })
      if (temp) {
        const oldNO = temp.code
        const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
        let num = parseInt(lastFourChars)
        num++
        let newNO = num.toString().padStart(4, '0')

        dto.code = 'DJ' + year + month + day + newNO
      } else {
        dto.code = 'DJ' + year + month + day + '0001'
      }
    }
    const result = await CheckOrder.create({
      code: dto.code,
      equipmentLedgerId: dto.equipmentLedgerId,
      checkAt: dto.checkAt,
      checkUserId: dto.checkUserId,
      status: dto.status,
      result: dto.result,
      createdUserId: dto.checkUserId,
      updatedUserId: dto.checkUserId,
    })

    if (dto.details && dto.details.length) {
      await CheckOrderDetail.bulkCreate(
        dto.details.map(detail => ({
          checkOrderId: result.id,
          ...detail,
        }))
      )
    }
    let checkOrder = await CheckOrder.findOne({ where: { id: result.id } })
    await EquipmentLedger.update({ status: checkOrder.status }, { where: { id: checkOrder.equipmentLedgerId } })
    return result
  }

  public async createRepair(dto: CPadRepairOrderDto) {
    if (dto.code) {
      const temp = await RepairOrder.findOne({ where: { code: dto.code } })
      if (temp) throw new HttpException('已存在相同编号的入库单', 400)
    } else {
      const date = new Date()
      const year = date.getFullYear().toString().substring(2)
      const month = date.getMonth().toString().padStart(2, '0')
      const temp = await RepairOrder.findOne({
        order: [['id', 'DESC']],
        where: { code: { [Op.like]: `WX${year}${month}%` } },
      })
      if (temp) {
        const oldNO = temp.code
        const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
        let num = parseInt(lastFourChars)
        num++
        let newNO = num.toString().padStart(4, '0')

        dto.code = 'WX' + year + month + newNO
      } else {
        dto.code = 'WX' + year + month + '0001'
      }
    }
    const result = await RepairOrder.create({
      code: dto.code,
      equipmentLedgerId: dto.equipmentLedgerId,
      status: dto.status,
      createdUserId: dto.reportUserId,
      updatedUserId: dto.reportUserId,
    })
    if (dto.detail) {
      await RepairOrderDetail.create({ repairOrderId: result.id, ...dto.detail })
    }
    await EquipmentLedger.update({ status: '维修中' }, { where: { id: dto.equipmentLedgerId } })
    return result
  }

  //设备详情
  public async ledgerFind(id: number) {
    const options: FindOptions = {
      where: { id },
      include: [
        {
          association: 'equipmentType',
          attributes: ['id', 'name'],
        },
        {
          association: 'equipment',
          attributes: ['id', 'name'],
          where: {},
        },
        {
          association: 'checkStandard',
          attributes: ['id', 'code', 'name', 'status'],
          include: [
            {
              association: 'details',
            },
          ],
        },
        {
          association: 'maintenancePlan',
          attributes: ['id', 'code', 'name', 'frequency', 'status'],
          include: [
            {
              association: 'details',
            },
          ],
        },
      ],
    }
    const result = await EquipmentLedger.findOne(options)
    return result
  }
}
