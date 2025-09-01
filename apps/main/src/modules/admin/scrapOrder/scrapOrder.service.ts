import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { CScrapOrderDto, FindPaginationDto, UScrapOrderDto } from './scrapOrder.dto'
import { ScrapOrder } from '@model/equipment/scrapOrder.model'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { EquipmentLedger } from '@model/equipment/equipmentLedger.model'
import { Paging } from '@library/utils/paging'
import { auditDto } from '@modules/station/productionReport/productionReport.dto'

@Injectable()
export class ScrapOrderService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(ScrapOrder)
    private scrapOrderModel: typeof ScrapOrder,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CScrapOrderDto, user, loadModel) {
    const date = new Date()
    const year = date.getFullYear().toString().substring(2)
    const month = date.getMonth().toString().padStart(2, '0')
    const temp = await ScrapOrder.findOne({
      order: [['id', 'DESC']],
      where: { code: { [Op.like]: `BF${year}${month}%` } },
    })
    if (temp) {
      const oldNO = temp.code
      const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
      let num = parseInt(lastFourChars)
      num++
      let newNO = num.toString().padStart(4, '0')

      dto['code'] = 'BF' + year + month + newNO
    } else {
      dto['code'] = 'BF' + year + month + '0001'
    }

    if (dto.equipmentLedgerId) {
      const equip = await EquipmentLedger.findByPk(dto.equipmentLedgerId)
      if (equip.status === '报废') throw new HttpException('该设备已为报废状态了', 400)
    }
    const result = await ScrapOrder.create({ ...dto, createdUserId: user.id, updatedUserId: user.id })
    return result
  }

  public async edit(dto: UScrapOrderDto, id: number, user, loadModel) {
    let scrapOrder = await ScrapOrder.findOne({ where: { id } })
    if (!scrapOrder) {
      throw new HttpException('数据不存在', 400006)
    }
    if (dto.equipmentLedgerId && scrapOrder.equipmentLedgerId != dto.equipmentLedgerId) {
      const equip = await EquipmentLedger.findOne({ where: { id: dto.equipmentLedgerId } })
      if (equip.status === '报废') throw new HttpException('该设备已为报废状态了', 400)
    }
    await scrapOrder.update({ ...dto, updatedUserId: user.id })
    scrapOrder = await ScrapOrder.findOne({ where: { id } })
    return scrapOrder
  }

  public async delete(id: number, loadModel) {
    const result = await ScrapOrder.destroy({
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
          association: 'createdUser',
          attributes: ['id', 'userName'],
          required: false,
        },
        {
          association: 'updatedUser',
          attributes: ['id', 'userName'],
          required: false,
        },
        {
          association: 'scrapUser',
          attributes: ['id', 'userName'],
          required: false,
        },
      ],
    }
    const result = await ScrapOrder.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      order: [['id', 'DESC']],
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
          association: 'createdUser',
          attributes: ['id', 'userName'],
          required: false,
        },
        {
          association: 'updatedUser',
          attributes: ['id', 'userName'],
          required: false,
        },
        {
          association: 'scrapUser',
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

    if (dto.scrapAt) {
      options.where['scrapAt'] = {
        [Op.eq]: dto.scrapAt,
      }
    }
    const result = await Paging.diyPaging(ScrapOrder, pagination, options)
    return result
  }

  public async audit(dto: auditDto, user, loadModel) {
    if (dto.status === '审核') {
      for (const id of dto.ids) {
        const order = await ScrapOrder.findByPk(id)
        await EquipmentLedger.update({ status: '报废' }, { where: { id: order.equipmentLedgerId } })
        await order.update({ status: '已审核' })
      }
    } else if (dto.status === '取消审核') {
      for (const id of dto.ids) {
        const order = await ScrapOrder.findByPk(id)
        await EquipmentLedger.update({ status: order.equipStatus }, { where: { id: order.equipmentLedgerId } })
        await order.update({ status: '未审核' })
      }
    }
  }
}
