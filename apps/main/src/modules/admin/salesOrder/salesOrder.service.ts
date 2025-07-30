import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { CSalesOrderDto, FindPaginationDto, USalesOrderDto } from './salesOrder.dto'
import { SalesOrder } from '@model/plan/salesOrder.model'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { SalesOrderDetail } from '@model/plan/salesOrderDetail.model'
import { deleteIdsDto } from '@common/dto'
import { Paging } from '@library/utils/paging'
import { auditDto } from '../productionReport/productionReport.dto'
import dayjs = require('dayjs')

@Injectable()
export class SalesOrderService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,
    @InjectModel(SalesOrder)
    private salesOrderModel: typeof SalesOrder,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CSalesOrderDto, user, loadModel) {
    if (dto.code) {
      const temp = await SalesOrder.findOne({ where: { code: dto.code } })
      if (temp) throw new HttpException('已存在相同编号的调拨单', 400)
    } else {
      const date = new Date()
      const year = date.getFullYear().toString().substring(2)
      const month = date.getMonth().toString().padStart(2, '0')
      const temp = await SalesOrder.findOne({
        order: [['id', 'DESC']],
        where: { code: { [Op.like]: `XSD${year}${month}%` } },
      })
      if (temp) {
        //规则 DB + 年份2位尾数 + 月份(2位) + 四位流水
        const oldNO = temp.code
        const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
        let num = parseInt(lastFourChars)
        num++
        let newNO = num.toString().padStart(4, '0')

        dto.code = 'XSD' + year + month + newNO
      } else {
        dto.code = 'XSD' + year + month + '0001'
      }
    }
    const result = await SalesOrder.create({
      code: dto.code,
      orderDate: dto.orderDate,
      customerId: dto.customerId,
    })
    if (dto.details) {
      for (const detail of dto.details) {
        await SalesOrderDetail.create({
          salesOrderId: result.id,
          materialId: detail.materialId,
          unitPrice: detail.unitPrice,
          quantity: detail.quantity,
          amount: detail.amount,
          deliveryDate: dto.deliveryDate,
        })
      }
    }
    return result
  }

  public async edit(dto: USalesOrderDto, id: number, user, loadModel) {
    let salesOrder = await SalesOrder.findOne({ where: { id } })
    if (!salesOrder) {
      throw new HttpException('数据不存在', 400006)
    }
    await SalesOrderDetail.destroy({ where: { salesOrderId: id } })
    await salesOrder.update({
      orderDate: dto.orderDate,
      customerId: dto.customerId,
    })
    if (dto.details) {
      for (const detail of dto.details) {
        await SalesOrderDetail.create({
          salesOrderId: id,
          materialId: detail.materialId,
          unitPrice: detail.unitPrice,
          quantity: detail.quantity,
          amount: detail.amount,
          deliveryDate: dto.deliveryDate,
        })
      }
    }
    salesOrder = await SalesOrder.findOne({ where: { id } })
    return salesOrder
  }

  public async delete(id: number, loadModel) {
    const temp = await SalesOrder.findByPk(id)
    // if (temp && temp.status === '已审核') throw new HttpException('销售订单已审核,产生了关联数据,无法删除', 400)
    await SalesOrderDetail.destroy({ where: { salesOrderId: id } })
    const result = await SalesOrder.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = {
      where: { id },
      attributes: ['id', 'code', 'orderDate', 'customerId', 'dataStatus', 'types', 'status', 'createdAt', 'updatedAt'],
      include: [
        {
          association: 'customer',
          attributes: ['id', 'fullName'],
          where: {},
        },
        {
          association: 'details',
          attributes: ['id', 'materialId', 'bomId', 'unitPrice', 'unit', 'quantity', 'amount', 'deliveryDate'],
          include: [
            {
              association: 'material',
              attributes: ['id', 'code', 'materialName', 'spec', 'attribute', 'unit'],
            },
          ],
        },
      ],
    }
    const result = await SalesOrder.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      order: [['id', 'DESC']],
      attributes: ['id', 'code', 'orderDate', 'customerId', 'dataStatus', 'types', 'status', 'createdAt', 'updatedAt', 'approveDate'],
      include: [
        {
          association: 'customer',
          attributes: ['id', 'fullName'],
          where: {},
        },
        {
          association: 'details',
          attributes: ['id', 'materialId', 'bomId', 'unitPrice', 'unit', 'quantity', 'amount', 'deliveryDate'],
          where: {},
          include: [
            {
              association: 'material',
              attributes: ['id', 'code', 'materialName', 'spec', 'attribute', 'unit'],
              required: false,
            },
          ],
        },
      ],
    }

    if (dto.code) {
      options.where['code'] = {
        [Op.like]: `%${dto.code}%`,
      }
    }

    // 处理客户名称查询
    if (dto.customerName) {
      options.include[0].where = {
        fullName: {
          [Op.like]: `%${dto.customerName}%`,
        },
      }
      options.include[0].required = true
    }

    if (dto.materialCode) {
      options.include[1].include[0].where['code'] = {
        [Op.like]: `%${dto.materialCode}%`,
      }
    }

    if (dto.materialName) {
      options.include[1].include[0].where['name'] = {
        [Op.like]: `%${dto.materialName}%`,
      }
    }

    if (dto.customerName) {
      options.include[0].where['fullName'] = {
        [Op.like]: `%${dto.customerName}%`,
      }
    }

    // 处理交货日期查询
    if (dto.deliveryDate) {
      options.include[1].where = {
        deliveryDate: {
          [Op.eq]: dto.deliveryDate,
        },
      }
      options.include[1].required = true
    }

    const result = await Paging.diyPaging(SalesOrder, pagination, options)

    return result
  }

  async audit(dto: auditDto, user, loadModel) {
    if (!(user && user.id)) throw new HttpException('用户登录信息异常，请重新登录', 400)
    const date = new Date(dayjs().format('YYYY-MM-DD HH:mm:ss'))
    return ''
  }

  public async batDelete(dto: deleteIdsDto, loadModel) {
    for (const id of dto.ids) {
      await this.delete(id, loadModel)
    }
  }

  public async simpleList(dto: FindPaginationDto, pagination: Pagination, user, loadModel: any) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      attributes: ['id', 'code'],
    }
    const result = await Paging.diyPaging(SalesOrder, pagination, options)
    return result
  }
}
