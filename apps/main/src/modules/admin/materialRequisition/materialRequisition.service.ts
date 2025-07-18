import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { CMaterialRequisitionDto, FindPaginationDto, UMaterialRequisitionDto } from './materialRequisition.dto'
import { MaterialRequisition } from '@model/wm/materialRequisition.model'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'
import { MaterialRequisitionDetail } from '@model/wm/materialRequisitionDetail.model'
import { WarehouseMaterial } from '@model/wm/warehouseMaterial.model'
import { OutboundOrder } from '@model/wm/outboundOrder.model'
import { Material } from '@model/base/material.model'
import dayjs = require('dayjs')
import moment = require('moment')
import { OutboundOrderDetail } from '@model/wm/outboundOrderDetail.model'
import { InboundOrderDetail } from '@model/wm/inboundOrderDetail.model'
import { InboundOrder } from '@model/wm/inboundOrder.model'
import { deleteIdsDto } from '@common/dto'
import { ResultVO } from '@common/resultVO'
import { BatchLogService } from '../batchLog/batchLog.service'
import { auditDto } from '../productionReport/productionReport.dto'

@Injectable()
export class MaterialRequisitionService {
  constructor(
    private readonly batchLogService: BatchLogService,
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(MaterialRequisition)
    private materialRequisitionModel: typeof MaterialRequisition,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CMaterialRequisitionDto, loadModel, user) {
    if (dto.code) {
      //校验
      const temp = await MaterialRequisition.findOne({ where: { code: dto.code } })
      if (temp) throw new HttpException('已存在相同编号的领料单', 400)
    } else {
      //按规则创建编码
      const date = new Date()
      const year = date.getFullYear().toString().substring(2)
      const month = date.getMonth().toString().padStart(2, '0')
      const temp = await MaterialRequisition.findOne({
        order: [['id', 'DESC']],
      })
      if (temp) {
        const oldNO = temp.code
        const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
        let num = parseInt(lastFourChars)
        num++
        let newNO = num.toString().padStart(4, '0')

        dto.code = 'PL' + year + month + newNO
      } else {
        dto.code = 'PL' + year + month + '0001'
      }
    }
    const result = await MaterialRequisition.create({ ...dto, createdUserId: user.id, updatedUserId: user.id })
    if (dto.details) {
      for (const detail of dto.details) {
        await MaterialRequisitionDetail.create({
          materialRequisitionId: result.id,
          materialId: detail.materialId,
          count: detail.count,
          batNum: detail.batNum,
        })
      }
    }
    return this.find(result.id, loadModel)
  }

  public async edit(dto: UMaterialRequisitionDto, id: number, loadModel, user) {
    let materialRequisition = await MaterialRequisition.findOne({ where: { id } })
    if (!materialRequisition) {
      throw new HttpException('数据不存在', 400006)
    }
    await MaterialRequisitionDetail.destroy({ where: { materialRequisitionId: id } })
    await materialRequisition.update({ ...dto, updatedUserId: user.id })
    if (dto.details) {
      for (const detail of dto.details) {
        await MaterialRequisitionDetail.create({
          materialRequisitionId: id,
          materialId: detail.materialId,
          count: detail.count,
          batNum: detail.batNum,
        })
      }
    }
    materialRequisition = await MaterialRequisition.findOne({ where: { id } })
    return materialRequisition
  }

  public async delete(id: number, loadModel) {
    await MaterialRequisitionDetail.destroy({ where: { materialRequisitionId: id } })
    const result = await MaterialRequisition.destroy({
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
          association: 'productionOrder',
          attributes: ['id', 'code', 'bomId', 'startTime', 'endTime'],
          required: false,
          include: [
            {
              association: 'bom',
              attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity', 'formData'],
              where: {},
              required: false,
              include: [
                {
                  association: 'parentMaterial',
                  attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                  required: false,
                },
              ],
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
    const result = await MaterialRequisition.findOne(options)
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
          association: 'warehouse',
          attributes: ['id', 'name'],
          where: {},
        },
        {
          association: 'productionOrder',
          attributes: ['id', 'code', 'bomId', 'startTime', 'endTime'],
          where: {},
          required: false,
          include: [
            {
              association: 'bom',
              attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity', 'formData'],
              where: {},
              required: false,
              include: [
                {
                  association: 'parentMaterial',
                  attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                  required: false,
                },
              ],
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
    if (dto.status) {
      options.where['status'] = {
        [Op.eq]: dto.status,
      }
    }

    if (dto.requisitionAt) {
      options.where['requisitionAt'] = {
        [Op.eq]: dto.requisitionAt,
      }
    }

    if (dto.warehouseName) {
      options.include[0].where['name'] = {
        [Op.like]: `%${dto.warehouseName}%`,
      }
      options.include[0].required = true
    }

    if (dto.orderCode) {
      options.include[1].where['code'] = {
        [Op.like]: `%${dto.orderCode}%`,
      }
      options.include[1].required = true
    }

    if (dto.materialCode) {
      options.include[1].include[0].include[0].where['code'] = {
        [Op.like]: `%${dto.materialCode}%`,
      }
      options.include[1].required = true
      options.include[1].include[0].required = true
      options.include[1].include[0].include[0].required = true
    }

    if (dto.materialName) {
      options.include[1].include[0].include[0].where['name'] = {
        [Op.like]: `%${dto.materialCode}%`,
      }
      options.include[1].required = true
      options.include[1].include[0].required = true
      options.include[1].include[0].include[0].required = true
    }

    const result = await Paging.diyPaging(MaterialRequisition, pagination, options)
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
      const sequelize = MaterialRequisition.sequelize
      return sequelize.transaction(async transaction => {
        try {
          const materialRequisition = await this.find(id, loadModel)
          const tansferTime = new Date(moment(materialRequisition.requisitionAt).format('YYYY-MM-DD HH:mm:ss'))
          if (dto.status === '审核') {
            await MaterialRequisition.update(
              { status: '已审核', auditorId: user.id, auditedAt: date },
              {
                where: { id },
                transaction,
              }
            )
            //审核完产生对应的出库单
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
                type: '领料出库',
                outboundTime: tansferTime,
                warehouseId: materialRequisition.warehouseId,
                remark: '由领料单：' + materialRequisition.code + '自动生成的出库单',
                createdUserId: user.id,
                updatedUserId: user.id,
                status: '已审核',
                originCode: materialRequisition.code,
                auditedAt: tansferTime,
                auditorId: user.id,
              },
              { transaction }
            )

            for (const detail of materialRequisition.dataValues.details) {
              //调出仓库减少对应数量
              const out = await WarehouseMaterial.findOne({ where: { warehouseId: materialRequisition.dataValues.warehouseId, materialId: detail.dataValues.materialId } })

              if (!out) throw new HttpException('调出仓库不存在物料:' + detail.dataValues.material.name, 400)

              if (Number(out.dataValues.count) - Number(detail.dataValues.count) < 0) throw new HttpException('调出仓库库存不足', 400)

              await out.update({ count: Number(out.dataValues.count) - Number(detail.dataValues.count) }, { transaction })

              //生成出库单明细
              await OutboundOrderDetail.create(
                {
                  outboundOrderId: outo?.id,
                  materialId: detail.materialId,
                  count: Number(detail.count),
                  batNum: detail.batNum,
                },
                { transaction }
              )

              // 产生批号日志
              if (detail.batNum) {
                await this.batchLogService.create(
                  {
                    sourceBatch: detail.batNum,
                    goThereBatch: null,
                    djName: '生产领料：' + materialRequisition.code,
                    ywDate: new Date(),
                    unit: detail.dataValues.material.unit,
                    num: detail.count,
                    createdUserId: user.id,
                    materialId: detail.materialId,
                    warehouseId: materialRequisition.warehouseId,
                  },
                  loadModel,
                  transaction
                )
              }
            }
          } else if (dto.status === '取消审核') {
            await MaterialRequisition.update(
              { status: '未审核', auditorId: user.id, auditedAt: date },
              {
                where: { id },
                transaction,
              }
            )

            for (const detail of materialRequisition.dataValues.details) {
              //调出仓库增加
              const out = await WarehouseMaterial.findOne({ where: { warehouseId: materialRequisition.dataValues.warehouseId, materialId: detail.dataValues.materialId } })

              if (!out) throw new HttpException('调出仓库不存在物料:' + detail.dataValues.material.name, 400)

              await out.update({ count: Number(out.dataValues.count) + Number(detail.dataValues.count) }, { transaction })

              //删除对应出库单
              const outo = await OutboundOrder.findAll({ where: { originCode: materialRequisition.code } })
              for (const outboundOrder of outo) {
                //删除明细表
                await OutboundOrderDetail.destroy({ where: { outboundOrderId: outboundOrder.id }, transaction })
                await OutboundOrder.destroy({ where: { id: outboundOrder.id }, transaction })
              }
            }
          }
        } catch (error) {
          // 如果出现错误，Sequelize 将自动回滚事务
          throw error
        }
      })
    }
  }
  public async batDelete(dto: deleteIdsDto, loadModel) {
    for (const id of dto.ids) {
      await this.delete(id, loadModel)
    }
    return new ResultVO(null, 200, 'success')
  }
}
