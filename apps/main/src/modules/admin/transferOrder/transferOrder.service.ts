import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { CTransferOrderDto, FindPaginationDto, UTransferOrderDto } from './transferOrder.dto'
import { TransferOrder } from '@model/wm/transferOrder.model'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { TransferOrderDetail } from '@model/wm/transferOrderDetail.model'
import moment = require('moment')
import dayjs = require('dayjs')
import { Warehouse } from '@model/wm/warehouse.model'
import { WarehouseMaterial } from '@model/wm/warehouseMaterial.model'
import { deleteIdsDto } from '@common/dto'
import { Process } from '@model/pm/process.model'
import { AdjustOrder } from '@model/wm/adjustOrder.model'
import { OutboundOrder } from '@model/wm/outboundOrder.model'
import { OutboundOrderDetail } from '@model/wm/outboundOrderDetail.model'
import { InboundOrderDetail } from '@model/wm/inboundOrderDetail.model'
import { InboundOrder } from '@model/wm/inboundOrder.model'
import { Material } from '@model/base/material.model'
import { EquipmentType } from '@model/em/equipmentType.model'
import { WorkShop } from '@model/base/workShop.model'
import { Supplier } from '@model/base/supplier.model'
import { CheckStandard } from '@model/em/checkStandard.model'
import { Paging } from '@library/utils/paging'
import { auditDto } from '../productionReport/productionReport.dto'

@Injectable()
export class TransferOrderService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,
    @InjectModel(TransferOrder)
    private transferOrderModel: typeof TransferOrder,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CTransferOrderDto, user, loadModel) {
    if (dto.code) {
      const temp = await TransferOrder.findOne({ where: { code: dto.code } })
      if (temp) throw new HttpException('已存在相同编号的调拨单', 400)
    } else {
      const date = new Date()
      const year = date.getFullYear().toString().substring(2)
      const month = date.getMonth().toString().padStart(2, '0')
      const temp = await TransferOrder.findOne({
        order: [['id', 'DESC']],
        where: { code: { [Op.like]: `DB${year}${month}%` } },
      })
      if (temp) {
        //规则 DB + 年份2位尾数 + 月份(2位) + 四位流水
        const oldNO = temp.code
        const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
        let num = parseInt(lastFourChars)
        num++
        let newNO = num.toString().padStart(4, '0')

        dto.code = 'DB' + year + month + newNO
      } else {
        dto.code = 'DB' + year + month + '0001'
      }
    }
    const result = await TransferOrder.create({
      code: dto.code,
      type: dto.type,
      transferTime: dto.transferTime,
      outWarehouseId: dto.outWarehouseId,
      intoWarehouseId: dto.intoWarehouseId,
      remark: dto.remark,
      createdUserId: user?.id,
      updatedUserId: user?.id,
    })
    if (dto.details) {
      for (const detail of dto.details) {
        await TransferOrderDetail.create({
          transferOrderId: result.dataValues.id,
          materialId: detail.materialId,
          count: detail.count,
        })
      }
    }
    return result
  }

  public async edit(dto: UTransferOrderDto, id: number, user, loadModel) {
    let transferOrder = await TransferOrder.findOne({ where: { id } })
    if (!transferOrder) {
      throw new HttpException('数据不存在', 400006)
    }
    await TransferOrderDetail.destroy({ where: { transferOrderId: id } })
    await transferOrder.update({
      type: dto.type,
      transferTime: dto.transferTime,
      outWarehouseId: dto.outWarehouseId,
      intoWarehouseId: dto.intoWarehouseId,
      remark: dto.remark,
      updatedUserId: user?.id,
    })
    if (dto.details) {
      for (const detail of dto.details) {
        await TransferOrderDetail.create({
          transferOrderId: id,
          materialId: detail.materialId,
          count: detail.count,
        })
      }
    }
    transferOrder = await TransferOrder.findOne({ where: { id } })
    return transferOrder
  }

  public async delete(id: number, loadModel) {
    const temp = await TransferOrder.findByPk(id)
    if (temp.status == '已审核') throw new HttpException('该调拨单已审核无法删除', 400)
    await TransferOrderDetail.destroy({ where: { transferOrderId: id } })
    const result = await TransferOrder.destroy({
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
          association: 'outWarehouse',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          association: 'intoWarehouse',
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
          attributes: ['id', 'materialId', 'count'],
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
    const result = await TransferOrder.findOne(options)
    for (const detail of result.dataValues.details) {
      const warehouseCount = await WarehouseMaterial.findOne({ where: { warehouseId: result.outWarehouseId, materialId: detail.materialId } })
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
          association: 'outWarehouse',
          attributes: ['id', 'name'],
          where: {},
          required: false,
        },
        {
          association: 'intoWarehouse',
          attributes: ['id', 'name'],
          where: {},
          required: false,
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
          attributes: ['id', 'materialId', 'count'],
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

    if (dto.transferTime) {
      const start = moment(dto.transferTime).startOf('day').add(8, 'hour')
      const end = moment(dto.transferTime).endOf('day').add(8, 'hour')
      options.where['transferTime'] = {
        [Op.between]: [start, end],
      }
    }

    if (dto.outWarehouse) {
      options.include[0].where['name'] = {
        [Op.like]: `%${dto.outWarehouse}%`,
      }
      options.include[0].required = true
    }

    if (dto.intoWarehouse) {
      options.include[1].where['name'] = {
        [Op.like]: `%${dto.intoWarehouse}%`,
      }
      options.include[1].required = true
    }
    // @ts-ignore
    const result = await Paging.diyPaging(TransferOrder, pagination, options)

    for (const datum of result.data) {
      for (const detail of datum.dataValues.details) {
        const warehouseCount = await WarehouseMaterial.findOne({ where: { warehouseId: datum.outWarehouseId, materialId: detail.materialId } })
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
          let order = await this.find(id, loadModel)
          const tansferTime = new Date(moment(order.transferTime).startOf('day').format('YYYY-MM-DD HH:mm:ss'))
          await order.update({ status: '已审核', auditedAt: date, auditorId: user.id }, { transaction })
          order = await this.find(id, loadModel)
          //创建出库单
          //按规则创建编码
          const year = date.getFullYear().toString().substring(2)
          const month = date.getMonth().toString().padStart(2, '0')
          const temp = await OutboundOrder.findOne({
            order: [['id', 'DESC']],
            where: { code: { [Op.like]: `CK${year}${month}%` } },
          })
          let code = ''
          if (temp) {
            const oldNO = temp.code
            const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
            let num = parseInt(lastFourChars)
            num++
            let newNO = num.toString().padStart(4, '0')

            code = 'CK' + year + month + newNO
          } else {
            code = 'CK' + year + month + '0001'
          }
          //生成出库单
          const outo = await OutboundOrder.create(
            {
              code: code,
              type: '调拨出库',
              outboundTime: tansferTime,
              warehouseId: order.outWarehouseId,
              remark: '由调拨单：' + order.code + '自动生成的出库单',
              createdUserId: user.id,
              updatedUserId: user.id,
              status: '已审核',
              originCode: order.code,
              auditedAt: tansferTime,
              auditorId: user.id,
            },
            { transaction }
          )

          //创建入库单
          //按规则创建编码
          const ioTemp = await InboundOrder.findOne({
            order: [['id', 'DESC']],
            where: { code: { [Op.like]: `RK${year}${month}%` } },
          })
          let ioCode = ''
          if (ioTemp) {
            const oldNO = ioTemp.code
            const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
            let num = parseInt(lastFourChars)
            num++
            let newNO = num.toString().padStart(4, '0')

            ioCode = 'RK' + year + month + newNO
          } else {
            ioCode = 'RK' + year + month + '0001'
          }
          //生成入库单
          const ino = await InboundOrder.create(
            {
              code: ioCode,
              type: '调拨入库',
              inboundTime: tansferTime,
              warehouseId: order.intoWarehouseId,
              remark: '由调拨单：' + order.code + '自动生成的入库单',
              createdUserId: user.id,
              updatedUserId: user.id,
              status: '已审核',
              originCode: order.code,
              auditedAt: tansferTime,
              auditorId: user.id,
            },
            { transaction }
          )
          if (dto.status == '审核') {
            for (const detail of order.dataValues.details) {
              //调出仓库减少对应数量
              const out = await WarehouseMaterial.findOne({ where: { warehouseId: order.dataValues.outWarehouseId, materialId: detail.dataValues.materialId } })

              if (!out) throw new HttpException('调出仓库不存在物料:' + detail.dataValues.material.name, 400)

              if (Number(out.dataValues.count) - Number(detail.dataValues.count) < 0) throw new HttpException('调出仓库库存不足', 400)

              await out.update({ count: Number(out.dataValues.count) - Number(detail.dataValues.count) }, { transaction })

              //生成出库单明细
              await OutboundOrderDetail.create(
                {
                  outboundOrderId: outo?.id,
                  materialId: detail.materialId,
                  count: Number(detail.count),
                },
                { transaction }
              )

              //调入仓库增加对应数量
              const into = await WarehouseMaterial.findOne({ where: { warehouseId: order.dataValues.intoWarehouseId, materialId: detail.dataValues.materialId } })
              //存在就增加 不存在就创建
              if (into) {
                await into.update({ count: Number(into.dataValues.count) + Number(detail.dataValues.count) }, { transaction })
              } else {
                await WarehouseMaterial.create(
                  { warehouseId: order.dataValues.intoWarehouseId, count: Number(detail.dataValues.count), materialId: detail.dataValues.materialId },
                  { transaction }
                )
              }

              //生成出库单明细
              await InboundOrderDetail.create(
                {
                  inboundOrderId: ino?.id,
                  materialId: detail.materialId,
                  count: Number(detail.count),
                },
                { transaction }
              )
            }
          } else if (dto.status == '取消审核') {
            for (const detail of order.dataValues.details) {
              //调入仓库减少
              const into = await WarehouseMaterial.findOne({ where: { warehouseId: order.dataValues.intoWarehouseId, materialId: detail.dataValues.materialId } })

              if (Number(into.dataValues.count) - Number(detail.dataValues.count) < 0) throw new HttpException('调入仓库数量不足以调出', 400)

              //存在就减少
              if (into) {
                await into.update({ count: Number(into.dataValues.count) - Number(detail.dataValues.count) }, { transaction })
              }

              //调出仓库增加
              const out = await WarehouseMaterial.findOne({ where: { warehouseId: order.dataValues.outWarehouseId, materialId: detail.dataValues.materialId } })

              if (!out) throw new HttpException('调出仓库不存在物料:' + detail.dataValues.material.name, 400)

              await out.update({ count: Number(out.dataValues.count) + Number(detail.dataValues.count) }, { transaction })

              //删除对应出入库单
              const ino = await InboundOrder.findAll({ where: { originCode: order.code } })
              const outo = await OutboundOrder.findAll({ where: { originCode: order.code } })
              for (const inboundOrder of ino) {
                //删除明细表
                await InboundOrderDetail.destroy({ where: { inboundOrderId: inboundOrder.id }, transaction })
                await InboundOrder.destroy({ where: { id: inboundOrder.id }, transaction })
              }
              for (const outboundOrder of outo) {
                //删除明细表
                await OutboundOrderDetail.destroy({ where: { outboundOrderId: outboundOrder.id }, transaction })
                await OutboundOrder.destroy({ where: { id: outboundOrder.id }, transaction })
              }
            }
            await order.update({ status: '取消审核', auditedAt: date, auditorId: user.id }, { transaction })
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
        errors.push(`删除调拨单 ID ${id} 时出错: ${e.message}`)
        failed++
      }
    }
    return { success, failed, errors }
  }
}
