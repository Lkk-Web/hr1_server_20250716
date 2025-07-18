import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { CInspectionOrderDto, FindPaginationDto, UInspectionOrderDto } from './inspectionOrder.dto'
import { InspectionOrder } from '@model/em/inspectionOrder.model'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { CheckOrder } from '@model/em/checkOrder.model'
import { InspectionOrderDetail } from '@model/em/inspectionOrderDetail.model'
import moment = require('moment')
import { EquipmentLedger } from '@model/em/equipmentLedger.model'
import { User } from '@model/sys/user.model'
import { Paging } from '@library/utils/paging'
import { FileList } from '@model/document/FileList.model'

@Injectable()
export class InspectionOrderService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(InspectionOrder)
    private inspectionOrderModel: typeof InspectionOrder,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CInspectionOrderDto, user, loadModel) {
    if (dto.code) {
      const temp = await InspectionOrder.findOne({ where: { code: dto.code } })
      if (temp) throw new HttpException('已存在相同编号的入库单', 400)
    } else {
      const date = new Date()
      const year = date.getFullYear().toString().substring(2)
      const month = date.getMonth().toString().padStart(2, '0')
      const temp = await InspectionOrder.findOne({
        order: [['id', 'DESC']],
        where: { code: { [Op.like]: `XJ${year}${month}%` } },
      })
      if (temp) {
        const oldNO = temp.code
        const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
        let num = parseInt(lastFourChars)
        num++
        let newNO = num.toString().padStart(4, '0')

        dto.code = 'XJ' + year + month + newNO
      } else {
        dto.code = 'XJ' + year + month + '0001'
      }
    }
    const start = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss')
    const end = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss')

    //查询该设备巡检了几次
    const temp = await InspectionOrder.findAll({ where: { equipmentLedgerId: dto.equipmentLedgerId, createdAt: { [Op.between]: [start, end] } } })

    let count = 1
    if (temp) {
      count = temp.length + 1
    }

    const eq = await EquipmentLedger.findByPk(dto.equipmentLedgerId, {
      include: [
        { association: 'equipment', attributes: ['id', 'name'] },
        { association: 'inspectionPlan', attributes: ['id', 'code', 'name', 'frequency', 'times'] },
      ],
    })
    const user1 = await User.findByPk(user.id)

    const summaryAt = moment(dto.checkAt).format('YYYY-MM-DD HH:mm:ss')
    const result = await InspectionOrder.create({
      code: dto.code,
      equipmentLedgerId: dto.equipmentLedgerId,
      checkAt: dto.checkAt,
      checkUserId: dto.checkUserId,
      status: dto.status,
      result: dto.result,
      count: count,
      summary: `设备编号：${dto.code}，
							设备名称：${eq.dataValues.equipment.name}，
							巡检时间：${summaryAt}，
							巡检人员：${user1.userName}，
							巡检次数：今日第${count}次巡检，
							巡检方案：${eq.dataValues.inspectionPlan.name}
							巡检结果：${dto.result}
							设备状态：${dto.status}`,
      createdUserId: user?.id,
      updatedUserId: user?.id,
    })

    if (dto.details) {
      for (const detail of dto.details) {
        await InspectionOrderDetail.create({ inspectionOrderId: result.id, ...detail })
      }
    }
    let inspectionOrder = await InspectionOrder.findOne({ where: { id: result.id } })
    await EquipmentLedger.update({ status: inspectionOrder.status }, { where: { id: inspectionOrder.equipmentLedgerId } })
    return result
  }

  public async edit(dto: UInspectionOrderDto, id: number, user, loadModel) {
    let inspectionOrder = await InspectionOrder.findOne({ where: { id } })
    if (!inspectionOrder) {
      throw new HttpException('数据不存在', 400006)
    }
    await InspectionOrderDetail.destroy({ where: { inspectionOrderId: id } })

    const eq = await EquipmentLedger.findByPk(dto.equipmentLedgerId, {
      include: [
        { association: 'equipment', attributes: ['id', 'name'] },
        { association: 'inspectionPlan', attributes: ['id', 'code', 'name', 'frequency', 'times'] },
      ],
    })
    const user1 = await User.findByPk(user.id)
    const summaryAt = moment(dto.checkAt).format('YYYY-MM-DD HH:mm:ss')
    await inspectionOrder.update({
      equipmentLedgerId: dto.equipmentLedgerId,
      checkAt: dto.checkAt,
      checkUserId: dto.checkUserId,
      status: dto.status,
      result: dto.result,
      summary: `设备编号：${inspectionOrder.code}，
							设备名称：${eq.dataValues.equipment.name}，
							巡检时间：${summaryAt}，
							巡检人员：${user1.userName}，
							巡检次数：今日第${inspectionOrder.count}次巡检，
							巡检方案：${eq.dataValues.inspectionPlan.name}
							巡检结果：${dto.result}
							设备状态：${dto.status}`,
      updatedUserId: user?.id,
    })
    if (dto.details) {
      for (const detail of dto.details) {
        await InspectionOrderDetail.create({ inspectionOrderId: id, ...detail })
      }
    }

    inspectionOrder = await InspectionOrder.findOne({ where: { id } })
    await EquipmentLedger.update({ status: inspectionOrder.status }, { where: { id: inspectionOrder.equipmentLedgerId } })
    return inspectionOrder
  }

  public async delete(id: number, loadModel) {
    await InspectionOrderDetail.destroy({ where: { inspectionOrderId: id } })
    const result = await InspectionOrder.destroy({
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
            {
              association: 'inspectionPlan',
              attributes: ['id', 'code', 'name', 'frequency', 'times'],
            },
          ],
        },
        {
          association: 'checkUser',
          attributes: ['id', 'userName'],
        },
        {
          association: 'details',
        },
      ],
    }
    const result = await InspectionOrder.findOne(options)
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
            {
              association: 'inspectionPlan',
              attributes: ['id', 'code', 'name', 'frequency', 'times'],
            },
          ],
        },
        {
          association: 'checkUser',
          attributes: ['id', 'userName'],
          required: false,
        },
        {
          association: 'details',
          required: false,
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

    if (dto.name) {
      options.include[0].include[0].where['name'] = {
        [Op.like]: `%${dto.name}%`,
      }
      options.include[0].include[0].required = true
    }

    if (dto.code) {
      options.include[0].where['code'] = {
        [Op.like]: `%${dto.code}%`,
      }
      options.include[0].required = true
    }

    if (dto.orderCode) {
      options.where['code'] = {
        [Op.like]: `%${dto.orderCode}%`,
      }
    }

    if (dto.checkUser) {
      options.include[1].where['userName'] = {
        [Op.like]: `%${dto.checkUser}%`,
      }
      options.include[1].required = true
    }

    const result = await Paging.diyPaging(InspectionOrder, pagination, options)
    return result
  }
}
