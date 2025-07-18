import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { InboundOrder } from '@model/wm/inboundOrder.model'
import { CInboundOrderDto, FindPaginationDto, flowDto, UInboundOrderDto } from './inboundOrder.dto'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op, or, QueryTypes } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { InboundOrderDetail } from '@model/wm/inboundOrderDetail.model'
import { Material } from '@model/base/material.model'
import dayjs = require('dayjs')
import { Warehouse } from '@model/wm/warehouse.model'
import { WarehouseMaterial } from '@model/wm/warehouseMaterial.model'
import moment = require('moment')
import { deleteIdsDto } from '@common/dto'
import { AdjustOrder } from '@model/wm/adjustOrder.model'
import * as process from 'node:process'
import { OutboundOrder } from '@model/wm/outboundOrder.model'
import { Aide } from '@library/utils/aide'
import { OutboundOrderDetail } from '@model/wm/outboundOrderDetail.model'
import { Paging } from '@library/utils/paging'
import { BatchLogService } from '../batchLog/batchLog.service'
import { auditDto } from '../productionReport/productionReport.dto'

@Injectable()
export class InboundOrderService {
  constructor(
    private readonly batchLogService: BatchLogService,
    @Inject(RedisProvider.local)
    private readonly redis: Redis,
    @InjectModel(InboundOrder)
    private inboundOrderModel: typeof InboundOrder,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CInboundOrderDto, user, loadModel) {
    if (dto.code) {
      const temp = await InboundOrder.findOne({ where: { code: dto.code } })
      if (temp) throw new HttpException('已存在相同编号的入库单', 400)
    } else {
      const date = new Date()
      const year = date.getFullYear().toString().substring(2)
      const month = date.getMonth().toString().padStart(2, '0')
      const temp = await InboundOrder.findOne({
        order: [['id', 'DESC']],
        where: { code: { [Op.like]: `RK${year}${month}%` } },
      })
      if (temp) {
        const oldNO = temp.code
        const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
        let num = parseInt(lastFourChars)
        num++
        let newNO = num.toString().padStart(4, '0')

        dto.code = 'RK' + year + month + newNO
      } else {
        dto.code = 'RK' + year + month + '0001'
      }
    }
    const result = await InboundOrder.create({
      code: dto.code,
      type: dto.type,
      inboundTime: dto.inboundTime,
      supplierId: dto.supplierId,
      customerId: dto.customerId,
      warehouseId: dto.warehouseId,
      remark: dto.remark,
      createdUserId: user?.id,
      updatedUserId: user?.id,
      originCode: dto.originCode ? dto.originCode : null,
    })
    if (dto.details) {
      for (const detail of dto.details) {
        await InboundOrderDetail.create({
          inboundOrderId: result.dataValues.id,
          materialId: detail.materialId,
          count: detail.count,
          batNum: detail.batNum.toString(),
        })
      }
    }

    return result
  }

  public async edit(dto: UInboundOrderDto, id: number, user, loadModel) {
    let inboundOrder = await InboundOrder.findOne({ where: { id } })
    if (!inboundOrder) {
      throw new HttpException('数据不存在', 400006)
    }

    await inboundOrder.update({
      type: dto.type,
      inboundTime: dto.inboundTime,
      supplierId: dto.supplierId,
      customerId: dto.customerId,
      warehouseId: dto.warehouseId,
      remark: dto.remark,
      updatedUserId: user?.id,
      originCode: dto.originCode ? dto.originCode : null,
    })
    await InboundOrderDetail.destroy({ where: { inboundOrderId: id } })
    if (dto.details) {
      for (const detail of dto.details) {
        await InboundOrderDetail.create({ inboundOrderId: id, materialId: detail.materialId, count: detail.count, batNum: detail.batNum.toString() })
      }
    }
    inboundOrder = await InboundOrder.findOne({ where: { id } })
    return inboundOrder
  }

  public async delete(id: number, loadModel) {
    const temp = await InboundOrder.findByPk(id)
    if (temp.type == '调拨入库' || temp.type === '盘点入库') throw new HttpException('该入库单是由调拨单/盘点单产生,无法删除', 400)
    if (temp.status == '已审核') throw new HttpException('该入库单已审核无法删除', 400)
    await InboundOrderDetail.destroy({ where: { inboundOrderId: id } })
    const result = await InboundOrder.destroy({
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
        },
        {
          association: 'customer',
          attributes: ['id', 'shortName', 'fullName'],
        },
        {
          association: 'warehouse',
          attributes: ['id', 'name'],
        },
        {
          association: 'auditor',
          attributes: ['id', 'userName'],
        },
        {
          association: 'createdUser',
          attributes: ['id', 'userName'],
        },
        {
          association: 'updatedUser',
          attributes: ['id', 'userName'],
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
    const result = await InboundOrder.findOne(options)
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

    if (dto.inboundTime) {
      const start = moment(dto.inboundTime).startOf('day').add(8, 'hour')
      const end = moment(dto.inboundTime).endOf('day').add(8, 'hour')
      options.where['inboundTime'] = {
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
    const result = await Paging.diyPaging(InboundOrder, pagination, options)
    // @ts-ignore
    for (const datum of result.data) {
      for (const detail of datum.dataValues.details) {
        const warehouseCount = await WarehouseMaterial.findOne({ where: { warehouseId: datum.warehouseId, materialId: detail.materialId } })
        detail.dataValues.material.setDataValue('warehouseCount', warehouseCount ? warehouseCount.count : 0)
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
              await material.update({ quantity: Number(material.quantity) + Number(detail.count) }, { transaction })
              const temp = await WarehouseMaterial.findOne({ where: { warehouseId: order.warehouseId, materialId: detail.materialId }, transaction })
              if (temp) {
                await temp.update({ count: Number(temp.count) + Number(detail.count) }, { transaction })
              } else {
                await WarehouseMaterial.create({ warehouseId: order.warehouseId, materialId: detail.materialId, count: detail.count }, { transaction })
              }
              // 产生批号日志
              if (detail.batNum) {
                await this.batchLogService.create(
                  {
                    goThereBatch: detail.batNum,
                    djName: '入库单：' + order.code,
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
              await material.update({ quantity: Number(material.quantity) - Number(detail.count) }, { transaction })

              const temp = await WarehouseMaterial.findOne({ where: { warehouseId: order.warehouseId, materialId: detail.materialId }, transaction })
              if (temp) {
                await temp.update({ count: Number(temp.count) - Number(detail.count) }, { transaction })
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
        errors.push(`删除入库单 ID ${id} 时出错: ${e.message}`)
        failed++
      }
    }
    return { success, failed, errors }
  }

  async getPaginatedTransactions(dto: flowDto, pagination: Pagination, loadModel) {
    const options: FindOptions = {
      where: {},
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
          association: 'details',
          attributes: ['id', 'materialId', 'count'],
          required: false,
          include: [
            {
              association: 'material',
              attributes: ['id', 'code', 'name', 'spec', 'attr', 'unit', 'minimumInventory', 'maximumInventory', 'safetyInventory', 'quantity'],
              where: {},
            },
          ],
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

    if (dto.orderTime) {
      const start = moment(dto.orderTime).startOf('day').add(8, 'hour')
      const end = moment(dto.orderTime).endOf('day').add(8, 'hour')
      options.where['inboundTime'] = {
        [Op.between]: [start, end],
      }
    }

    if (dto.warehouse) {
      options.include[2].where['name'] = {
        [Op.like]: `%${dto.warehouse}%`,
      }
    }

    if (dto.materialName) {
      options.include[3].include[0].where['name'] = {
        [Op.like]: `%${dto.materialName}%`,
      }
    }

    if (dto.materialCode) {
      options.include[3].include[0].where['code'] = {
        [Op.like]: `%${dto.materialCode}%`,
      }
    }
    const options1: FindOptions = {
      where: {},
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
          association: 'details',
          attributes: ['id', 'materialId', 'count'],
          required: false,
          include: [
            {
              association: 'material',
              attributes: ['id', 'code', 'name', 'spec', 'attr', 'unit', 'minimumInventory', 'maximumInventory', 'safetyInventory', 'quantity'],
              where: {},
            },
          ],
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
      ],
    }
    if (dto.code) {
      options1.where['code'] = {
        [Op.like]: `%${dto.code}%`,
      }
    }

    if (dto.type) {
      options1.where['type'] = {
        [Op.like]: `%${dto.type}%`,
      }
    }

    if (dto.orderTime) {
      const start = moment(dto.orderTime).startOf('day').add(8, 'hour')
      const end = moment(dto.orderTime).endOf('day').add(8, 'hour')
      options1.where['outboundTime'] = {
        [Op.between]: [start, end],
      }
    }

    if (dto.warehouse) {
      options1.include[2].where['name'] = {
        [Op.like]: `%${dto.warehouse}%`,
      }
    }

    if (dto.materialName) {
      options1.include[3].include[0].where['name'] = {
        [Op.like]: `%${dto.materialName}%`,
      }
    }

    if (dto.materialCode) {
      options1.include[3].include[0].where['code'] = {
        [Op.like]: `%${dto.materialCode}%`,
      }
    }

    const inboundRecords = await InboundOrder.findAll(options)

    // 查询出库单及其明细
    const outboundRecords = await OutboundOrder.findAll(options1)
    // 格式化入库数据
    let globalIndex = 0
    const formattedInbound = inboundRecords
      .map(order => {
        return order.dataValues.details.map(detail => ({
          id: order.id + '-' + globalIndex++,
          material: {
            id: detail.materialId,
            code: detail.dataValues.material.code,
            name: detail.dataValues.material.name,
            spec: detail.dataValues.material.spec,
            attr: detail.dataValues.material.attr,
            unit: detail.dataValues.material.unit,
          },
          orderCount: detail.count,
          inventoryChange: detail.count,
          supplier: order.supplierId ? order.dataValues.supplier?.fullName : null,
          customer: order.customerId ? order.dataValues.customer?.fullName : null,
          orderTime: order.inboundTime,
          orderType: order.type,
          inventoryType: '入库单',
          orderCode: order.code,
          warehouse: order.dataValues.warehouse.name,
          remark: order.remark,
          status: order.status,
          auditor: { id: order.auditorId, userName: order.dataValues.auditor?.userName ? order.dataValues.auditor.userName : null },
          auditedAt: order.auditedAt,
          createdUser: { id: order.createdUserId, userName: order.dataValues.createdUser.userName },
          createdAt: order.createdAt,
          updatedUser: { id: order.updatedUserId, userName: order.dataValues.updatedUser.userName },
          updatedAt: order.updatedAt,
        }))
      })
      .flat()
    // 格式化出库数据
    const formattedOutbound = outboundRecords
      .map(order => {
        return order.dataValues.details.map(detail => ({
          id: order.id + '-' + globalIndex++,
          material: {
            id: detail.materialId,
            code: detail.dataValues.material.code,
            name: detail.dataValues.material.name,
            spec: detail.dataValues.material.spec,
            attr: detail.dataValues.material.attr,
            unit: detail.dataValues.material.unit,
          },
          orderCount: detail.count,
          inventoryChange: -detail.count,
          supplier: order.supplierId ? order.dataValues.supplier?.fullName : null,
          customer: order.customerId ? order.dataValues.customer?.fullName : null,
          orderTime: order.outboundTime,
          orderType: order.type,
          inventoryType: '出库单',
          orderCode: order.code,
          warehouse: order.dataValues.warehouse.name,
          remark: order.remark,
          status: order.status,
          auditor: { id: order.auditorId, userName: order.dataValues.auditor?.userName ? order.dataValues.auditor.userName : null },
          auditedAt: order.auditedAt,
          createdUser: { id: order.createdUserId, userName: order.dataValues.createdUser.userName },
          createdAt: order.createdAt,
          updatedUser: { id: order.updatedUserId, userName: order.dataValues.updatedUser.userName },
          updatedAt: order.updatedAt,
        }))
      })
      .flat()
    // 合并并排序入库和出库数据
    let inventoryRecords = []
    if (dto.docType === '入库单') {
      inventoryRecords = [...formattedInbound]
    } else if (dto.docType === '出库单') {
      inventoryRecords = [...formattedOutbound]
    } else {
      inventoryRecords = [...formattedInbound, ...formattedOutbound]
    }

    const result = inventoryRecords.sort((a, b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime())
    return Aide.diyPaging(result, pagination)
  }
}
