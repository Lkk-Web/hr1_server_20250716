import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { ProductionReport } from '@model/production/productionReport.model'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { ProductionOrder } from '@model/production/productionOrder.model'
import { POP } from '@model/production/POP.model'
import { ProcessTask } from '@model/production/processTask.model'
import { PRI } from '@model/production/PRI.model'
import { auditDto, batchDto, CProductionReportDto, FindPaginationDto, UProductionReportDto } from './productionReport.dto'
import { Performance } from '@model/performance/performance.model'
import { User } from '@model/auth/user.model'
import { PerformanceConfig } from '@model/performance/performanceConfig.model'
import { PerformanceDetailed } from '@model/performance/performanceDetailed.model'
import { ResultVO } from '@common/resultVO'
import { deleteIdsDto } from '@common/dto'
import { Paging } from '@library/utils/paging'
import { InspectionForm } from '@model/quantity/inspectionForm.model'
import { InspectionTemplateMat } from '@model/quantity/inspectionTemplateMat.model'
import { InspectionFormItem } from '@model/quantity/InspectionFormItem.model'
import { PRO } from '@model/warehouse/PRO.model'
import { WorkShop } from '@model/base/workShop.model'
import { PRODetail } from '@model/warehouse/PRODetail.model'
import { ExportOrder } from '@model/warehouse/exportOrder.model'
import { ExportOrderDetail } from '@model/warehouse/exportOrderDetail.model'
import { InspectionFormInfo } from '@model/quantity/inspectionFormInfo.model'
import { InspectionTemplate } from '@model/quantity/inspectionTemplate.model'
import { Team } from '@model/schedule/team.model'
import { ReportUser } from '@model/production/reportUser.model'
import moment = require('moment')

@Injectable()
export class ProductionReportService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,
    @InjectModel(ProductionReport)
    private productionReportModel: typeof ProductionReport
  ) {}

  async generateCode(prefix, model, transaction) {
    const date = new Date()
    const year = date.getFullYear().toString().substring(2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const temp = await model.findOne({
      order: [['createdAt', 'DESC']],
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

  public async create(dto: CProductionReportDto, user, loadModel) {
    if (!user.id) {
      throw new HttpException('登录信息异常,请重新登录', 400)
    }
    const temp = await ProductionReport.findAll({ where: { productionOrderId: dto.productionOrderId, processId: dto.processId } })
    let order = await ProductionOrder.findByPk(dto.productionOrderId, {
      include: [
        {
          association: 'bom',
          attributes: ['id', 'materialId', 'remark', 'version', 'quantity', 'formData'],
          where: {},
          include: [
            {
              association: 'parentMaterial',
              attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
              where: {},
            },
          ],
        },
      ],
    })
    if (!order) {
      throw new HttpException('工单不存在', 400)
    }
    const task = await ProcessTask.findByPk(dto.taskId)
    if (!task) {
      throw new HttpException('工序不存在', 400)
    }
    if (dto.isInspection) {
      //匹配物料
      const mat = await InspectionTemplateMat.findOne({
        where: { materialId: order.dataValues.bom.materialId },
      })
      if (!mat) {
        return {
          message: '物料未配置检验模板',
        }
      }
    }

    const sum = await ProductionReport.sum('goodCount', {
      where: {
        productionOrderId: dto.productionOrderId,
        processId: dto.processId,
      },
    })
    if (sum + dto.goodCount > task.dataValues.planCount) {
      throw new HttpException('此次报工已超过该工单可报工上限', 400)
    }

    const sequelize = POP.sequelize
    return sequelize
      .transaction(async transaction => {
        try {
          const date: Date = new Date()
          const formattedDate = moment(date, 'YYYY-MM-DD HH:mm:ss').toDate()
          const result = await ProductionReport.create(
            {
              ...dto,
              createdUserId: user.id,
              updatedUserId: user.id,
            },
            { transaction }
          )
          const pop = await POP.findOne({ where: { processTaskId: dto.taskId }, transaction })
          if (pop.planCount >= pop.goodCount + dto.goodCount) {
            if (pop.status === '未开始') {
              await POP.update(
                { status: '执行中' },
                {
                  where: {
                    processTaskId: dto.taskId,
                  },
                  transaction,
                }
              )
            }
            if (pop.planCount == pop.goodCount + dto.goodCount) {
              const pop1 = await POP.findOne({ where: { processTaskId: dto.taskId }, transaction })
              if (pop1.dataValues.actualStartTime) {
                await POP.update(
                  {
                    goodCount: pop.goodCount + dto.goodCount,
                    badCount: pop.badCount + dto.badCount,
                    actualEndTime: formattedDate,
                    status: '已结束',
                  },
                  { where: { processTaskId: dto.taskId }, transaction }
                )
                //工序完成开启下一道工序

                let popTemp = await POP.findOne({
                  where: { id: pop1.id + 1 },
                  order: [['id', 'ASC']],
                  include: [{ association: 'process', attributes: ['id', 'processName'] }],
                  transaction,
                })
                //如果存在下到工序就更新
                if (popTemp) {
                  await popTemp.update({ status: '执行中' }, { transaction })
                  popTemp = await POP.findOne({
                    where: { productionOrderId: dto.productionOrderId, status: '执行中' },
                    order: [['id', 'ASC']],
                    include: [{ association: 'process', attributes: ['id', 'processName'] }],
                    transaction,
                  })
                  await ProductionOrder.update(
                    { currentProcess: popTemp.dataValues.process.processName },
                    {
                      where: { id: dto.productionOrderId },
                      transaction,
                    }
                  )
                }
              } else {
                await POP.update(
                  {
                    goodCount: pop.goodCount + dto.goodCount,
                    badCount: pop.badCount + dto.badCount,
                    actualEndTime: formattedDate,
                    actualStartTime: formattedDate,
                    status: '已结束',
                  },
                  { where: { processTaskId: dto.taskId }, transaction }
                )

                let popTemp = await POP.findOne({
                  where: { id: pop1.id + 1 },
                  order: [['id', 'ASC']],
                  include: [{ association: 'process', attributes: ['id', 'processName'] }],
                  transaction,
                })
                //如果存在下到工序就更新
                if (popTemp) {
                  await popTemp.update({ status: '执行中' }, { transaction })
                  popTemp = await POP.findOne({
                    where: { productionOrderId: dto.productionOrderId, status: '执行中' },
                    order: [['id', 'ASC']],
                    include: [{ association: 'process', attributes: ['id', 'processName'] }],
                    transaction,
                  })
                  await ProductionOrder.update(
                    { currentProcess: popTemp.dataValues.process.processName },
                    {
                      where: { id: dto.productionOrderId },
                      transaction,
                    }
                  )
                }
              }
              //如果报完所有工序将order转为已结束
              const pops = await POP.findAll({
                where: { productionOrderId: dto.productionOrderId },
                order: [['id', 'ASC']],
                transaction,
              })
              if (pops[pops.length - 1].dataValues.processId === dto.processId) {
                await order.update(
                  {
                    status: '已结束',
                    actualOutput: order.actualOutput + dto.goodCount,
                    actualEndTime: formattedDate,
                    currentProcess: null,
                  },
                  { transaction }
                )
                //判断所有工单是否完成
                const orders = await ProductionOrder.findAll({
                  where: { kingdeeCode: order.kingdeeCode },
                  include: [
                    {
                      association: 'bom',
                      attributes: ['id', 'materialId'],
                      include: [
                        {
                          association: 'parentMaterial',
                          attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit'],
                        },
                      ],
                    },
                  ],
                  transaction,
                })
                if (orders.every(item => item.status === '已结束')) {
                  //生成生产入库单
                  const date = new Date(moment(new Date()).format('YYYY-MM-DD HH:mm:ss'))
                  const year = date.getFullYear().toString().substring(2)
                  const month = date.getMonth().toString().padStart(2, '0')
                  let code
                  let exportCode
                  const temp = await PRO.findOne({
                    order: [['createdAt', 'DESC']],
                    where: { code: { [Op.like]: `SCRK${year}${month}%` } },
                    transaction,
                  })
                  if (temp) {
                    const oldNO = temp.code
                    const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
                    let num = parseInt(lastFourChars)
                    num++
                    let newNO = num.toString().padStart(4, '0')

                    exportCode = 'SCRK' + year + month + newNO
                  } else {
                    exportCode = 'SCRK' + year + month + '0001'
                  }
                  let exportTemp = await ExportOrder.findOne({
                    order: [['createdAt', 'DESC']],
                    where: { code: { [Op.like]: `RK${year}${month}%` } },
                    transaction,
                  })
                  if (exportTemp) {
                    const oldNO = exportTemp.code
                    const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
                    let num = parseInt(lastFourChars)
                    num++
                    let newNO = num.toString().padStart(4, '0')

                    code = 'RK' + year + month + newNO
                  } else {
                    code = 'RK' + year + month + '0001'
                  }
                  const workShop = await WorkShop.findOne({ where: { name: '线束车间' } })
                  const exist = await PRO.findOne({ where: { ERPCode: order.kingdeeCode } })
                  if (!exist) {
                    const pro = await PRO.create(
                      {
                        code,
                        warehouseId: 105311,
                        date: date,
                        workShopId: workShop ? workShop.id : null,
                        ERPCode: order.kingdeeCode,
                        originType: '生产工单',
                      },
                      { transaction }
                    )
                    const exportOrder = await ExportOrder.create(
                      {
                        code: exportCode,
                        docType: '生产入库',
                        warehouseId: 105311,
                        date: date,
                        type: '入库',
                        ERPCode: order.kingdeeCode,
                        businessStatus: '待收货',
                        originType: '生产入库单',
                      },
                      { transaction }
                    )
                    for (const order1 of orders) {
                      await PRODetail.create(
                        {
                          proId: pro.id,
                          materialId: order1.dataValues.bom.dataValues.parentMaterial.dataValues.id,
                          pendCount: order1.plannedOutput,
                          checkedCount: 0,
                          checkoutCount: 0,
                          // warehouseId: 105311,
                          // warehousePositionId: 100010,
                          date: date,
                        },
                        { transaction }
                      )
                      await ExportOrderDetail.create(
                        {
                          exportOrderId: exportOrder.id,
                          materialId: order1.dataValues.bom.dataValues.parentMaterial.dataValues.id,
                          pendCount: order1.plannedOutput,
                          checkedCount: 0,
                          checkoutCount: 0,
                          // warehouseId: 105311,
                          // warehousePositionId: 100010,
                          date: date,
                        },
                        { transaction }
                      )
                      await order1.update({ isCreated: 1 }, { transaction })
                    }
                  }
                }

                const popTemp = await POP.findOne({
                  where: { productionOrderId: dto.productionOrderId, status: '执行中' },
                  order: [['id', 'ASC']],
                  include: [{ association: 'process', attributes: ['id', 'processName'] }],
                  transaction,
                })
                //如果存在工序就更新
                if (popTemp) {
                  await ProductionOrder.update(
                    { currentProcess: popTemp.dataValues.process.processName },
                    {
                      where: { id: dto.productionOrderId },
                      transaction,
                    }
                  )
                }
              }
            } else {
              await POP.update(
                {
                  goodCount: pop.goodCount + dto.goodCount,
                  badCount: pop.badCount + dto.badCount,
                  actualStartTime: formattedDate,
                },
                { where: { processTaskId: dto.taskId }, transaction: transaction }
              )
              //如果报完所有工序将order转为已结束
              const pops = await POP.findAll({
                where: { productionOrderId: dto.productionOrderId },
                order: [['id', 'ASC']],
                transaction,
              })
              if (pops[pops.length - 1].dataValues.processId === dto.processId) {
                await order.update({ actualOutput: order.actualOutput + dto.goodCount }, { transaction })
              }
            }
          }
          const task = await ProcessTask.findOne({ where: { id: dto.taskId }, transaction })
          if (task.planCount >= task.goodCount + dto.goodCount) {
            if (task.status === '未开始') {
              await ProcessTask.update(
                { status: '执行中' },
                {
                  where: {
                    id: dto.taskId,
                  },
                  transaction,
                }
              )
            }
            if (task.planCount == task.goodCount + dto.goodCount) {
              if (task.actualStartTime) {
                await ProcessTask.update(
                  {
                    goodCount: task.goodCount + dto.goodCount,
                    badCount: task.badCount + dto.badCount,
                    actualEndTime: formattedDate,
                    status: '已结束',
                  },
                  { where: { id: dto.taskId }, transaction }
                )
              } else {
                await ProcessTask.update(
                  {
                    goodCount: task.goodCount + dto.goodCount,
                    badCount: task.badCount + dto.badCount,
                    actualStartTime: formattedDate,
                    actualEndTime: formattedDate,
                    status: '已结束',
                  },
                  { where: { id: dto.taskId }, transaction }
                )
              }

              const temp = await ProcessTask.findByPk(task.id + 1, { transaction })
              //如果存在下一道工序才能开始
              if (temp && temp.status === '未开始') {
                await temp.update({ status: '执行中' }, { transaction })
              }
            } else {
              const temp = await ProcessTask.findOne({ where: { id: dto.taskId }, transaction })
              //已有计划时间则不改
              if (temp.actualStartTime) {
                await ProcessTask.update(
                  {
                    goodCount: task.goodCount + dto.goodCount,
                    badCount: task.badCount + dto.badCount,
                  },
                  { where: { id: dto.taskId }, transaction }
                )
              } else {
                await ProcessTask.update(
                  {
                    goodCount: task.goodCount + dto.goodCount,
                    badCount: task.badCount + dto.badCount,
                    actualStartTime: formattedDate,
                  },
                  { where: { id: dto.taskId }, transaction }
                )
              }
            }
          }
          if (dto.items) {
            for (const item of dto.items) {
              await PRI.create(
                {
                  productionReportId: result.id,
                  defectiveItemId: item.defectiveItemId,
                  count: item.count,
                },
                { transaction }
              )
            }
          }
          order = await ProductionOrder.findByPk(dto.productionOrderId, {
            include: [
              {
                association: 'bom',
                attributes: ['id', 'materialId', 'remark', 'version', 'quantity', 'formData'],
                where: {},
                include: [
                  {
                    association: 'parentMaterial',
                    attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                    where: {},
                  },
                ],
              },
            ],
            transaction,
          })
          await order.update(
            { totalWorkingHours: order.totalWorkingHours + Number(dto.reportDurationHours) + Number(Number(Number(dto.reportDurationMinutes) / 60).toFixed(2)) },
            { transaction }
          )

          if (dto.isInspection) {
            const statusString = String(dto.isInspection).toLowerCase().trim() // 确保字符串统一处理
            const statusBoolean = statusString === 'true' || statusString === '1' // 转换逻辑
            //如果需要质检 则产生质检单
            if (statusBoolean) {
              const date = new Date()
              const year = date.getFullYear().toString().substring(2)
              const month = date.getMonth().toString().padStart(2, '0')
              const day = date.getDate().toString()
              let ipqcCode
              const temp = await InspectionForm.findOne({
                order: [['createdAt', 'DESC']],
                where: { code: { [Op.like]: `IPQC${year}${month}%` } },
                transaction,
              })
              if (temp) {
                const oldNO = temp.code
                const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
                let num = parseInt(lastFourChars)
                num++
                let newNO = num.toString().padStart(4, '0')

                ipqcCode = 'IPQC' + year + month + day + newNO
              } else {
                ipqcCode = 'IPQC' + year + month + day + '0001'
              }

              //匹配物料
              const mat = await InspectionTemplateMat.findOne({
                where: { materialId: order.dataValues.bom.dataValues.parentMaterial.id },
                transaction,
              })
              let array = []
              if (mat) {
                const inspectItems = await InspectionTemplate.findOne({
                  where: { id: mat.inspectionTemplateId },
                  transaction,
                  include: [
                    {
                      association: 'items',
                      attributes: ['id', 'data'],
                      include: [
                        {
                          association: 'inspectionItem',
                          attributes: ['id', 'name'],
                        },
                      ],
                    },
                  ],
                })
                const form = await InspectionForm.create(
                  {
                    code: ipqcCode,
                    type: inspectItems.type,
                    originCode: order.code,
                    inspectionAt: new Date(moment(date).format('YYYY-MM-DD HH:mm:ss')),
                    createdUserId: user.id,
                    updatedUserId: user.id,
                  },
                  { transaction }
                )
                //生成质检物料信息
                const info = await InspectionFormInfo.create(
                  {
                    inspectionFormId: form.id,
                    count: result.reportQuantity,
                    result: 0,
                    status: 0,
                    goodCount: 0,
                    badCount: 0,
                    templateId: inspectItems.id,
                    materialId: order.dataValues.bom.dataValues.parentMaterial.id,
                  },
                  { transaction }
                )
                for (const item of inspectItems.dataValues.items) {
                  const temp = {
                    name: item.dataValues.inspectionItem.dataValues.name,
                    data: JSON.parse(item.data),
                  }
                  array.push(temp)
                }
                await InspectionFormItem.create(
                  {
                    inspectionFormInfoId: info.id,
                    data: JSON.stringify(array),
                  },
                  { transaction }
                )
              }
            }
          }
          return result.id
        } catch (error) {
          // 如果出现错误，Sequelize 将自动回滚事务
          throw error
        }
      })
      .then(async id => {
        return this.find(id, loadModel)
      })
      .catch(e => {
        throw e
      })
  }

  public async edit(dto: UProductionReportDto, id: number, user: User, loadModel) {
    if (!user.id) {
      throw new HttpException('登录信息异常,请重新登录', 400)
    }
    const sequelize = POP.sequelize
    let productionReport = await ProductionReport.findOne({ where: { id } })
    if (!productionReport) {
      throw new HttpException('数据不存在', 400006)
    }
    let order = await ProductionOrder.findByPk(dto.productionOrderId, {
      include: [
        {
          association: 'bom',
          attributes: ['id', 'materialId', 'remark', 'version', 'quantity', 'formData'],
          where: {},
          include: [
            {
              association: 'parentMaterial',
              attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
              where: {},
            },
          ],
        },
      ],
    })
    return sequelize
      .transaction(async transaction => {
        try {
          //编辑报工数量之前减去上一次报工的数量再写入本次数量
          let pop = await POP.findOne({
            where: {
              processTaskId: dto.taskId,
            },
            transaction,
          })
          if (pop) {
            await POP.update(
              {
                goodCount: pop.goodCount - productionReport.goodCount,
                badCount: pop.badCount - productionReport.badCount,
              },
              { where: { processTaskId: dto.taskId }, transaction }
            )
          }
          let task = await ProcessTask.findOne({
            where: {
              id: dto.taskId,
            },
            transaction,
          })
          if (task) {
            await ProcessTask.update(
              {
                goodCount: task.goodCount - productionReport.goodCount,
                badCount: task.badCount - productionReport.badCount,
              },
              { where: { id: dto.taskId }, transaction }
            )
          }

          const pops = await POP.findAll({
            where: { productionOrderId: dto.productionOrderId },
            order: [['id', 'ASC']],
            transaction,
          })
          if (pops[pops.length - 1].dataValues.processId === dto.processId) {
            await order.update({ actualOutput: order.actualOutput - productionReport.goodCount }, { transaction })
          }
          //删除相关不良品项
          await PRI.destroy({ where: { productionReportId: id }, transaction })

          await order.update(
            {
              totalWorkingHours:
                order.totalWorkingHours - Number(productionReport.reportDurationHours) - Number(Number(Number(productionReport.reportDurationMinutes) / 60).toFixed(2)),
            },
            { transaction }
          )

          const date: Date = new Date()
          const formattedDate = moment(date, 'YYYY-MM-DD HH:mm:ss').toDate()
          const sum = await ProductionReport.sum('goodCount', {
            where: {
              productionOrderId: dto.productionOrderId,
              processId: dto.processId,
            },
            transaction,
          })
          if (sum + dto.goodCount - productionReport.goodCount > task.dataValues.planCount) {
            throw new HttpException('此次报工已超过该工单可报工上限', 400)
          }

          await productionReport.update(
            {
              ...dto,
              // updatedUserId: user.id,
            },
            { transaction }
          )

          pop = await POP.findOne({ where: { processTaskId: dto.taskId }, transaction })
          if (pop.planCount >= pop.goodCount + dto.goodCount) {
            if (pop.status === '未开始') {
              await POP.update(
                { status: '执行中' },
                {
                  where: {
                    productionOrderId: dto.productionOrderId,
                    processId: dto.processId,
                  },
                  transaction,
                }
              )
            }
            if (pop.planCount == pop.goodCount + dto.goodCount) {
              const pop1 = await POP.findOne({ where: { processTaskId: dto.taskId }, transaction })
              if (pop1.dataValues.actualStartTime) {
                await POP.update(
                  {
                    goodCount: pop.goodCount + dto.goodCount,
                    badCount: pop.badCount + dto.badCount,
                    actualEndTime: formattedDate,
                    status: '已结束',
                  },
                  { where: { processTaskId: dto.taskId }, transaction }
                )
                //工序完成开启下一道工序

                let popTemp = await POP.findOne({
                  where: { id: pop1.id + 1 },
                  order: [['id', 'ASC']],
                  include: [{ association: 'process', attributes: ['id', 'processName'] }],
                  transaction,
                })
                //如果存在下到工序就更新
                if (popTemp) {
                  await popTemp.update({ status: '执行中' }, { transaction })
                  popTemp = await POP.findOne({
                    where: { productionOrderId: dto.productionOrderId, status: '执行中' },
                    order: [['id', 'ASC']],
                    include: [{ association: 'process', attributes: ['id', 'processName'] }],
                    transaction,
                  })
                  await ProductionOrder.update(
                    { currentProcess: popTemp.dataValues.process.processName },
                    {
                      where: { id: dto.productionOrderId },
                      transaction,
                    }
                  )
                }
              } else {
                await POP.update(
                  {
                    goodCount: pop.goodCount + dto.goodCount,
                    badCount: pop.badCount + dto.badCount,
                    actualEndTime: formattedDate,
                    actualStartTime: formattedDate,
                    status: '已结束',
                  },
                  { where: { processTaskId: dto.taskId }, transaction }
                )

                let popTemp = await POP.findOne({
                  where: { id: pop1.id + 1 },
                  order: [['id', 'ASC']],
                  include: [{ association: 'process', attributes: ['id', 'processName'] }],
                  transaction,
                })
                //如果存在下到工序就更新
                if (popTemp) {
                  await popTemp.update({ status: '执行中' }, { transaction })
                  popTemp = await POP.findOne({
                    where: { productionOrderId: dto.productionOrderId, status: '执行中' },
                    order: [['id', 'ASC']],
                    include: [{ association: 'process', attributes: ['id', 'processName'] }],
                    transaction,
                  })
                  await ProductionOrder.update(
                    { currentProcess: popTemp.dataValues.process.processName },
                    {
                      where: { id: dto.productionOrderId },
                      transaction,
                    }
                  )
                }
              }
              //如果报完所有工序将order转为已结束
              const pops = await POP.findAll({
                where: { productionOrderId: dto.productionOrderId },
                order: [['id', 'ASC']],
                transaction,
              })
              if (pops[pops.length - 1].dataValues.processId === dto.processId) {
                await order.update(
                  {
                    status: '已结束',
                    actualOutput: order.actualOutput + dto.goodCount,
                    actualEndTime: formattedDate,
                    currentProcess: null,
                  },
                  { transaction }
                )

                const popTemp = await POP.findOne({
                  where: { productionOrderId: dto.productionOrderId, status: '执行中' },
                  order: [['id', 'ASC']],
                  include: [{ association: 'process', attributes: ['id', 'processName'] }],
                  transaction,
                })
                //如果存在工序就更新
                if (popTemp) {
                  await ProductionOrder.update(
                    { currentProcess: popTemp.dataValues.process.processName },
                    {
                      where: { id: dto.productionOrderId },
                      transaction,
                    }
                  )
                }
              }
            } else {
              await POP.update(
                {
                  goodCount: pop.goodCount + dto.goodCount,
                  badCount: pop.badCount + dto.badCount,
                },
                { where: { processTaskId: dto.taskId }, transaction: transaction }
              )
              //产出
              const pops = await POP.findAll({
                where: { productionOrderId: dto.productionOrderId },
                order: [['id', 'ASC']],
                transaction,
              })
              if (pops[pops.length - 1].dataValues.processId === dto.processId) {
                await order.update({ actualOutput: order.actualOutput + dto.goodCount }, { transaction })
              }
            }
          }
          task = await ProcessTask.findOne({ where: { id: dto.taskId }, transaction })
          if (task.planCount >= task.goodCount + dto.goodCount) {
            if (task.status === '未开始') {
              await ProcessTask.update(
                { status: '执行中' },
                {
                  where: {
                    id: dto.taskId,
                  },
                  transaction,
                }
              )
            }
            if (task.planCount == task.goodCount + dto.goodCount) {
              await ProcessTask.update(
                {
                  goodCount: task.goodCount + dto.goodCount,
                  badCount: task.badCount + dto.badCount,
                  actualEndTime: formattedDate,
                  status: '已结束',
                },
                { where: { id: dto.taskId }, transaction }
              )
              const temp = await ProcessTask.findByPk(task.id + 1, { transaction })
              //如果存在下一道工序才能开始
              if (temp && temp.status === '未开始') {
                await temp.update({ status: '执行中' }, { transaction })
              }
            } else {
              const temp = await ProcessTask.findOne({ where: { id: dto.taskId }, transaction })
              //已有计划时间则不改
              if (temp.actualStartTime) {
                await ProcessTask.update(
                  {
                    goodCount: task.goodCount + dto.goodCount,
                    badCount: task.badCount + dto.badCount,
                  },
                  { where: { id: dto.taskId }, transaction }
                )
              } else {
                await ProcessTask.update(
                  {
                    goodCount: task.goodCount + dto.goodCount,
                    badCount: task.badCount + dto.badCount,
                    actualStartTime: formattedDate,
                  },
                  { where: { id: dto.taskId }, transaction }
                )
              }
            }
          }

          if (dto.items) {
            for (const item of dto.items) {
              await PRI.create(
                {
                  productionReportId: id,
                  defectiveItemId: item.defectiveItemId,
                  count: item.count,
                },
                { transaction }
              )
            }
          }
          order = await ProductionOrder.findByPk(dto.productionOrderId, {
            include: [
              {
                association: 'bom',
                attributes: ['id', 'materialId', 'remark', 'version', 'quantity', 'formData'],
                where: {},
                include: [
                  {
                    association: 'parentMaterial',
                    attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                    where: {},
                  },
                ],
              },
            ],
            transaction,
          })
          await order.update(
            { totalWorkingHours: order.totalWorkingHours + Number(dto.reportDurationHours) + Number(Number(Number(dto.reportDurationMinutes) / 60).toFixed(2)) },
            { transaction }
          )
          if (dto.isInspection) {
            throw new HttpException('已产生后续单据无法编辑', 400)
            // const statusString = String(dto.isInspection).toLowerCase().trim() // 确保字符串统一处理
            // const statusBoolean = statusString === 'true' || statusString === '1' // 转换逻辑
            // //如果需要质检 则产生质检单
            // if (statusBoolean) {
            //   let form = await InspectionForm.findOne({
            //     where: { originCode: order.code },
            //     transaction,
            //   })
            //
            //   const mat = await InspectionTemplateMat.findOne({
            //     where: { materialId: order.dataValues.bom.materialId },
            //     transaction,
            //   })
            //   await InspectionFormItem.destroy({
            //     where: {
            //       inspectionFormId: form.id,
            //     }, transaction,
            //   })
            //
            //   if (mat) {
            //     // const items = await InspectionTemplateItem.findAll({ where: { inspectionTemplateId: mat.inspectionTemplateId } })
            //     // for (const item of items) {
            //     //   await InspectionFormItem.create({
            //     //     inspectionFormId: form.id,
            //     //     inspectionItemId: item.id
            //     //   }, { transaction })
            //     // }
            //   }
            // }
          }

          return id
        } catch (error) {
          // 如果出现错误，Sequelize 将自动回滚事务
          throw error
        }
      })
      .then(async id => {
        return this.find(id, loadModel)
      })
      .catch(e => {
        throw e
      })
  }

  public async delete(id: number, loadModel) {
    //删除记录前减去对应工序任务单和生产工单的数量
    let productionReport = await ProductionReport.findOne({ where: { id } })
    if (!productionReport) {
      throw new HttpException('数据不存在', 400006)
    }
    if (productionReport.auditStatus === '已审核') {
      throw new HttpException('该报工单已审核,不允许删除！', 400)
    }
    //编辑报工数量之前减去上一次报工的数量再写入本次数量
    let pop = await POP.findAll({
      where: {
        productionOrderId: productionReport.productionOrderId,
        processId: productionReport.processId,
      },
    })
    for (const pop1 of pop) {
      if (pop1) {
        await POP.update(
          {
            goodCount: pop1.goodCount - productionReport.goodCount,
            badCount: pop1.badCount - productionReport.badCount,
            status: '执行中',
          },
          { where: { id: pop1.dataValues.id } }
        )
      }
    }
    let task = await ProcessTask.findAll({
      where: {
        productionOrderId: productionReport.productionOrderId,
        processId: productionReport.processId,
      },
    })
    for (const processTask of task) {
      if (processTask) {
        await ProcessTask.update(
          {
            goodCount: processTask.goodCount - productionReport?.goodCount,
            badCount: processTask.badCount - productionReport?.badCount,
            status: '执行中',
          },
          { where: { id: processTask.dataValues.id } }
        )
      }
    }
    await PRI.destroy({ where: { productionReportId: id } })

    if (productionReport.auditStatus === '已审核') {
      //删除对应绩效
      const temp = await PerformanceDetailed.findOne({ where: { productionReportId: id } })
      let per = await Performance.findOne({ where: { id: temp.dataValues.performanceId } })
      await Performance.update(
        {
          goodCount: per.dataValues.goodCount - productionReport.dataValues.goodCount,
          badCount: per.dataValues.badCount - productionReport.dataValues.badCount,
          goodCountWages: per.dataValues.goodCountWages - temp.dataValues.goodCountWages,
          badCountWages: per.dataValues.badCountWages - temp.dataValues.badCountWages,
        },
        { where: { id: temp.dataValues.performanceId } }
      )

      per = await Performance.findOne({ where: { id: temp.dataValues.performanceId } })
      await per.update({ yieldRate: (per.dataValues.goodCount / per.dataValues.badCount) * 100 })
      await PerformanceDetailed.destroy({ where: { productionReportId: id } })
    }
    const result = await ProductionReport.destroy({
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
          association: 'order',
          attributes: ['id', 'code', 'plannedOutput'],
          include: [
            {
              association: 'bom',
              attributes: ['id', 'materialId', 'remark', 'version', 'quantity', 'formData'],
              where: {},
              include: [
                {
                  association: 'parentMaterial',
                  attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                  where: {},
                },
              ],
            },
          ],
        },
        {
          association: 'process',
          attributes: ['id', 'processName'],
        },
        {
          association: 'productUser',
          attributes: ['id', 'userCode', 'userName'],
        },
        {
          association: 'auditor',
          attributes: ['id', 'userCode', 'userName'],
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
          association: 'pri',
          include: [
            {
              association: 'defectiveItem',
            },
          ],
        },
        {
          association: 'task',
          attributes: ['id', 'planCount'],
        },
      ],
    }
    const result = await ProductionReport.findOne(options)
    const temp = await PerformanceConfig.findOne({
      where: {
        materialId: result.dataValues.order.dataValues.bom.dataValues.materialId,
        processId: result.dataValues.processId,
      },
    })
    if (temp) {
      result.setDataValue('performanceConfig', temp)
    }

    const records = await ProductionReport.findAll({
      attributes: ['id', 'goodCount'],
      where: {
        taskId: {
          [Op.eq]: result.taskId,
        },
        createdAt: {
          [Op.lt]: result.createdAt,
        },
      },
    })
    let count = 0
    for (const record of records) {
      count += record.goodCount
    }
    result.setDataValue('processProgress', count + '')
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'order',
          attributes: ['id', 'code', 'plannedOutput', 'plannedOutput'],
          where: {},
          include: [
            {
              association: 'bom',
              attributes: ['id', 'materialId', 'remark', 'version', 'quantity'],
              where: {},
              include: [
                {
                  association: 'parentMaterial',
                  attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                  where: {},
                },
              ],
            },
          ],
        },
        {
          association: 'process',
          attributes: ['id', 'processName'],
          where: {},
        },
        {
          association: 'productUser',
          attributes: ['id', 'userCode', 'userName'],
        },
        {
          association: 'auditor',
          attributes: ['id', 'userCode', 'userName'],
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
          association: 'pri',
          include: [
            {
              association: 'defectiveItem',
            },
          ],
        },
        {
          association: 'task',
          attributes: ['id', 'planCount'],
        },
      ],
    }

    if (dto.materialName) {
      options.include[0].include[0].include[0].where['name'] = {
        [Op.like]: `%${dto.materialName}%`,
      }
    }
    if (dto.processName) {
      options.include[1].where['processName'] = {
        [Op.like]: `%${dto.processName}%`,
      }
    }
    if (dto.accountingType) {
      options.where['accountingType'] = {
        [Op.eq]: dto.accountingType,
      }
    }
    if (dto.auditStatus) {
      options.where['auditStatus'] = {
        [Op.eq]: dto.auditStatus,
      }
    }

    if (dto.orderCode) {
      options.include[0].where['code'] = {
        [Op.like]: `%${dto.orderCode}%`,
      }
    }
    const result = await Paging.diyPaging(ProductionReport, pagination, options)
    if (result.data.length) {
      // 获取所有需要的materialId和processId
      const materialProcessPairs = result.data.map(datum => ({
        materialId: datum.dataValues.order.dataValues.bom.dataValues.materialId,
        processId: datum.dataValues.processId,
      }))
      const teamIds = result.data.filter(v => v.taskId).map(datum => datum.teamId)
      const productionReportIds = result.data.map(datum => datum.id)
      // 获取所有taskId和createdAt
      const taskCreatedPairs = result.data.map(datum => ({
        taskId: datum.dataValues.taskId,
        createdAt: datum.createdAt,
      }))

      // 一次性查询所有PerformanceConfig
      const [allPerformanceConfigs, allProductionReports, teams, reportUsers] = await Promise.all([
        PerformanceConfig.findAll({
          where: {
            [Op.or]: materialProcessPairs,
          },
        }),
        ProductionReport.findAll({
          attributes: ['id', 'taskId', 'createdAt', 'goodCount'],
          where: {
            [Op.or]: taskCreatedPairs.map(pair => ({
              taskId: pair.taskId,
              createdAt: { [Op.lt]: pair.createdAt },
            })),
          },
        }),
        teamIds.length
          ? Team.findAll({
              attributes: ['id', 'name'],
              where: {
                id: teamIds,
              },
            })
          : ([] as Team[]),
        ReportUser.findAll({
          where: { productionReportId: productionReportIds },
          attributes: ['productionReportId', 'duration'],
          include: [{ association: 'userDuration', attributes: ['id'], include: [{ association: 'user', attributes: ['id', 'userCode', 'userName'] }] }],
        }),
      ])

      // 本地处理数据
      result.data = result.data.map(v => {
        const datum = v.toJSON() as ProductionReport
        // 查找PerformanceConfig
        const temp = allPerformanceConfigs.find(config => config.materialId === datum.order.bom.materialId && config.processId === datum.processId)
        if (temp) {
          datum.performanceConfig = temp
        }

        // 计算processProgress
        const count = allProductionReports.filter(report => report.taskId === datum.taskId && report.createdAt < datum.createdAt).reduce((sum, report) => sum + report.goodCount, 0)

        datum.processProgress = count + ''
        datum.team = datum.teamId ? teams.find(team => team.id === datum.teamId) : null
        const tempDurationUsers = reportUsers.filter(report => report.productionReportId === datum.id)
        datum.durationUsers = tempDurationUsers.map(report => ({
          duration: report.duration,
          user: report.userDuration.user,
        }))
        return datum
      })
    }
    return result
  }

  async batch(dto: batchDto, user: User, loadModel) {
    if (dto) {
      for (const dtoElement of dto.dtos) {
        this.create(dtoElement, user, loadModel)
      }
    }
  }

  public async audit(dto: auditDto, user, loadModel) {
    if (!user.id) {
      throw new HttpException('登录状态出现异常,请重新登录', 400)
    }
    if (dto.ids != undefined) {
      for (const id of dto.ids) {
        const report = await ProductionReport.findByPk(id)
        if (report) {
          const date: Date = new Date()
          const formattedDate = moment(date, 'YYYY-MM-DD HH:mm:ss').toDate()
          await ProductionReport.update(
            {
              auditorId: user.id,
              auditStatus: dto.status,
              auditedAt: formattedDate,
            },
            { where: { id } }
          )
          if (dto.status === '已审核') {
            /*const order = await ProductionOrder.findByPk(report.productionOrderId, {
              include: [
                {
                  association: 'bom',
                  attributes: ['id', 'materialId', 'remark', 'version', 'quantity', 'formData'],
                  where: {},
                  include: [
                    {
                      association: 'parentMaterial',
                      attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                      where: {},
                    },
                  ],
                },
                {
                  association: 'boms',
                  required: false,
                },
              ],
            })
            const perUser = await User.findByPk(report.productUserId)
            let per = await Performance.findOne({ where: { userId: perUser.id } })
            let config = await PerformanceConfig.findOne({
              where: {
                materialId: order.dataValues.bom.materialId,
                processId: report.processId,
              },
            })
            if (!per) {
              per = await Performance.create({
                deptId: perUser.departmentId,
                userId: perUser.id,
                goodCount: 0,
                badCount: 0,
                yieldRate: 0,
                goodCountWages: 0,
                badCountWages: 0,
                wages: 0,
              })
            }
            if (config) {
              if (report.accountingType === '计件') {
                per.update({
                  goodCount: report.goodCount + per.goodCount,
                  badCount: report.badCount + per.badCount,
                  yieldRate: ((report.goodCount + per.goodCount) / (report.badCount + report.goodCount + per.goodCount + per.badCount)) * 100,
                  goodCountWages: report.goodCount * config.goodCountPrice + per.goodCountWages,
                  badCountWages: report.badCount * config.badCountPrice + per.badCountWages,
                  wages: report.goodCount * config.goodCountPrice + report.badCount * config.badCountPrice + per.wages,
                })
                //生成绩效明细
                const temp = await PerformanceDetailed.findOne({
                  where: {
                    productionReportId: id,
                    materialId: order.dataValues.bom.materialId,
                    processId: report.processId,
                    performanceId: per.id,
                    productionOrderId: report.productionOrderId,
                    userId: perUser.id,
                  },
                })
                if (!temp) {
                  await PerformanceDetailed.create({
                    productionReportId: id,
                    materialId: order.dataValues.bom.dataValues.parentMaterial.id,
                    processId: report.processId,
                    performanceId: per.id,
                    productionOrderId: report.productionOrderId,
                    userId: perUser.id,
                    goodCount: report.goodCount,
                    badCount: report.badCount,
                    goodCountPrice: config.goodCountPrice,
                    badCountPrice: config.badCountPrice,
                    goodCountWages: report.goodCount * config.goodCountPrice,
                    badCountWages: report.badCount * config.badCountPrice,
                    yieldRate: (report.goodCount / (report.badCount + report.goodCount)) * 100,
                    wages: report.badCount * config.badCountPrice + report.goodCount * config.goodCountPrice,
                  })
                } else {
                  await temp.update({
                    goodCount: report.goodCount,
                    badCount: report.badCount,
                    goodCountPrice: config.goodCountPrice,
                    badCountPrice: config.badCountPrice,
                    goodCountWages: report.goodCount * config.goodCountPrice,
                    badCountWages: report.badCount * config.badCountPrice,
                    yieldRate: (report.goodCount / (report.badCount + report.goodCount)) * 100,
                    wages: report.badCount * config.badCountPrice + report.goodCount * config.goodCountPrice,
                  })
                }

              } else {
                per.update({
                  goodCount: report.goodCount + per.goodCount,
                  badCount: report.badCount + per.badCount,
                  yieldRate: ((report.goodCount + per.goodCount) / (report.badCount + report.goodCount + per.goodCount + per.badCount)) * 100,
                  goodCountWages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice + per.goodCountWages,
                  wages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice + per.wages,
                })

                const temp = await PerformanceDetailed.findOne({
                  where: {
                    productionReportId: id,
                    materialId: order.dataValues.bom.materialId,
                    processId: report.processId,
                    performanceId: per.id,
                    productionOrderId: report.productionOrderId,
                  },
                })
                if (!temp) {
                  //生成绩效明细
                  await PerformanceDetailed.create({
                    productionReportId: id,
                    materialId: order.dataValues.bom.dataValues.parentMaterial.id,
                    processId: report.processId,
                    performanceId: per.id,
                    productionOrderId: report.productionOrderId,
                    userId: perUser.id,
                    goodCount: report.goodCount,
                    badCount: report.badCount,
                    goodCountPrice: config.goodCountPrice,
                    badCountPrice: config.badCountPrice,
                    goodCountWages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice,
                    yieldRate: (report.goodCount / (report.badCount + report.goodCount)) * 100,
                    wages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice,
                  })
                } else {
                  await temp.update({
                    goodCount: report.goodCount,
                    badCount: report.badCount,
                    goodCountPrice: config.goodCountPrice,
                    badCountPrice: config.badCountPrice,
                    goodCountWages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice,
                    yieldRate: (report.goodCount / (report.badCount + report.goodCount)) * 100,
                    wages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice,
                  })
                }

              }
            }*/
          } else if (dto.status === '取消审核') {
            /*const order = await ProductionOrder.findByPk(report.productionOrderId, {
              include: [
                {
                  association: 'bom',
                  attributes: ['id', 'materialId', 'remark', 'version', 'quantity', 'formData'],
                  where: {},
                  include: [
                    {
                      association: 'parentMaterial',
                      attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                      where: {},
                    },
                  ],
                },
              ],
            })
            // 删除相关绩效
            if (user.id) {
              const perUser = await User.findByPk(user.id)
              let per = await Performance.findOne({ where: { userId: perUser.id } })
              let config = await PerformanceConfig.findOne({
                where: {
                  materialId: order.dataValues.bom.dataValues.materialId,
                  processId: report.dataValues.processId,
                },
              })
              let detail = await PerformanceDetailed.findOne({
                where: { performanceId: per.id },
                order: [['createdAt', 'DESC']],
              })
              if (per) {
                if (report.accountingType === '计件') {
                  per.update({
                    goodCount: per.goodCount - detail.goodCount,
                    badCount: per.badCount - detail.badCount,
                    yieldRate: ((per.goodCount - detail.goodCount) / (per.goodCount + per.badCount - detail.badCount - detail.goodCount)) * 100,
                    goodCountWages: per.goodCountWages - detail.goodCountWages,
                    badCountWages: per.badCountWages - detail.badCountWages,
                    wages: per.wages - detail.goodCountWages - detail.badCountWages,
                  })
                } else {
                  per.update({
                    goodCount: per.goodCount - detail.goodCount,
                    badCount: per.badCount - detail.badCount,
                    yieldRate: ((per.goodCount - detail.goodCount) / (per.goodCount + per.badCount - detail.badCount - detail.goodCount)) * 100,
                    goodCountWages: per.goodCountWages - detail.goodCountWages,
                    wages: per.wages - detail.goodCountWages,
                  })
                }
              }
              await detail.destroy()
            }*/
          }
        }
      }
    }
    return new ResultVO()
  }

  public async batDelete(dto: deleteIdsDto, loadModel) {
    for (const id of dto.ids) {
      await this.delete(id, loadModel)
    }
  }
}
