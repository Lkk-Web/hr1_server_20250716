import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { AdjustOrder } from '@model/warehouse/adjustOrder.model'
import { CAdjustOrderDto, FindPaginationDto, UAdjustOrderDto } from './adjustOrder.dto'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { InboundOrder } from '@model/warehouse/inboundOrder.model'
import { InboundOrderDetail } from '@model/warehouse/inboundOrderDetail.model'
import { AdjustOrderDetail } from '@model/warehouse/adjustOrderDetail.model'
import { OutboundOrderDetail } from '@model/warehouse/outboundOrderDetail.model'
import { Material } from '@model/base/material.model'
import { WarehouseMaterial } from '@model/warehouse/warehouseMaterial.model'
import { deleteIdsDto } from '@common/dto'
import { OutboundOrder } from '@model/warehouse/outboundOrder.model'
import dayjs = require('dayjs')
import moment = require('moment')
import { ResultVO } from '@common/resultVO'
import { Aide } from '@library/utils/aide'
import { Paging } from '@library/utils/paging'
import { auditDto } from '../productionReport/productionReport.dto'

@Injectable()
export class AdjustOrderService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,
    @InjectModel(AdjustOrder)
    private adjustOrderModel: typeof AdjustOrder,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CAdjustOrderDto, user, loadModel) {
    if (dto.code) {
      const temp = await AdjustOrder.findOne({ where: { code: dto.code } })
      if (temp) throw new HttpException('已存在相同编号的调整单', 400)
    } else {
      const date = new Date()
      const year = date.getFullYear().toString().substring(2)
      const month = date.getMonth().toString().padStart(2, '0')
      const temp = await AdjustOrder.findOne({
        order: [['id', 'DESC']],
        where: { code: { [Op.like]: `PD${year}${month}%` } },
      })
      if (temp) {
        const oldNO = temp.code
        const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
        let num = parseInt(lastFourChars)
        num++
        let newNO = num.toString().padStart(4, '0')

        dto.code = 'PD' + year + month + newNO
      } else {
        dto.code = 'PD' + year + month + '0001'
      }
    }
    const result = await AdjustOrder.create({
      code: dto.code,
      type: dto.type,
      startTime: dto.startTime,
      endTime: dto.endTime,
      warehouseId: dto.warehouseId,
      remark: dto.remark,
      createdUserId: user?.id,
      updatedUserId: user?.id,
    })
    if (dto.details) {
      for (const detail of dto.details) {
        await AdjustOrderDetail.create({
          adjustOrderId: result.dataValues.id,
          materialId: detail.materialId,
          currentCount: detail.currentCount,
          count: detail.count,
          profitCount: detail.profitCount,
          lossCount: detail.lossCount,
        })
      }
    }

    return result
  }

  public async edit(dto: UAdjustOrderDto, id: number, user, loadModel) {
    let adjustOrder = await AdjustOrder.findOne({ where: { id } })
    if (!adjustOrder) {
      throw new HttpException('数据不存在', 400006)
    }

    await adjustOrder.update({
      type: dto.type,
      startTime: dto.startTime,
      endTime: dto.endTime,
      warehouseId: dto.warehouseId,
      remark: dto.remark,
      updatedUserId: user?.id,
    })
    await AdjustOrderDetail.destroy({ where: { adjustOrderId: id } })
    if (dto.details) {
      for (const detail of dto.details) {
        await AdjustOrderDetail.create({
          adjustOrderId: id,
          materialId: detail.materialId,
          currentCount: detail.currentCount,
          count: detail.count,
          profitCount: detail.profitCount,
          lossCount: detail.lossCount,
        })
      }
    }
    adjustOrder = await this.find(id, loadModel)
    return adjustOrder
  }

  public async delete(id: number, loadModel) {
    const temp = await AdjustOrder.findByPk(id)
    if (temp.status == '已审核') throw new HttpException('该盘点单已审核无法删除', 400)
    await AdjustOrderDetail.destroy({ where: { adjustOrderId: id } })
    const result = await AdjustOrder.destroy({
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
          attributes: ['id', 'materialId', 'count', 'profitCount', 'lossCount'],
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
    const result = await AdjustOrder.findOne(options)
    for (const detail of result.dataValues.details) {
      const warehouseCount = await WarehouseMaterial.findOne({
        where: {
          warehouseId: result.warehouseId,
          materialId: detail.materialId,
        },
      })
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
          attributes: ['id', 'materialId', 'count', 'profitCount', 'lossCount'],
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

    if (dto.adjustTime) {
      const start = moment(dto.adjustTime).startOf('day').add(8, 'hour')
      const end = moment(dto.adjustTime).endOf('day').add(8, 'hour')
      options.where['adjustTime'] = {
        [Op.between]: [start, end],
      }
    }

    if (dto.warehouse) {
      options.include[0].where['name'] = {
        [Op.like]: `%${dto.warehouse}%`,
      }
      options.include[0].required = true
    }
    const result = await Paging.diyPaging(AdjustOrder, pagination, options)
    // @ts-ignore
    for (const datum of result.data) {
      for (const detail of datum.dataValues.details) {
        const warehouseCount = await WarehouseMaterial.findOne({ where: { warehouseId: datum.warehouseId, materialId: detail.materialId } })
        detail.dataValues.material.setDataValue('warehouseCount', warehouseCount ? warehouseCount.count : 0)
      }
    }

    return result
  }

  // 生成编码的函数
  async generateCode(prefix, model, transaction, loadModel) {
    const date = new Date()
    const year = date.getFullYear().toString().substring(2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const temp = await model.findOne({
      order: [['id', 'DESC']],
      where: { code: { [Op.like]: `${prefix}${year}${month}%` } },
      transaction,
    })
    let code = ''
    if (temp) {
      const lastFourChars = temp.code.slice(-4)
      let num = parseInt(lastFourChars) + 1
      code = `${prefix}${year}${month}${num.toString().padStart(4, '0')}`
    } else {
      code = `${prefix}${year}${month}0001`
    }
    return code
  }

  async audit(dto: auditDto, user, loadModel) {
    // if (!(user && user.id)) throw new HttpException('用户登录信息异常，请重新登录', 400)
    user = { id: 1 }
    const date = new Date(dayjs().format('YYYY-MM-DD HH:mm:ss'))
    for (const id of dto.ids) {
      const sequelize = Material.sequelize
      return sequelize.transaction(async transaction => {
        try {
          let order = await this.find(id, loadModel)
          const adjustTime = new Date(moment(order.endTime).startOf('day').format('YYYY-MM-DD HH:mm:ss'))
          const outboundDetails = []
          const inboundDetails = []
          if (dto.status === '审核') {
            await order.update({ status: '已审核', auditorId: user.id, auditedAt: date }, { transaction })
            for (const detail of order.dataValues.details) {
              const material = await Material.findByPk(detail.materialId)
              if (!material) throw new HttpException('未找到对应物料', 400)
              //修改物料数量

              const temp = await WarehouseMaterial.findOne({
                where: {
                  warehouseId: order.warehouseId,
                  materialId: detail.materialId,
                },
                transaction,
              })

              const adjustment = Number(detail.profitCount) + Number(detail.lossCount)

              if (temp) {
                if (Number(temp.count + adjustment) < 0) throw new HttpException('不能将库存调整为负数', 400)
                //确认调整值
                await temp.update({ count: Number(temp.count) + Number(adjustment) }, { transaction })
              } else {
                if (Number(adjustment) < 0) throw new HttpException('仓库里未有该物料,不能调整为负数', 400)
                await WarehouseMaterial.create(
                  {
                    warehouseId: order.warehouseId,
                    materialId: detail.materialId,
                    count: Number(adjustment),
                  },
                  { transaction }
                )
              }
              // await material.update({ quantity: Number(material.quantity) + Number(adjustment) }, { transaction })

              // 分别记录盘亏和盘盈的明细，供后续生成合并单据
              if (adjustment < 0) {
                outboundDetails.push({ materialId: detail.materialId, count: Math.abs(adjustment) })
              } else if (adjustment > 0) {
                inboundDetails.push({ materialId: detail.materialId, count: Number(adjustment) })
              }
            }

            // 批量生成出库单
            if (outboundDetails.length > 0) {
              const outCode = await this.generateCode('CK', OutboundOrder, transaction, loadModel)
              const out = await OutboundOrder.create(
                {
                  code: outCode,
                  type: '盘点出库',
                  outboundTime: adjustTime,
                  warehouseId: order.warehouseId,
                  remark: `由盘点单：${order.code} 自动生成的出库单`,
                  createdUserId: user.id,
                  updatedUserId: user.id,
                  status: '已审核',
                  originCode: order.code,
                  auditedAt: adjustTime,
                  auditorId: user.id,
                },
                { transaction }
              )
              await OutboundOrderDetail.bulkCreate(
                outboundDetails.map(detail => ({
                  outboundOrderId: out?.id,
                  materialId: detail.materialId,
                  count: Number(detail.count),
                })),
                { transaction }
              )
            }

            // 批量生成入库单
            if (inboundDetails.length > 0) {
              const inCode = await this.generateCode('RK', InboundOrder, transaction, loadModel)
              const ino = await InboundOrder.create(
                {
                  code: inCode,
                  type: '盘点入库',
                  inboundTime: adjustTime,
                  warehouseId: order.warehouseId,
                  remark: `由盘点单：${order.code} 自动生成的入库单`,
                  createdUserId: user.id,
                  updatedUserId: user.id,
                  status: '已审核',
                  originCode: order.code,
                  auditedAt: adjustTime,
                  auditorId: user.id,
                },
                { transaction }
              )
              await InboundOrderDetail.bulkCreate(
                inboundDetails.map(detail => ({
                  inboundOrderId: ino?.id,
                  materialId: detail.materialId,
                  count: Number(detail.count),
                })),
                { transaction }
              )
            }

            return new ResultVO()
          } else if (dto.status === '取消审核') {
            for (const detail of order.dataValues.details) {
              const adjustment = Number(detail.profitCount) + Number(detail.lossCount)
              const material = await Material.findByPk(detail.materialId)
              if (!material) throw new HttpException('未找到对应物料', 400)
              //修改物料数量

              const temp = await WarehouseMaterial.findOne({
                where: {
                  warehouseId: order.warehouseId,
                  materialId: detail.materialId,
                },
                transaction,
              })
              if (temp) {
                if (Number(temp.count) - adjustment < 0) throw new HttpException('不能将库存调整为负数', 400)
                //确认调整值
                await temp.update({ count: Number(temp.count) - adjustment }, { transaction })
              } else {
                if (adjustment < 0) throw new HttpException('仓库里未有该物料,不能调整为负数', 400)
                await WarehouseMaterial.create(
                  {
                    warehouseId: order.warehouseId,
                    materialId: detail.materialId,
                    count: Number(adjustment),
                  },
                  { transaction }
                )
              }

              // await material.update({ quantity: Number(material.quantity) - adjustment }, { transaction })

              //删除对应出入库单
              const ino = await InboundOrder.findAll({ where: { originCode: order.code }, transaction })
              const out = await OutboundOrder.findAll({ where: { originCode: order.code }, transaction })
              for (const inboundOrder of ino) {
                //删除明细表
                await InboundOrderDetail.destroy({ where: { inboundOrderId: inboundOrder.id }, transaction })
                await InboundOrder.destroy({ where: { id: inboundOrder.id }, transaction })
              }
              for (const outboundOrder of out) {
                //删除明细表
                await OutboundOrderDetail.destroy({ where: { outboundOrderId: outboundOrder.id }, transaction })
                await OutboundOrder.destroy({ where: { id: outboundOrder.id }, transaction })
              }
            }
            //更新审核人以及审核时间
            await order.update({ status: '未审核', auditorId: user.id, auditedAt: date }, { transaction })
            return new ResultVO()
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
        errors.push(`删除盘点单 ID ${id} 时出错: ${e.message}`)
        failed++
      }
    }
    return { success, failed, errors }
  }
}
