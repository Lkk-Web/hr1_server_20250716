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
import { WarehouseMaterial } from '@model/warehouse/warehouseMaterial.model'
import { deleteIdsDto } from '@common/dto'
import { OutboundOrder } from '@model/warehouse/outboundOrder.model'
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
          attributes: ['id', 'materialId', 'bomId', 'unitPrice', 'unit', 'quantity', 'amount', 'oraQty', 'k3StandardDrawingNo', 'deliveryDate'],
          include: [
            {
              association: 'material',
              attributes: ['id', 'code', 'name', 'spec', 'attr', 'unit', 'quantity'],
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
          attributes: ['id', 'materialId', 'bomId', 'unitPrice', 'unit', 'quantity', 'amount', 'oraQty', 'k3StandardDrawingNo', 'deliveryDate'],
          include: [
            {
              association: 'material',
              attributes: ['id', 'code', 'name', 'spec', 'attr', 'unit', 'minimumInventory', 'maximumInventory', 'safetyInventory', 'quantity'],
              where: {},
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

    if (dto.deliveryDate) {
      options.where['deliveryDate'] = {
        [Op.eq]: dto.deliveryDate,
      }
    }

    const result = await Paging.diyPaging(SalesOrder, pagination, options)

    for (const datum of result.data) {
      for (const detail of datum.dataValues.details) {
        if (dto.warehouseId) {
          //查询仓库数量
          const warehouseMaterial = await WarehouseMaterial.findOne({
            where: {
              warehouseId: dto.warehouseId,
              materialId: detail.materialId,
            },
          })
          detail.dataValues.material.setDataValue('warehouseCount', warehouseMaterial ? warehouseMaterial.count : 0)
        }

        const outOrder = await OutboundOrder.findAll({
          where: { originCode: datum.code },
          include: [
            {
              association: 'details',
              where: { materialId: detail.materialId },
            },
          ],
        })
        if (outOrder && outOrder.length > 0) {
          let accrueOutCount = 0
          for (const outboundOrder of outOrder) {
            for (const detail1 of outboundOrder.dataValues.details) {
              accrueOutCount += Number(detail1.count)
            }
          }
          detail.dataValues.material.setDataValue('accrueOutCount', accrueOutCount ? accrueOutCount : 0)
        }
      }
    }
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
