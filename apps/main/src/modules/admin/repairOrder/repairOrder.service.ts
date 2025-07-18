import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { CRepairOrderDto, FindPaginationDto, RepairActionDto, RepairOrderDetailDTO, URepairOrderDto } from './repairOrder.dto'
import { RepairOrder } from '@model/equipment/repairOrder.model'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { InspectionOrder } from '@model/equipment/inspectionOrder.model'
import { RepairOrderDetail } from '@model/equipment/repairOrderDetail.model'
import { RepairOrderResult } from '@model/equipment/repairOrderResult.model'
import { RepairOrderReceive } from '@model/equipment/repairOrderReceive.model'
import { EquipmentLedger } from '@model/equipment/equipmentLedger.model'
import dayjs = require('dayjs')
import moment = require('moment')
import { Paging } from '@library/utils/paging'

@Injectable()
export class RepairOrderService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(RepairOrder)
    private repairOrderModel: typeof RepairOrder,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CRepairOrderDto, user, loadModel) {
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
      createdUserId: user.id,
      updatedUserId: user.id,
    })
    if (dto.detail) {
      await RepairOrderDetail.create({ repairOrderId: result.id, ...dto.detail })
    }
    await EquipmentLedger.update({ status: '维修中' }, { where: { id: dto.equipmentLedgerId } })
    return result
  }

  public async edit(dto: URepairOrderDto, id: number, user, loadModel) {
    let repairOrder = await RepairOrder.findOne({ where: { id } })
    if (!repairOrder) {
      throw new HttpException('数据不存在', 400006)
    }
    await repairOrder.update({
      equipmentLedgerId: dto.equipmentLedgerId,
      updatedUserId: user.id,
    })

    if (dto.detail && Object.keys(dto.detail).length > 0 && repairOrder.status != '维修验收') {
      await RepairOrderDetail.update({ repairOrderId: id, ...dto.detail }, { where: { repairOrderId: id } })
    }

    if (dto.result && Object.keys(dto.result).length > 0 && repairOrder.status != '维修验收') {
      const result = await RepairOrderResult.findOne({ where: { repairOrderId: id } })
      if (result) {
        await RepairOrderResult.update({ repairOrderId: id, ...dto.result }, { where: { repairOrderId: id } })
      } else {
        await RepairOrderResult.create({ repairOrderId: id, ...dto.result })
      }
    }

    if (dto.receive && Object.keys(dto.receive).length > 0) {
      const receive = await RepairOrderReceive.findOne({ where: { repairOrderId: id } })
      if (receive) {
        await RepairOrderReceive.update({ ...dto.receive }, { where: { repairOrderId: id } })
      } else {
        await RepairOrderReceive.create({ repairOrderId: id, ...dto.receive })
      }
      await EquipmentLedger.update({ status: dto.receive.status }, { where: { id: repairOrder.equipmentLedgerId } })
    }
    repairOrder = await RepairOrder.findOne({ where: { id } })
    return repairOrder
  }

  public async delete(id: number, loadModel) {
    await RepairOrderDetail.destroy({ where: { repairOrderId: id } })
    await RepairOrderResult.destroy({ where: { repairOrderId: id } })
    await RepairOrderReceive.destroy({ where: { repairOrderId: id } })
    const result = await RepairOrder.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = {
      where: { id },
      include: [
        {
          association: 'equipmentLedger',
          attributes: ['id', 'code', 'equipmentId', 'workShopId', 'installLocationId', 'inspectionPlanId', 'checkStandardId', 'maintenancePlanId'],
          where: {},
          include: [
            {
              association: 'equipment',
              attributes: ['id', 'name'],
              where: {},
            },
            {
              association: 'workShop',
              attributes: ['id', 'name'],
            },
            {
              association: 'installLocation',
              attributes: ['id', 'locate'],
            },
          ],
        },
        {
          association: 'detail',
          attributes: ['id', 'description', 'images', 'videos', 'repairDate', 'reportUserId'],
          where: {},
          include: [
            {
              association: 'reportUser',
              attributes: ['id', 'userName'],
            },
          ],
        },
        {
          association: 'result',
          attributes: ['id', 'isRepair', 'cancelReason', 'type', 'faultReason', 'explain', 'startAt', 'endAt'],
          include: [
            {
              association: 'repairUser',
              attributes: ['id', 'userName'],
            },
          ],
        },
        {
          association: 'receive',
          attributes: ['id', 'isRepaired', 'status', 'score', 'evaluate'],
        },
        {
          association: 'createdUser',
          attributes: ['id', 'userName'],
          required: false,
        },
        {
          association: 'updatedUser',
          attributes: ['id', 'userName'],
          required: false,
        },
      ],
    }
    const result = await RepairOrder.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'equipmentLedger',
          attributes: ['id', 'code', 'equipmentId', 'workShopId', 'installLocationId', 'inspectionPlanId', 'checkStandardId', 'maintenancePlanId'],
          where: {},
          include: [
            {
              association: 'equipment',
              attributes: ['id', 'name'],
              where: {},
            },
            {
              association: 'workShop',
              attributes: ['id', 'name'],
            },
            {
              association: 'installLocation',
              attributes: ['id', 'locate'],
            },
          ],
        },
        {
          association: 'detail',
          attributes: ['id', 'description', 'images', 'videos', 'repairDate', 'reportUserId'],
          where: {},
          include: [
            {
              association: 'reportUser',
              attributes: ['id', 'userName'],
            },
          ],
        },
        {
          association: 'result',
          attributes: ['id', 'isRepair', 'cancelReason', 'type', 'faultReason', 'explain', 'startAt', 'endAt'],
          include: [
            {
              association: 'repairUser',
              attributes: ['id', 'userName'],
            },
          ],
        },
        {
          association: 'receive',
          attributes: ['id', 'isRepaired', 'status', 'score', 'evaluate'],
        },
        {
          association: 'createdUser',
          attributes: ['id', 'userName'],
          required: false,
        },
        {
          association: 'updatedUser',
          attributes: ['id', 'userName'],
          required: false,
        },
      ],
    }
    if (dto.orderCode) {
      options.where['code'] = {
        [Op.like]: `%${dto.orderCode}%`,
      }
    }

    if (dto.name) {
      options.include[0].include[0].where['name'] = {
        [Op.like]: `%${dto.name}%`,
      }
    }

    if (dto.code) {
      options.include[0].where['code'] = {
        [Op.like]: `%${dto.code}%`,
      }
    }

    if (dto.status) {
      options.where['status'] = {
        [Op.eq]: dto.status,
      }
    }

    if (dto.repairDate) {
      const start = moment(dto.repairDate[0]).format('YYYY-MM-DD HH:mm:ss')
      const end = moment(dto.repairDate[1]).format('YYYY-MM-DD HH:mm:ss')
      options.include[1].where['repairDate'] = {
        [Op.between]: [start, end],
      }
    }
    const result = await Paging.diyPaging(RepairOrder, pagination, options)

    return result
  }

  public async action(dto: RepairActionDto, loadModel) {
    for (const id of dto.ids) {
      const repairOrder = await RepairOrder.findByPk(id)
      if (!repairOrder) throw new HttpException('出现未知异常,没有找到id为' + id + '的维修单', 400)
      if (dto.action === '维修开始') {
        if (repairOrder.status != '故障报修') throw new HttpException('维修开始只能针对维修单状态为：“故障报修”的维修单进行操作', 400)
        await repairOrder.update({ status: '故障维修' })
        await RepairOrderResult.create({ repairOrderId: id, startAt: new Date(moment().format('YYYY-MM-DD HH:mm:ss')) })
      } else if (dto.action === '维修完成') {
        if (repairOrder.status != '故障维修') throw new HttpException('维修完成只能针对维修单状态为：“故障维修”的维修单进行操作', 400)
        await repairOrder.update({ status: '维修完成' })
        await RepairOrderResult.update({ repairOrderId: id, endAt: new Date(moment().format('YYYY-MM-DD HH:mm:ss')) }, { where: { repairOrderId: id } })
      } else if (dto.action === '维修验收') {
        if (repairOrder.status != '维修完成') throw new HttpException('维修验收只能针对维修单状态为：“维修完成”的维修单进行操作', 400)
        await repairOrder.update({ status: '维修验收' })
      }
    }
    return await this.find(dto.ids[0], loadModel)
  }
}
