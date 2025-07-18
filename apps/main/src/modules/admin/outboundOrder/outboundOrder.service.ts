import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { OutboundOrder } from '@model/wm/outboundOrder.model'
import { COutboundOrderDto, FindPaginationDto, UOutboundOrderDto } from './outboundOrder.dto'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op, or } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { InboundOrder } from '@model/wm/inboundOrder.model'
import { InboundOrderDetail } from '@model/wm/inboundOrderDetail.model'
import { OutboundOrderDetail } from '@model/wm/outboundOrderDetail.model'
import { Material } from '@model/base/material.model'
import dayjs = require('dayjs')
import { WarehouseMaterial } from '@model/wm/warehouseMaterial.model'
import { Flow } from '@model/wm/flow.model'
import moment = require('moment')
import { deleteIdsDto } from '@common/dto'
import { AdjustOrder } from '@model/wm/adjustOrder.model'
import { SalesOrder } from '@model/plan/salesOrder.model'
import { Paging } from '@library/utils/paging'
import { BatchLogService } from '../batchLog/batchLog.service'
import { auditDto } from '../productionReport/productionReport.dto'

@Injectable()
export class OutboundOrderService {
  constructor(
    private readonly batchLogService: BatchLogService,
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(OutboundOrder)
    private outboundOrderModel: typeof OutboundOrder,
    private sequelize: Sequelize
  ) {}

  public async create(dto: COutboundOrderDto, user, loadModel) {
    if (dto.code) {
      //校验
      const temp = await OutboundOrder.findOne({ where: { code: dto.code } })
      if (temp) throw new HttpException('已存在相同编号的入库单', 400)
    } else {
      //按规则创建编码
      const date = new Date()
      const year = date.getFullYear().toString().substring(2)
      const month = date.getMonth().toString().padStart(2, '0')
      const temp = await OutboundOrder.findOne({
        order: [['id', 'DESC']],
        where: { code: { [Op.like]: `CK${year}${month}%` } },
      })
      if (temp) {
        const oldNO = temp.code
        const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
        let num = parseInt(lastFourChars)
        num++
        let newNO = num.toString().padStart(4, '0')

        dto.code = 'CK' + year + month + newNO
      } else {
        dto.code = 'CK' + year + month + '0001'
      }
    }
    const result = await OutboundOrder.create({
      code: dto.code,
      type: dto.type,
      outboundTime: dto.outboundTime,
      supplierId: dto.supplierId,
      customerId: dto.customerId,
      warehouseId: dto.warehouseId,
      remark: dto.remark,
      createdUserId: user?.id,
      updatedUserId: user?.id,
      originCode: dto.originCode ? dto.originCode : null,
    })
    //创建明细
    if (dto.details) {
      for (const detail of dto.details) {
        await OutboundOrderDetail.create({
          outboundOrderId: result.dataValues.id,
          materialId: detail.materialId,
          count: detail.count,
          batNum: detail.batNum.toString(),
        })
      }
    }

    return result
  }

  public async edit(dto: UOutboundOrderDto, id: number, user, loadModel) {
    let outboundOrder = await OutboundOrder.findOne({ where: { id } })
    if (!outboundOrder) {
      throw new HttpException('数据不存在', 400006)
    }

    await outboundOrder.update({
      type: dto.type,
      outboundTime: dto.outboundTime,
      supplierId: dto.supplierId,
      customerId: dto.customerId,
      warehouseId: dto.warehouseId,
      remark: dto.remark,
      updatedUserId: user?.id,
      originCode: dto.originCode ? dto.originCode : null,
    })
    await OutboundOrderDetail.destroy({ where: { outboundOrderId: id } })
    if (dto.details) {
      for (const detail of dto.details) {
        await OutboundOrderDetail.create({ outboundOrderId: id, materialId: detail.materialId, count: detail.count, batNum: detail.batNum })
      }
    }
    outboundOrder = await this.find(id, loadModel)
    return outboundOrder
  }

  public async delete(id: number, loadModel) {
    const temp = await OutboundOrder.findByPk(id)
    if (temp.type === '调拨出库' || temp.type === '盘点出库') throw new HttpException('该入库单是由调拨单/盘点单产生,无法删除', 400)
    if (temp.status == '已审核') throw new HttpException('该出库单已审核无法删除', 400)
    await OutboundOrderDetail.destroy({ where: { outboundOrderId: id } })
    const result = await OutboundOrder.destroy({
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
          association: 'supplier',
          attributes: ['id', 'shortName', 'fullName'],
          required: false,
        },
        {
          association: 'customer',
          attributes: ['id', 'shortName', 'fullName'],
          required: false,
        },
        {
          association: 'warehouse',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          association: 'auditor',
          attributes: ['id', 'userName'],
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
        {
          association: 'details',
          attributes: ['id', 'materialId', 'count', 'batNum'],
          required: false,
          include: [
            {
              association: 'material',
              attributes: ['id', 'code', 'name', 'spec', 'attr', 'unit', 'minimumInventory', 'maximumInventory', 'safetyInventory', 'quantity'],
            },
          ],
        },
      ],
    }
    const result = await OutboundOrder.findOne(options)
    for (const detail of result.dataValues.details) {
      const warehouseCount = await WarehouseMaterial.findOne({ where: { warehouseId: result.warehouseId, materialId: detail.materialId } })
      detail.dataValues.material.setDataValue('warehouseCount', warehouseCount ? warehouseCount.count : 0)
    }
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'supplier',
          attributes: ['id', 'shortName', 'fullName'],
          required: false,
          where: {},
        },
        {
          association: 'customer',
          attributes: ['id', 'shortName', 'fullName'],
          required: false,
          where: {},
        },
        {
          association: 'warehouse',
          attributes: ['id', 'name'],
          required: false,
          where: {},
        },
        {
          association: 'auditor',
          attributes: ['id', 'userName'],
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
        {
          association: 'details',
          attributes: ['id', 'materialId', 'count', 'batNum'],
          required: false,
          include: [
            {
              association: 'material',
              attributes: ['id', 'code', 'name', 'spec', 'attr', 'unit', 'minimumInventory', 'maximumInventory', 'safetyInventory', 'quantity'],
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

    if (dto.type) {
      options.where['type'] = {
        [Op.like]: `%${dto.type}%`,
      }
    }

    if (dto.outboundTime) {
      const start = moment(dto.outboundTime).startOf('day').add(8, 'hour')
      const end = moment(dto.outboundTime).endOf('day').add(8, 'hour')
      options.where['outboundTime'] = {
        [Op.between]: [start, end],
      }
    }

    if (dto.warehouse) {
      options.include[2].where['name'] = {
        [Op.like]: `%${dto.warehouse}%`,
      }
      options.include[2].required = true
    }

    if (dto.supplier) {
      options.include[0].where['fullName'] = {
        [Op.like]: `%${dto.supplier}%`,
      }
      options.include[0].required = true
    }

    if (dto.customer) {
      options.include[1].where['fullName'] = {
        [Op.like]: `%${dto.customer}%`,
      }
      options.include[1].required = true
    }
    const result = await Paging.diyPaging(OutboundOrder, pagination, options)

    for (const datum of result.data) {
      for (const detail of datum.dataValues.details) {
        const warehouseCount = await WarehouseMaterial.findOne({ where: { warehouseId: datum.warehouseId, materialId: detail.materialId } })
        detail.dataValues.material.setDataValue('warehouseCount', warehouseCount ? warehouseCount.count : 0)
        const salesOrder = await SalesOrder.findOne({
          where: { code: datum.originCode },
          include: [
            {
              association: 'details',
            },
          ],
        })
        if (salesOrder) {
          for (const detail1 of salesOrder.dataValues.details) {
            if (detail1.materialId === detail.materialId) {
              detail.setDataValue('quantity', detail1 ? detail1.quantity : 0)
            }
          }
        }

        const order = await OutboundOrder.findAll({
          where: {
            createdAt: {
              [Op.lt]: datum.createdAt,
            },
            originCode: {
              [Op.eq]: datum.originCode,
            },
          },
          include: [
            {
              association: 'details',
              where: {
                materialId: {
                  [Op.eq]: detail.materialId,
                },
              },
            },
          ],
        })
        let accrueOutCount = 0
        if (order) {
          for (const outboundOrder of order) {
            for (const detail1 of outboundOrder.dataValues.details) {
              accrueOutCount += Number(detail1.count)
            }
          }
        }
        detail.setDataValue('accrueOutCount', accrueOutCount)
      }
    }

    return result
  }

  async audit(dto: auditDto, user, loadModel) {
    if (!(user && user.id)) throw new HttpException('用户登录信息异常，请重新登录', 400)
    const date = new Date(dayjs().format('YYYY-MM-DD HH:mm:ss'))
    for (const id of dto.ids) {
      const sequelize = Material.sequelize
      return sequelize.transaction(async transaction => {
        try {
          const order = await this.find(id, loadModel)
          if (dto.status === '审核') {
            for (const detail of order.dataValues.details) {
              const material = await Material.findByPk(detail.materialId)
              if (!material) throw new HttpException('未找到对应物料', 400)
              //修改物料数量
              const temp = await WarehouseMaterial.findOne({ where: { warehouseId: order.warehouseId, materialId: detail.materialId }, transaction })
              if (Number(temp.count) - Number(detail.count) < 0) throw new HttpException('仓库库存数量不足以出库', 400)
              await material.update({ quantity: Number(material.quantity) - Number(detail.count) }, { transaction })
              if (temp) {
                await temp.update({ count: Number(temp.count) - Number(detail.count) }, { transaction })
              }

              // 产生批号日志
              if (detail.batNum) {
                await this.batchLogService.create(
                  {
                    sourceBatch: detail.batNum,
                    goThereBatch: null,
                    djName: '出库单：' + order.code,
                    ywDate: new Date(),
                    unit: detail.dataValues.material.unit,
                    num: detail.count,
                    createdUserId: user.id,
                    materialId: detail.materialId,
                    warehouseId: order.warehouseId,
                  },
                  loadModel,
                  transaction
                )
              }
            }
            //更新审核人以及审核时间
            await order.update({ status: '已审核', auditorId: user.id, auditedAt: date }, { transaction })
          } else if (dto.status === '取消审核') {
            for (const detail of order.dataValues.details) {
              const material = await Material.findByPk(detail.materialId)
              if (!material) throw new HttpException('未找到对应物料', 400)
              //修改物料数量
              await material.update({ quantity: Number(material.quantity) + Number(detail.count) }, { transaction })
              const temp = await WarehouseMaterial.findOne({ where: { warehouseId: order.warehouseId, materialId: detail.materialId }, transaction })
              if (temp) {
                await temp.update({ count: Number(temp.count) + Number(detail.count) }, { transaction })
              }
            }
            //更新审核人以及审核时间
            await order.update({ status: '未审核', auditorId: user.id, auditedAt: date }, { transaction })
          }
        } catch (error) {
          // 如果出现错误，Sequelize 将自动回滚事务
          throw error
        }
      })
    }
  }
  public async batDelete(dto: deleteIdsDto, loadModel) {
    let success = 0
    let failed = 0
    let errors: Array<string> = []
    for (const id of dto.ids) {
      try {
        const deleteNum = await this.delete(id, loadModel)
        if (deleteNum) {
          success++
        } else {
          failed++
        }
      } catch (e) {
        errors.push(`删除出库单 ID ${id} 时出错: ${e.message}`)
        failed++
      }
    }
    return { success, failed, errors }
  }
}
