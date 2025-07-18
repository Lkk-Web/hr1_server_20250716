import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { CCheckOrderDto, CheckOrderListDto, FindPaginationDto, UCheckOrderDto } from './checkOrder.dto'
import { CheckOrder } from '@model/equipment/checkOrder.model'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { CheckOrderDetail } from '@model/equipment/checkOrderDetail.model'
import { EquipmentLedger } from '@model/equipment/equipmentLedger.model'
import { Paging } from '@library/utils/paging'
import { Aide, getTime } from '@library/utils/aide'
import moment = require('moment')
import dayjs = require('dayjs')

@Injectable()
export class CheckOrderService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(CheckOrder)
    private checkOrderModel: typeof CheckOrder,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CCheckOrderDto, user, loadModel) {
    if (dto.code) {
      const temp = await CheckOrder.findOne({ where: { code: dto.code } })
      if (temp) throw new HttpException('已存在相同编号的点检单', 400)
    } else {
      const date = new Date()
      const year = date.getFullYear().toString().substring(2)
      const month = date.getMonth().toString().padStart(2, '0')
      const day = date.getDay().toString().padStart(2, '0')
      const temp = await CheckOrder.findOne({
        order: [['id', 'DESC']],
        where: { code: { [Op.like]: `DJ${year}${month}${day}%` } },
        attributes: ['code'],
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
    const old = await CheckOrder.findOne({
      where: {
        equipmentLedgerId: dto.equipmentLedgerId,
        checkAt: {
          [Op.lte]: dayjs().startOf('day').valueOf(),
          [Op.gte]: dayjs().endOf('day').valueOf(),
        },
      },
      attributes: ['id'],
    })
    if (old) throw new HttpException('该设备今日已点检', 400)
    const result = await CheckOrder.create({
      code: dto.code,
      equipmentLedgerId: dto.equipmentLedgerId,
      checkAt: dto.checkAt,
      checkUserId: dto.checkUserId,
      status: dto.status,
      result: dto.result,
      createdUserId: user?.id,
      updatedUserId: user?.id,
    })

    if (dto.details && dto.details.length) {
      await CheckOrderDetail.bulkCreate(dto.details.map(detail => ({ checkOrderId: result.id, ...detail })))
    }
    await EquipmentLedger.update({ status: result.status }, { where: { id: result.equipmentLedgerId } })
    return result
  }

  public async edit(dto: UCheckOrderDto, id: number, user, loadModel) {
    let checkOrder = await CheckOrder.findOne({ where: { id } })
    if (!checkOrder) {
      throw new HttpException('数据不存在', 400006)
    }
    await CheckOrderDetail.destroy({ where: { checkOrderId: id } })
    await checkOrder.update({
      equipmentLedgerId: dto.equipmentLedgerId,
      checkAt: dto.checkAt,
      checkUserId: dto.checkUserId,
      status: dto.status,
      result: dto.result,
      updatedUserId: user?.id,
    })
    if (dto.details) {
      for (const detail of dto.details) {
        await CheckOrderDetail.create({ checkOrderId: id, ...detail })
      }
    }
    checkOrder = await CheckOrder.findOne({ where: { id } })
    await EquipmentLedger.update({ status: checkOrder.status }, { where: { id: checkOrder.equipmentLedgerId } })
    return checkOrder
  }

  public async delete(id: number, loadModel) {
    await CheckOrderDetail.destroy({ where: { checkOrderId: id } })
    const result = await CheckOrder.destroy({
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
              association: 'checkStandard',
              attributes: ['id', 'code', 'name'],
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
    const result = await CheckOrder.findOne(options)
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
              association: 'checkStandard',
              attributes: ['id', 'code', 'name'],
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

    if (dto.checkAt) {
      const start = moment(dto.checkAt[0]).format('YYYY-MM-DD HH:mm:ss')
      const end = moment(dto.checkAt[1]).format('YYYY-MM-DD HH:mm:ss')
      options.where['checkAt'] = {
        [Op.between]: [start, end],
      }
    }

    const result = await Paging.diyPaging(CheckOrder, pagination, options)

    return result
  }

  //获取设备点检记录
  public async checkOrderLogs(dto: CheckOrderListDto) {
    let result = await EquipmentLedger.findOne({
      where: { id: dto.equipmentId },
      attributes: ['id', 'code', 'spec'],
      include: [
        { association: 'equipmentType', attributes: ['name'] },
        { association: 'installLocation', attributes: ['locate', 'status'] },
        { association: 'equipment', attributes: ['name'] },
      ],
    })
    if (!result) Aide.throwException(400, '无效设备')
    const { startTime, endTime } = getTime(
      {
        startTime: dto.date,
        endTime: dto.date,
      },
      'M'
    )
    const list = await CheckOrder.findAll({
      where: {
        equipmentLedgerId: dto.equipmentId,
        checkAt: {
          [Op.lte]: endTime.valueOf(),
          [Op.gte]: startTime.valueOf(),
        },
      },
      attributes: ['checkAt', 'checkUserId', 'result'],
      include: [
        { association: 'details', attributes: ['name', 'method', 'min', 'max', 'result', 'another'] },
        { association: 'checkUser', attributes: ['userName'] },
      ],
    })
    const checkItem: {
      id: number
      name: string
      method: string
    }[] = []
    list.forEach(v => {
      v.details.forEach(d => {
        if (!checkItem.find(item => item.name == d.name)) {
          checkItem.push({ id: checkItem.length + 1, name: d.name, method: d.method })
        }
      })
    })
    result = result.toJSON()
    result['checkItem'] = checkItem
    result['checkList'] = list.map(v => {
      v = v.toJSON()
      v.details.forEach(vv => {
        const temp = checkItem.find(item => item.name == vv.name)
        delete vv.name
        delete vv.method
        vv.id = temp.id
      })
      return v
    })

    return result
  }
}
