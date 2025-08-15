import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { ProductionReport } from '@model/production/productionReport.model'
import { FindOptions, Op, or } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { ProductionOrder } from '@model/production/productionOrder.model'
import { ProcessTask } from '@model/production/processTask.model'
import { PRI } from '@model/production/PRI.model'

import { Performance } from '@model/performance/performance.model'
import { User } from '@model/auth/user'
import { PerformanceConfig } from '@model/performance/performanceConfig.model'
import { PerformanceDetailed } from '@model/performance/performanceDetailed.model'
import { ResultVO } from '@common/resultVO'
import { deleteIdsDto } from '@common/dto'
import moment = require('moment')
import { Paging } from '@library/utils/paging'
import { InspectionForm } from '@model/quantity/inspectionForm.model'
import { InspectionTemplate } from '@model/quantity/inspectionTemplate.model'
import { InspectionTemplateMat } from '@model/quantity/inspectionTemplateMat.model'
import { InspectionFormItem } from '@model/quantity/InspectionFormItem.model'
// import { InspectionTemplateItem } from '@model/quantity/inspectionTemplateItem.model'
import { WorkShop } from '@model/base/workShop.model'
import { ProductionOrderTask, TrendsTemplate } from '@model/index'
import { BatchLogService } from '@modules/admin/batchLog/batchLog.service'
import { CProductionReportDto, UProductionReportDto, FindPaginationDto, batchDto, auditDto, FindPaginationReportTaskListDto } from './productionReport.dto'
import { POSITION_TASK_STATUS } from '@common/enum'
import { ProductionReportTwoService } from './productionReportTwo.service'

@Injectable()
export class ProductionReportService {
  constructor(
    private readonly batchLogService: BatchLogService,
    private readonly productionReportTwoService: ProductionReportTwoService,
    @Inject(RedisProvider.local)
    private readonly redis: Redis,
    @InjectModel(ProductionReport)
    private productionReportModel: typeof ProductionReport
  ) {}

  // public async create(dto: CProductionReportDto, user, loadModel) {
  //   if (!user.id) {
  //     throw new HttpException('登录信息异常,请重新登录', 400)
  //   }
  //   const temp = await ProductionReport.findAll({ where: { id: dto.productionOrderTaskId, processId: dto.processId } })
  //   let order = await ProductionOrderTask.findByPk(dto.productionOrderTaskId, {
  //     include: [
  //       {
  //         association: 'bom',
  //         attributes: ['id', 'parentMaterialCode', 'remark', 'version', 'quantity', 'formData'],
  //         where: {},
  //         include: [
  //           {
  //             association: 'parentMaterial',
  //             attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
  //             where: {},
  //           },
  //         ],
  //       },
  //     ],
  //   })
  //   const config = await PerformanceConfig.findOne({
  //     where: {
  //       // materialId: order.dataValues.bom.dataValues.materialId,
  //       processId: dto.processId,
  //     },
  //   })
  //   const task = await ProcessTask.findByPk(dto.taskId)
  //   const sum = await ProductionReport.sum('goodCount', {
  //     where: {
  //       id: dto.productionOrderTaskId,
  //       processId: dto.processId,
  //     },
  //   })
  //   if (sum + dto.reportQuantity > task.dataValues.planCount) {
  //     throw new HttpException('此次报工已超过该工单可报工上限', 400)
  //   }

  //   const sequelize = ProcessTask.sequelize
  //   return sequelize
  //     .transaction(async transaction => {
  //       try {
  //         const date: Date = new Date()
  //         const formattedDate = moment(date, 'YYYY-MM-DD HH:mm:ss').toDate()
  //         const result = await ProductionReport.create(
  //           {
  //             ...dto,
  //             reportDurationHours: 0,
  //             reportDurationMinutes: 0,
  //             // unit: order.dataValues.bom.dataValues.parentMaterial.unit,
  //             goodCount: dto.reportQuantity,
  //             badCount: 0,
  //             startTime: new Date(moment().format('YYYY-MM-DD HH:mm:ss')),
  //             endTime: new Date(moment().format('YYYY-MM-DD HH:mm:ss')),
  //             accountingType: config ? config.pricingMethod : '计时',
  //             goodCountPrice: config ? config.goodCountPrice : 0,
  //             badCountPrice: config ? config.badCountPrice : 0,
  //             productUserId: user.id,
  //             createdUserId: user.id,
  //             updatedUserId: user.id,
  //           },
  //           { transaction }
  //         )
  //         const pop = await ProcessTask.findOne({ where: { serialId: dto.taskId }, transaction })
  //         if (pop.planCount >= pop.goodCount + dto.reportQuantity) {
  //           if (pop.status === '未开始') {
  //             await ProcessTask.update(
  //               { status: '执行中' },
  //               {
  //                 where: {
  //                   serialId: dto.taskId,
  //                 },
  //                 transaction,
  //               }
  //             )
  //           }
  //           if (pop.planCount == pop.goodCount + dto.reportQuantity) {
  //             const pop1 = await ProcessTask.findOne({ where: { serialId: dto.taskId }, transaction })
  //             if (pop1.dataValues.actualStartTime) {
  //               await ProcessTask.update(
  //                 {
  //                   goodCount: pop.goodCount + dto.reportQuantity,
  //                   badCount: pop.badCount + 0,
  //                   actualEndTime: formattedDate,
  //                   status: '已结束',
  //                 },
  //                 { where: { serialId: dto.taskId }, transaction }
  //               )
  //               //工序完成开启下一道工序

  //               let popTemp = await ProcessTask.findOne({
  //                 where: { id: pop1.id + 1 },
  //                 order: [['id', 'ASC']],
  //                 include: [{ association: 'process', attributes: ['id', 'processName'] }],
  //                 transaction,
  //               })
  //               //如果存在下到工序就更新
  //               if (popTemp) {
  //                 await popTemp.update({ status: '执行中' }, { transaction })
  //                 popTemp = await ProcessTask.findOne({
  //                   where: { id: dto.productionOrderTaskId, status: '执行中' },
  //                   order: [['id', 'ASC']],
  //                   include: [{ association: 'process', attributes: ['id', 'processName'] }],
  //                   transaction,
  //                 })
  //                 // await ProductionOrder.update(
  //                 //   { currentProcess: popTemp.dataValues.process.processName },
  //                 //   {
  //                 //     where: { id: dto.productionOrderTaskId },
  //                 //     transaction,
  //                 //   }
  //                 // )
  //               }
  //             } else {
  //               await ProcessTask.update(
  //                 {
  //                   goodCount: pop.goodCount + dto.reportQuantity,
  //                   badCount: pop.badCount + 0,
  //                   actualEndTime: formattedDate,
  //                   actualStartTime: formattedDate,
  //                   status: '已结束',
  //                 },
  //                 { where: { serialId: dto.taskId }, transaction }
  //               )

  //               let popTemp = await ProcessTask.findOne({
  //                 where: { id: pop1.id + 1 },
  //                 order: [['id', 'ASC']],
  //                 include: [{ association: 'process', attributes: ['id', 'processName'] }],
  //                 transaction,
  //               })
  //               //如果存在下到工序就更新
  //               if (popTemp) {
  //                 await popTemp.update({ status: '执行中' }, { transaction })
  //                 popTemp = await ProcessTask.findOne({
  //                   where: { id: dto.productionOrderTaskId, status: '执行中' },
  //                   order: [['id', 'ASC']],
  //                   include: [{ association: 'process', attributes: ['id', 'processName'] }],
  //                   transaction,
  //                 })
  //                 // await ProductionOrder.update(
  //                 //   { currentProcess: popTemp.dataValues.process.processName },
  //                 //   {
  //                 //     where: { id: dto.productionOrderTaskId },
  //                 //     transaction,
  //                 //   }
  //                 // )
  //               }
  //             }
  //             //如果报完所有工序将order转为已结束
  //             const pops = await ProcessTask.findAll({
  //               where: { id: dto.productionOrderTaskId },
  //               order: [['id', 'ASC']],
  //               transaction,
  //             })
  //             // if (pops[pops.length - 1].dataValues.processId === dto.processId) {
  //             //   await order.update({ status: '已结束', actualOutput: order.actualOutput + dto.reportQuantity, actualEndTime: formattedDate, currentProcess: null }, { transaction })

  //             //   //判断所有工单是否完成
  //             //   const orders = await ProductionOrderTask.findAll({
  //             //     where: { kingdeeCode: order.kingdeeCode },
  //             //     include: [
  //             //       {
  //             //         association: 'bom',
  //             //         attributes: ['id', 'parentMaterialCode'],
  //             //         include: [
  //             //           {
  //             //             association: 'parentMaterial',
  //             //             attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit'],
  //             //           },
  //             //         ],
  //             //       },
  //             //     ],
  //             //     transaction,
  //             //   })

  //             //   const popTemp = await ProductionProcessTask.findOne({
  //             //     where: { id: dto.productionOrderTaskId, status: '执行中' },
  //             //     order: [['id', 'ASC']],
  //             //     include: [{ association: 'process', attributes: ['id', 'processName'] }],
  //             //     transaction,
  //             //   })
  //             //   //如果存在工序就更新
  //             //   if (popTemp) {
  //             //     await ProductionOrder.update(
  //             //       { currentProcess: popTemp.dataValues.process.processName },
  //             //       {
  //             //         where: { id: dto.productionOrderTaskId },
  //             //         transaction,
  //             //       }
  //             //     )
  //             //   }
  //             // }
  //           } else {
  //             await ProcessTask.update(
  //               {
  //                 goodCount: pop.goodCount + dto.reportQuantity,
  //                 badCount: pop.badCount + 0,
  //                 actualStartTime: formattedDate,
  //               },
  //               { where: { serialId: dto.taskId }, transaction: transaction }
  //             )
  //             //如果报完所有工序将order转为已结束
  //             const pops = await ProcessTask.findAll({
  //               where: { id: dto.productionOrderTaskId },
  //               order: [['id', 'ASC']],
  //               transaction,
  //             })
  //             if (pops[pops.length - 1].dataValues.processId === dto.processId) {
  //               await order.update({ actualOutput: order.actualOutput + dto.reportQuantity }, { transaction })
  //             }
  //           }
  //         }
  //         const task = await ProcessTask.findOne({ where: { id: dto.taskId }, transaction })
  //         console.log(task)
  //         if (task.planCount >= task.goodCount + dto.reportQuantity) {
  //           if (task.status === '未开始') {
  //             await ProcessTask.update(
  //               { status: '执行中' },
  //               {
  //                 where: {
  //                   id: dto.taskId,
  //                 },
  //                 transaction,
  //               }
  //             )
  //           }
  //           if (task.planCount == task.goodCount + dto.reportQuantity) {
  //             if (task.actualStartTime) {
  //               await ProcessTask.update(
  //                 {
  //                   goodCount: task.goodCount + dto.reportQuantity,
  //                   badCount: task.badCount + 0,
  //                   actualEndTime: formattedDate,
  //                   status: '已结束',
  //                 },
  //                 { where: { id: dto.taskId }, transaction }
  //               )
  //             } else {
  //               await ProcessTask.update(
  //                 {
  //                   goodCount: task.goodCount + dto.reportQuantity,
  //                   badCount: task.badCount + 0,
  //                   actualStartTime: formattedDate,
  //                   actualEndTime: formattedDate,
  //                   status: '已结束',
  //                 },
  //                 { where: { id: dto.taskId }, transaction }
  //               )
  //             }

  //             const temp = await ProcessTask.findByPk(task.id + 1, { transaction })
  //             //如果存在下一道工序才能开始
  //             if (temp && temp.status === '未开始') {
  //               await temp.update({ status: '执行中' }, { transaction })
  //             }
  //           } else {
  //             const temp = await ProcessTask.findOne({ where: { id: dto.taskId }, transaction })
  //             //已有计划时间则不改
  //             if (temp.actualStartTime) {
  //               await ProcessTask.update(
  //                 {
  //                   goodCount: task.goodCount + dto.reportQuantity,
  //                   badCount: task.badCount + 0,
  //                 },
  //                 { where: { id: dto.taskId }, transaction }
  //               )
  //             } else {
  //               await ProcessTask.update(
  //                 {
  //                   goodCount: task.goodCount + dto.reportQuantity,
  //                   badCount: task.badCount + 0,
  //                   actualStartTime: formattedDate,
  //                 },
  //                 { where: { id: dto.taskId }, transaction }
  //               )
  //             }
  //           }
  //         }
  //         order = await ProductionOrderTask.findByPk(dto.productionOrderTaskId, {
  //           include: [
  //             {
  //               association: 'bom',
  //               attributes: ['id', 'parentMaterialCode', 'remark', 'version', 'quantity', 'formData'],
  //               where: {},
  //               include: [
  //                 {
  //                   association: 'parentMaterial',
  //                   attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
  //                   where: {},
  //                 },
  //               ],
  //             },
  //           ],
  //           transaction,
  //         })
  //         if (dto.isInspection) {
  //           const statusString = String(dto.isInspection).toLowerCase().trim() // 确保字符串统一处理
  //           const statusBoolean = statusString === 'true' || statusString === '1' // 转换逻辑

  //           const date = new Date()
  //           const year = date.getFullYear().toString().substring(2)
  //           const month = date.getMonth().toString().padStart(2, '0')
  //           const day = date.getDate().toString()
  //           let ipqcCode
  //           const temp = await InspectionForm.findOne({
  //             order: [['createdAt', 'DESC']],
  //             where: { code: { [Op.like]: `IPQC${year}${month}%` } },
  //             transaction,
  //           })
  //           if (temp) {
  //             const oldNO = temp.code
  //             const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
  //             let num = parseInt(lastFourChars)
  //             num++
  //             let newNO = num.toString().padStart(4, '0')

  //             ipqcCode = 'IPQC' + year + month + day + newNO
  //           } else {
  //             ipqcCode = 'IPQC' + year + month + day + '0001'
  //           }
  //           //如果需要质检 则产生质检单
  //           if (statusBoolean) {
  //             const form = await InspectionForm.create(
  //               {
  //                 code: ipqcCode,
  //                 type: '成品检验单',
  //                 status: '待检',
  //                 inspectionAt: new Date(moment(date).format('YYYY-MM-DD HH:mm:ss')),
  //                 createdUserId: user.id,
  //                 updatedUserId: user.id,
  //               },
  //               { transaction }
  //             )

  //             //匹配物料
  //             const mat = await InspectionTemplateMat.findOne({
  //               // where: { materialId: order.dataValues.bom.dataValues.parentMaterial.id },
  //               transaction,
  //             })
  //             let array = []
  //             if (mat) {
  //               const inspectItems = await InspectionTemplate.findOne({
  //                 where: { id: mat.inspectionTemplateId },
  //                 transaction,
  //                 include: [
  //                   {
  //                     association: 'items',
  //                     attributes: ['id', 'data'],
  //                     include: [
  //                       {
  //                         association: 'inspectionItem',
  //                         attributes: ['id', 'name'],
  //                       },
  //                     ],
  //                   },
  //                 ],
  //               })

  //               //生成质检物料信息
  //               // const info = await InspectionFormInfo.create({
  //               //   inspectionFormId: form.id,
  //               //   count: result.reportQuantity,
  //               //   result: 0,
  //               //   status: 0,
  //               //   goodCount: 0,
  //               //   badCount: 0,
  //               //   templateId: inspectItems.id,
  //               //   materialId: order.dataValues.bom.dataValues.parentMaterial.id,
  //               // }, { transaction })

  //               // const template = await TrendsTemplate.findOne({ where: { name: { [Op.like]: `%成品检验%` } }, transaction })
  //               // if (!template) {
  //               //   throw new HttpException('成品检验单模板不存在', 400)
  //               // }
  //               // for (const item of inspectItems.dataValues.items) {
  //               //   const temp = {
  //               //     name: item.dataValues.inspectionItem.dataValues.name,
  //               //     data: JSON.parse(item.data),
  //               //   }
  //               //   array.push(temp)
  //               // }
  //               // const item = await InspectionFormItem.create({
  //               //   inspectionFormInfoId: info.id,
  //               //   data: JSON.stringify(array),
  //               // }, { transaction })
  //             }
  //           }
  //         }
  //         return result.id
  //       } catch (error) {
  //         // 如果出现错误，Sequelize 将自动回滚事务
  //         throw error
  //       }
  //     })
  //     .then(async id => {
  //       return this.find(id, loadModel)
  //     })
  //     .catch(e => {
  //       throw e
  //     })
  // }

  // public async edit(dto: UProductionReportDto, id: number, user: User, loadModel) {
  //   if (!user.id) {
  //     throw new HttpException('登录信息异常,请重新登录', 400)
  //   }
  //   const sequelize = ProcessTask.sequelize
  //   let productionReport = await ProductionReport.findOne({ where: { id } })
  //   if (!productionReport) {
  //     throw new HttpException('数据不存在', 400006)
  //   }
  //   let order = await ProductionOrder.findByPk(dto.productionOrderTaskId, {
  //     include: [
  //       {
  //         association: 'bom',
  //         attributes: ['id', 'parentMaterialCode', 'remark', 'version', 'quantity', 'formData'],
  //         where: {},
  //         include: [
  //           {
  //             association: 'parentMaterial',
  //             attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
  //             where: {},
  //           },
  //         ],
  //       },
  //     ],
  //   })
  //   return sequelize
  //     .transaction(async transaction => {
  //       try {
  //         //编辑报工数量之前减去上一次报工的数量再写入本次数量
  //         let pop = await ProcessTask.findOne({
  //           where: {
  //             serialId: dto.taskId,
  //           },
  //           transaction,
  //         })
  //         if (pop) {
  //           await ProcessTask.update(
  //             {
  //               goodCount: pop.goodCount - productionReport.goodCount,
  //               badCount: pop.badCount - productionReport.badCount,
  //             },
  //             { where: { serialId: dto.taskId }, transaction }
  //           )
  //         }
  //         let task = await ProcessTask.findOne({
  //           where: {
  //             id: dto.taskId,
  //           },
  //           transaction,
  //         })
  //         if (task) {
  //           await ProcessTask.update(
  //             {
  //               goodCount: task.goodCount - productionReport.goodCount,
  //               badCount: task.badCount - productionReport.badCount,
  //             },
  //             { where: { id: dto.taskId }, transaction }
  //           )
  //         }

  //         const pops = await ProcessTask.findAll({
  //           where: { id: dto.productionOrderTaskId },
  //           order: [['id', 'ASC']],
  //           transaction,
  //         })
  //         if (pops[pops.length - 1].dataValues.processId === dto.processId) {
  //           // await order.update({ actualOutput: order.actualOutput - productionReport.goodCount }, { transaction })
  //         }
  //         //删除相关不良品项
  //         await PRI.destroy({ where: { productionReportId: id }, transaction })

  //         // await order.update(
  //         //   {
  //         //     totalWorkingHours:
  //         //       order.totalWorkingHours - Number(productionReport.reportDurationHours) - Number(Number(Number(productionReport.reportDurationMinutes) / 60).toFixed(2)),
  //         //   },
  //         //   { transaction }
  //         // )

  //         const date: Date = new Date()
  //         const formattedDate = moment(date, 'YYYY-MM-DD HH:mm:ss').toDate()
  //         const sum = await ProductionReport.sum('goodCount', {
  //           where: {
  //             id: dto.productionOrderTaskId,
  //             processId: dto.processId,
  //           },
  //           transaction,
  //         })
  //         if (sum + dto.reportQuantity - productionReport.goodCount > task.dataValues.planCount) {
  //           throw new HttpException('此次报工已超过该工单可报工上限', 400)
  //         }

  //         await productionReport.update(
  //           {
  //             ...dto,
  //             // updatedUserId: user.id,
  //           },
  //           { transaction }
  //         )

  //         pop = await ProcessTask.findOne({ where: { serialId: dto.taskId }, transaction })
  //         if (pop.planCount >= pop.goodCount + dto.reportQuantity) {
  //           if (pop.status === '未开始') {
  //             await ProcessTask.update(
  //               { status: '执行中' },
  //               {
  //                 where: {
  //                   id: dto.productionOrderTaskId,
  //                   processId: dto.processId,
  //                 },
  //                 transaction,
  //               }
  //             )
  //           }
  //           if (pop.planCount == pop.goodCount + dto.reportQuantity) {
  //             const pop1 = await ProcessTask.findOne({ where: { serialId: dto.taskId }, transaction })
  //             if (pop1.dataValues.actualStartTime) {
  //               await ProcessTask.update(
  //                 {
  //                   goodCount: pop.goodCount + dto.reportQuantity,
  //                   badCount: pop.badCount + 0,
  //                   actualEndTime: formattedDate,
  //                   status: '已结束',
  //                 },
  //                 { where: { serialId: dto.taskId }, transaction }
  //               )
  //               //工序完成开启下一道工序

  //               let popTemp = await ProcessTask.findOne({
  //                 where: { id: pop1.id + 1 },
  //                 order: [['id', 'ASC']],
  //                 include: [{ association: 'process', attributes: ['id', 'processName'] }],
  //                 transaction,
  //               })
  //               //如果存在下到工序就更新
  //               if (popTemp) {
  //                 await popTemp.update({ status: '执行中' }, { transaction })
  //                 popTemp = await ProcessTask.findOne({
  //                   where: { id: dto.productionOrderTaskId, status: '执行中' },
  //                   order: [['id', 'ASC']],
  //                   include: [{ association: 'process', attributes: ['id', 'processName'] }],
  //                   transaction,
  //                 })
  //                 // await ProductionOrder.update(
  //                 //   { currentProcess: popTemp.dataValues.process.processName },
  //                 //   {
  //                 //     where: { id: dto.productionOrderTaskId },
  //                 //     transaction,
  //                 //   }
  //                 // )
  //               }
  //             } else {
  //               await ProcessTask.update(
  //                 {
  //                   goodCount: pop.goodCount + dto.reportQuantity,
  //                   badCount: pop.badCount + 0,
  //                   actualEndTime: formattedDate,
  //                   actualStartTime: formattedDate,
  //                   status: '已结束',
  //                 },
  //                 { where: { serialId: dto.taskId }, transaction }
  //               )

  //               let popTemp = await ProcessTask.findOne({
  //                 where: { id: pop1.id + 1 },
  //                 order: [['id', 'ASC']],
  //                 include: [{ association: 'process', attributes: ['id', 'processName'] }],
  //                 transaction,
  //               })
  //               //如果存在下到工序就更新
  //               if (popTemp) {
  //                 await popTemp.update({ status: '执行中' }, { transaction })
  //                 popTemp = await ProcessTask.findOne({
  //                   where: { id: dto.productionOrderTaskId, status: '执行中' },
  //                   order: [['id', 'ASC']],
  //                   include: [{ association: 'process', attributes: ['id', 'processName'] }],
  //                   transaction,
  //                 })
  //                 // await ProductionOrder.update(
  //                 //   { currentProcess: popTemp.dataValues.process.processName },
  //                 //   {
  //                 //     where: { id: dto.productionOrderTaskId },
  //                 //     transaction,
  //                 //   }
  //                 // )
  //               }
  //             }
  //             //如果报完所有工序将order转为已结束
  //             const pops = await ProcessTask.findAll({
  //               where: { id: dto.productionOrderTaskId },
  //               order: [['id', 'ASC']],
  //               transaction,
  //             })
  //             if (pops[pops.length - 1].dataValues.processId === dto.processId) {
  //               // await order.update({ status: '已结束', actualOutput: order.actualOutput + dto.reportQuantity, actualEndTime: formattedDate, currentProcess: null }, { transaction })

  //               const popTemp = await ProcessTask.findOne({
  //                 where: { id: dto.productionOrderTaskId, status: '执行中' },
  //                 order: [['id', 'ASC']],
  //                 include: [{ association: 'process', attributes: ['id', 'processName'] }],
  //                 transaction,
  //               })
  //               //如果存在工序就更新
  //               if (popTemp) {
  //                 // await ProductionOrder.update(
  //                 //   { currentProcess: popTemp.dataValues.process.processName },
  //                 //   {
  //                 //     where: { id: dto.productionOrderTaskId },
  //                 //     transaction,
  //                 //   }
  //                 // )
  //               }
  //             }
  //           } else {
  //             await ProcessTask.update(
  //               {
  //                 goodCount: pop.goodCount + dto.reportQuantity,
  //                 badCount: pop.badCount + 0,
  //               },
  //               { where: { serialId: dto.taskId }, transaction: transaction }
  //             )
  //             //产出
  //             const pops = await ProcessTask.findAll({
  //               where: { id: dto.productionOrderTaskId },
  //               order: [['id', 'ASC']],
  //               transaction,
  //             })
  //             if (pops[pops.length - 1].dataValues.processId === dto.processId) {
  //               // await order.update({ actualOutput: order.actualOutput + dto.reportQuantity }, { transaction })
  //             }
  //           }
  //         }
  //         task = await ProcessTask.findOne({ where: { id: dto.taskId }, transaction })
  //         if (task.planCount >= task.goodCount + dto.reportQuantity) {
  //           if (task.status === '未开始') {
  //             await ProcessTask.update(
  //               { status: '执行中' },
  //               {
  //                 where: {
  //                   id: dto.taskId,
  //                 },
  //                 transaction,
  //               }
  //             )
  //           }
  //           if (task.planCount == task.goodCount + dto.reportQuantity) {
  //             await ProcessTask.update(
  //               {
  //                 goodCount: task.goodCount + dto.reportQuantity,
  //                 badCount: task.badCount + 0,
  //                 actualEndTime: formattedDate,
  //                 status: '已结束',
  //               },
  //               { where: { id: dto.taskId }, transaction }
  //             )
  //             const temp = await ProcessTask.findByPk(task.id + 1, { transaction })
  //             //如果存在下一道工序才能开始
  //             if (temp && temp.status === '未开始') {
  //               await temp.update({ status: '执行中' }, { transaction })
  //             }
  //           } else {
  //             const temp = await ProcessTask.findOne({ where: { id: dto.taskId }, transaction })
  //             //已有计划时间则不改
  //             if (temp.actualStartTime) {
  //               await ProcessTask.update(
  //                 {
  //                   goodCount: task.goodCount + dto.reportQuantity,
  //                   badCount: task.badCount + 0,
  //                 },
  //                 { where: { id: dto.taskId }, transaction }
  //               )
  //             } else {
  //               await ProcessTask.update(
  //                 {
  //                   goodCount: task.goodCount + dto.reportQuantity,
  //                   badCount: task.badCount + 0,
  //                   actualStartTime: formattedDate,
  //                 },
  //                 { where: { id: dto.taskId }, transaction }
  //               )
  //             }
  //           }
  //         }

  //         if (dto.items) {
  //           for (const item of dto.items) {
  //             await PRI.create(
  //               {
  //                 productionReportId: id,
  //                 defectiveItemId: item.defectiveItemId,
  //                 count: item.count,
  //               },
  //               { transaction }
  //             )
  //           }
  //         }
  //         order = await ProductionOrder.findByPk(dto.productionOrderTaskId, {
  //           include: [
  //             {
  //               association: 'bom',
  //               attributes: ['id', 'parentMaterialCode', 'remark', 'version', 'quantity', 'formData'],
  //               where: {},
  //               include: [
  //                 {
  //                   association: 'parentMaterial',
  //                   attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
  //                   where: {},
  //                 },
  //               ],
  //             },
  //           ],
  //           transaction,
  //         })
  //         // await order.update(
  //         //   { totalWorkingHours: order.totalWorkingHours + Number(dto.reportDurationHours) + Number(Number(Number(dto.reportDurationMinutes) / 60).toFixed(2)) },
  //         //   { transaction }
  //         // )
  //         if (dto.isInspection) {
  //           throw new HttpException('已产生后续单据无法编辑', 400)
  //           // const statusString = String(dto.isInspection).toLowerCase().trim() // 确保字符串统一处理
  //           // const statusBoolean = statusString === 'true' || statusString === '1' // 转换逻辑
  //           // //如果需要质检 则产生质检单
  //           // if (statusBoolean) {
  //           //   let form = await InspectionForm.findOne({ where: { productionReportId: productionReport.id }, transaction })
  //           //   await form.update({
  //           //     productionOrderId: dto.productionOrderId,
  //           //     productionReportId: id,
  //           //     createdUserId: user.id,
  //           //     updatedUserId: user.id,
  //           //     processId: dto.processId,
  //           //     count: dto.reportQuantity,
  //           //     type: dto.type,
  //           //   }, { transaction })
  //           //
  //           //   const mat = await InspectionTemplateMat.findOne({
  //           //     where: { materialId: order.dataValues.bom.parentMaterialCode },
  //           //     transaction
  //           //   })
  //           //   await InspectionFormItem.destroy({
  //           //     where: {
  //           //       inspectionFormId: form.id
  //           //     }, transaction
  //           //   })
  //           //
  //           //   if (mat) {
  //           //     // const items = await InspectionTemplateItem.findAll({ where: { inspectionTemplateId: mat.inspectionTemplateId } })
  //           //     // for (const item of items) {
  //           //     //   await InspectionFormItem.create({
  //           //     //     inspectionFormId: form.id,
  //           //     //     inspectionItemId: item.id
  //           //     //   }, { transaction })
  //           //     // }
  //           //   }
  //           // }
  //         }

  //         return id
  //       } catch (error) {
  //         // 如果出现错误，Sequelize 将自动回滚事务
  //         throw error
  //       }
  //     })
  //     .then(async id => {
  //       return this.find(id, loadModel)
  //     })
  //     .catch(e => {
  //       throw e
  //     })
  // }

  // public async delete(id: number, loadModel) {
  //   //删除记录前减去对应工序任务单和生产工单的数量
  //   let productionReport = await ProductionReport.findOne({
  //     where: { id },
  //     include: [
  //       {
  //         association: 'processPositionTask',
  //         include: [
  //           {
  //             association: 'processTask',
  //             attributes: ['id', 'serialId'],
  //           },
  //         ],
  //       },
  //     ],
  //   })
  //   if (!productionReport) {
  //     throw new HttpException('数据不存在', 400006)
  //   }
  //   if (productionReport.auditStatus === '已审核') {
  //     throw new HttpException('该报工单已审核,不允许删除！', 400)
  //   }
  //   //编辑报工数量之前减去上一次报工的数量再写入本次数量
  //   let pop = await ProcessTask.findAll({
  //     where: {
  //       serialId: productionReport.processPositionTask?.processTask?.serialId,
  //       processId: productionReport.processId,
  //     },
  //   })
  //   for (const pop1 of pop) {
  //     if (pop1) {
  //       await ProcessTask.update(
  //         {
  //           goodCount: pop1.goodCount - productionReport.goodCount,
  //           badCount: pop1.badCount - productionReport.badCount,
  //           status: '执行中',
  //         },
  //         { where: { id: pop1.dataValues.id } }
  //       )
  //     }
  //   }
  //   let task = await ProcessTask.findAll({
  //     where: {
  //       serialId: productionReport.processPositionTask?.processTask?.serialId,
  //       processId: productionReport.processId,
  //     },
  //   })
  //   for (const processTask of task) {
  //     if (processTask) {
  //       await ProcessTask.update(
  //         {
  //           goodCount: processTask.goodCount - productionReport?.goodCount,
  //           badCount: processTask.badCount - productionReport?.badCount,
  //           status: '执行中',
  //         },
  //         { where: { id: processTask.dataValues.id } }
  //       )
  //     }
  //   }
  //   await PRI.destroy({ where: { productionReportId: id } })

  //   if (productionReport.auditStatus === '已审核') {
  //     //删除对应绩效
  //     const temp = await PerformanceDetailed.findOne({ where: { productionReportId: id } })
  //     let per = await Performance.findOne({ where: { id: temp.dataValues.performanceId } })
  //     await Performance.update(
  //       {
  //         goodCount: per.dataValues.goodCount - productionReport.dataValues.goodCount,
  //         badCount: per.dataValues.badCount - productionReport.dataValues.badCount,
  //         goodCountWages: per.dataValues.goodCountWages - temp.dataValues.goodCountWages,
  //         badCountWages: per.dataValues.badCountWages - temp.dataValues.badCountWages,
  //       },
  //       { where: { id: temp.dataValues.performanceId } }
  //     )

  //     per = await Performance.findOne({ where: { id: temp.dataValues.performanceId } })
  //     await per.update({ yieldRate: (per.dataValues.goodCount / per.dataValues.badCount) * 100 })
  //     await PerformanceDetailed.destroy({ where: { productionReportId: id } })
  //   }
  //   const result = await ProductionReport.destroy({
  //     where: {
  //       id: id,
  //     },
  //   })
  //   return result
  // }

  // public async find(id: number, loadModel) {
  //   const options: FindOptions = {
  //     where: { id },
  //     include: [
  //       {
  //         association: 'order',
  //         attributes: ['id', 'code', 'plannedOutput'],
  //         include: [
  //           {
  //             association: 'bom',
  //             attributes: ['id', 'parentMaterialCode', 'remark', 'version', 'quantity', 'formData'],
  //             where: {},
  //             include: [
  //               {
  //                 association: 'parentMaterial',
  //                 attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
  //                 where: {},
  //               },
  //             ],
  //           },
  //         ],
  //       },
  //       {
  //         association: 'process',
  //         attributes: ['id', 'processName'],
  //       },
  //       {
  //         association: 'productUser',
  //         attributes: ['id', 'userCode', 'userName'],
  //       },
  //       {
  //         association: 'auditor',
  //         attributes: ['id', 'userCode', 'userName'],
  //       },
  //       {
  //         association: 'createdUser',
  //         attributes: ['id', 'userName'],
  //       },
  //       {
  //         association: 'updatedUser',
  //         attributes: ['id', 'userName'],
  //       },
  //       {
  //         association: 'pri',
  //         include: [
  //           {
  //             association: 'defectiveItem',
  //           },
  //         ],
  //       },
  //       {
  //         association: 'processPositionTask',
  //         attributes: ['id', 'planCount'],
  //         include: [
  //           {
  //             association: 'processTask',
  //             attributes: ['id', 'serialId'],
  //           },
  //         ],
  //       },
  //     ],
  //   }
  //   const result = await ProductionReport.findOne(options)
  //   const temp = await PerformanceConfig.findOne({
  //     where: {
  //       // materialId: result.dataValues.order.dataValues.bom.dataValues.materialId,
  //       processId: result.dataValues.processId,
  //     },
  //   })
  //   if (temp) {
  //     result.setDataValue('performanceConfig', temp)
  //   }

  //   const records = await ProductionReport.findAll({
  //     attributes: ['id', 'goodCount'],
  //     where: {
  //       processPositionTaskId: {
  //         [Op.eq]: result.processPositionTaskId,
  //       },
  //       createdAt: {
  //         [Op.lt]: result.createdAt,
  //       },
  //     },
  //   })
  //   const order = await ProductionOrder.findByPk(result.processPositionTask?.processTask?.serialId)
  //   let count = 0
  //   for (const record of records) {
  //     count += record.goodCount
  //   }
  //   result.setDataValue('processProgress', count + '')
  //   return result
  // }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'productionOrderTask',
          attributes: ['id', 'orderCode', 'splitQuantity'],
          required: false,
          through: { attributes: [] },
          where: {},
          include: [
            {
              association: 'productionReportDetails',
              required: false,
              // include: [
              //   {
              //     association: 'processPositionTask',
              //   },
              // ],
            },
            {
              association: 'material',
              where: {},
              required: false,
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
    // for (const datum of result.data) {
    //   const temp = await PerformanceConfig.findOne({
    //     where: {
    //       materialId: datum.dataValues.order.dataValues.bom.dataValues.parentMaterialCode,
    //       processId: datum.dataValues.processId,
    //     },
    //   })
    //   if (temp) {
    //     datum.setDataValue('performanceConfig', temp)
    //   }

    //   // const records = await ProductionReport.findAll({
    //   //   attributes: ['id', 'goodCount'],
    //   //   where: {
    //   //     processPositionTaskId: {
    //   //       [Op.eq]: datum.dataValues.processPositionTaskId,
    //   //     },
    //   //     createdAt: {
    //   //       [Op.lt]: datum.createdAt,
    //   //     },
    //   //   },
    //   // })
    //   // const order = await ProductionOrder.findByPk(datum.productionOrderId)
    //   // let count = 0
    //   // for (const record of records) {
    //   //   count += record.goodCount
    //   // }
    //   // datum.setDataValue('processProgress', count + '')
    // }
    return result
  }

  public async reportTaskList(dto: FindPaginationReportTaskListDto, pagination: Pagination, user) {
    const processPositionTaskWhere = {}

    const options: FindPaginationOptions = {
      where: {},
      pagination,
      attributes: ['id', 'orderCode', 'splitQuantity'],
      include: [
        {
          association: 'productSerials',
          attributes: ['id', 'serialNumber'],
          where: {},
          include: [
            {
              association: 'processTasks',
              where: {},
              attributes: ['id', 'status'],
              include: [
                {
                  association: 'processPositionTasks',
                  where: processPositionTaskWhere,
                  include: [
                    {
                      association: 'operateLogs',
                      separate: true, // 单独查询关联，order 才会生效
                      order: [['id', 'ASC']],
                    },
                  ],
                  // attributes: [],
                },
              ],
            },
            {
              association: 'currentProcessTask',
              attributes: ['id', 'processId'],
            },
          ],
        },
        {
          association: 'material',
          attributes: ['id', 'code', 'materialName'],
        },
      ],
    }

    if (dto.positioProcessId) {
      processPositionTaskWhere['processId'] = dto.positioProcessId
    }

    if (dto.status) {
      processPositionTaskWhere['status'] = dto.status
    }

    if (dto.status == POSITION_TASK_STATUS.All || !dto.status) {
      processPositionTaskWhere['status'] = {
        [Op.notIn]: [POSITION_TASK_STATUS.TO_ASSIGN, POSITION_TASK_STATUS.TO_AUDIT],
      }
    }

    if (dto.status == POSITION_TASK_STATUS.IN_PROGRESS) {
      processPositionTaskWhere['status'] = {
        [Op.in]: [POSITION_TASK_STATUS.IN_PROGRESS, POSITION_TASK_STATUS.PAUSED],
      }
    }

    const result = await Paging.diyPaging(ProductionOrderTask, pagination, options)

    let taskTime = null

    if (dto.status == POSITION_TASK_STATUS.IN_PROGRESS && result.data[0]?.productSerials[0]?.processTasks[0]) {
      taskTime = await this.productionReportTwoService.getReportUserDuration(user, result.data[0]?.productSerials[0].processTasks[0].processPositionTasks)
    }

    return {
      result,
      taskTime,
      status: result.data[0]?.productSerials[0]?.processTasks[0].status,
    }
  }

  // async batch(dto: batchDto, user: User, loadModel) {
  //   let sucessCount = 0
  //   if (dto) {
  //     for (const dtoElement of dto.dtos) {
  //       await this.create(dtoElement, user, loadModel)
  //       sucessCount++
  //     }
  //   }
  //   return new ResultVO(sucessCount, 200, '批量创建成功')
  // }

  // public async audit(dto: auditDto, user, loadModel) {
  //   if (!user.id) {
  //     throw new HttpException('登录状态出现异常,请重新登录', 400)
  //   }
  //   if (dto.ids != undefined) {
  //     for (const id of dto.ids) {
  //       const report = await ProductionReport.findOne({
  //         where: { id },
  //         include: [
  //           {
  //             association: 'processPositionTask',
  //             include: [
  //               {
  //                 association: 'processTask',
  //                 attributes: ['id', 'serialId'],
  //               },
  //             ],
  //           },
  //         ],
  //       })
  //       if (report) {
  //         const date: Date = new Date()
  //         const formattedDate = moment(date, 'YYYY-MM-DD HH:mm:ss').toDate()
  //         await ProductionReport.update(
  //           {
  //             auditorId: user.id,
  //             auditStatus: dto.status,
  //             auditedAt: formattedDate,
  //           },
  //           { where: { id } }
  //         )
  //         if (dto.status === '已审核') {
  //           const order = await ProductionOrder.findByPk(report.processPositionTask?.processTask?.serialId, {
  //             include: [
  //               {
  //                 association: 'bom',
  //                 attributes: ['id', 'parentMaterialCode', 'remark', 'version', 'quantity', 'formData'],
  //                 where: {},
  //                 include: [
  //                   {
  //                     association: 'parentMaterial',
  //                     attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
  //                     where: {},
  //                   },
  //                 ],
  //               },
  //               {
  //                 association: 'boms',
  //                 required: false,
  //               },
  //             ],
  //           })
  //           const perUser = await User.findByPk(report.productUserId)
  //           let per = await Performance.findOne({ where: { userId: perUser.id } })
  //           let config = await PerformanceConfig.findOne({
  //             where: {
  //               // materialId: order.dataValues.bom.materialId,
  //               processId: report.processId,
  //             },
  //           })
  //           if (!per) {
  //             per = await Performance.create({
  //               deptId: perUser.departmentId,
  //               userId: perUser.id,
  //               goodCount: 0,
  //               badCount: 0,
  //               yieldRate: 0,
  //               goodCountWages: 0,
  //               badCountWages: 0,
  //               wages: 0,
  //             })
  //           }
  //           if (config) {
  //             if (report.accountingType === '计件') {
  //               per.update({
  //                 goodCount: report.goodCount + per.goodCount,
  //                 badCount: report.badCount + per.badCount,
  //                 yieldRate: ((report.goodCount + per.goodCount) / (report.badCount + report.goodCount + per.goodCount + per.badCount)) * 100,
  //                 goodCountWages: report.goodCount * config.goodCountPrice + per.goodCountWages,
  //                 badCountWages: report.badCount * config.badCountPrice + per.badCountWages,
  //                 wages: report.goodCount * config.goodCountPrice + report.badCount * config.badCountPrice + per.wages,
  //               })
  //               //生成绩效明细
  //               const temp = await PerformanceDetailed.findOne({
  //                 where: {
  //                   productionReportId: id,
  //                   // materialId: order.dataValues.bom.materialId,
  //                   processId: report.processId,
  //                   performanceId: per.id,
  //                   id: report.processPositionTask?.processTask?.serialId,
  //                   userId: perUser.id,
  //                 },
  //               })
  //               if (!temp) {
  //                 await PerformanceDetailed.create({
  //                   productionReportId: id,
  //                   // materialId: order.dataValues.bom.dataValues.parentMaterial.id,
  //                   processId: report.processId,
  //                   performanceId: per.id,
  //                   id: report.processPositionTask?.processTask?.serialId,
  //                   userId: perUser.id,
  //                   goodCount: report.goodCount,
  //                   badCount: report.badCount,
  //                   goodCountPrice: config.goodCountPrice,
  //                   badCountPrice: config.badCountPrice,
  //                   goodCountWages: report.goodCount * config.goodCountPrice,
  //                   badCountWages: report.badCount * config.badCountPrice,
  //                   yieldRate: (report.goodCount / (report.badCount + report.goodCount)) * 100,
  //                   wages: report.badCount * config.badCountPrice + report.goodCount * config.goodCountPrice,
  //                 })
  //               } else {
  //                 await temp.update({
  //                   goodCount: report.goodCount,
  //                   badCount: report.badCount,
  //                   goodCountPrice: config.goodCountPrice,
  //                   badCountPrice: config.badCountPrice,
  //                   goodCountWages: report.goodCount * config.goodCountPrice,
  //                   badCountWages: report.badCount * config.badCountPrice,
  //                   yieldRate: (report.goodCount / (report.badCount + report.goodCount)) * 100,
  //                   wages: report.badCount * config.badCountPrice + report.goodCount * config.goodCountPrice,
  //                 })
  //               }
  //             } else {
  //               per.update({
  //                 goodCount: report.goodCount + per.goodCount,
  //                 badCount: report.badCount + per.badCount,
  //                 yieldRate: ((report.goodCount + per.goodCount) / (report.badCount + report.goodCount + per.goodCount + per.badCount)) * 100,
  //                 goodCountWages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice + per.goodCountWages,
  //                 wages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice + per.wages,
  //               })

  //               const temp = await PerformanceDetailed.findOne({
  //                 where: {
  //                   productionReportId: id,
  //                   // materialId: order.dataValues.bom.materialId,
  //                   processId: report.processId,
  //                   performanceId: per.id,
  //                   id: report.processPositionTask?.processTask?.serialId,
  //                 },
  //               })
  //               if (!temp) {
  //                 //生成绩效明细
  //                 await PerformanceDetailed.create({
  //                   productionReportId: id,
  //                   // materialId: order.dataValues.bom.dataValues.parentMaterial.id,
  //                   processId: report.processId,
  //                   performanceId: per.id,
  //                   id: report.processPositionTask?.processTask?.serialId,
  //                   userId: perUser.id,
  //                   goodCount: report.goodCount,
  //                   badCount: report.badCount,
  //                   goodCountPrice: config.goodCountPrice,
  //                   badCountPrice: config.badCountPrice,
  //                   goodCountWages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice,
  //                   yieldRate: (report.goodCount / (report.badCount + report.goodCount)) * 100,
  //                   wages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice,
  //                 })
  //               } else {
  //                 await temp.update({
  //                   goodCount: report.goodCount,
  //                   badCount: report.badCount,
  //                   goodCountPrice: config.goodCountPrice,
  //                   badCountPrice: config.badCountPrice,
  //                   goodCountWages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice,
  //                   yieldRate: (report.goodCount / (report.badCount + report.goodCount)) * 100,
  //                   wages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice,
  //                 })
  //               }
  //             }
  //           }
  //         } else if (dto.status === '取消审核') {
  //           const order = await ProductionOrder.findByPk(report.processPositionTask?.processTask?.serialId, {
  //             include: [
  //               {
  //                 association: 'bom',
  //                 attributes: ['id', 'parentMaterialCode', 'remark', 'version', 'quantity', 'formData'],
  //                 where: {},
  //                 include: [
  //                   {
  //                     association: 'parentMaterial',
  //                     attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
  //                     where: {},
  //                   },
  //                 ],
  //               },
  //             ],
  //           })
  //           // 删除相关绩效
  //           if (user.id) {
  //             const perUser = await User.findByPk(user.id)
  //             let per = await Performance.findOne({ where: { userId: perUser.id } })
  //             let config = await PerformanceConfig.findOne({
  //               where: {
  //                 // materialId: order.dataValues.bom.dataValues.materialId,
  //                 processId: report.dataValues.processId,
  //               },
  //             })
  //             let detail = await PerformanceDetailed.findOne({
  //               where: { performanceId: per.id },
  //               order: [['createdAt', 'DESC']],
  //             })
  //             if (per) {
  //               if (report.accountingType === '计件') {
  //                 per.update({
  //                   goodCount: per.goodCount - detail.goodCount,
  //                   badCount: per.badCount - detail.badCount,
  //                   yieldRate: ((per.goodCount - detail.goodCount) / (per.goodCount + per.badCount - detail.badCount - detail.goodCount)) * 100,
  //                   goodCountWages: per.goodCountWages - detail.goodCountWages,
  //                   badCountWages: per.badCountWages - detail.badCountWages,
  //                   wages: per.wages - detail.goodCountWages - detail.badCountWages,
  //                 })
  //               } else {
  //                 per.update({
  //                   goodCount: per.goodCount - detail.goodCount,
  //                   badCount: per.badCount - detail.badCount,
  //                   yieldRate: ((per.goodCount - detail.goodCount) / (per.goodCount + per.badCount - detail.badCount - detail.goodCount)) * 100,
  //                   goodCountWages: per.goodCountWages - detail.goodCountWages,
  //                   wages: per.wages - detail.goodCountWages,
  //                 })
  //               }
  //             }
  //             await detail.destroy()
  //           }
  //         }
  //       }
  //     }
  //   }
  //   return new ResultVO()
  // }

  // public async batDelete(dto: deleteIdsDto, loadModel) {
  //   for (const id of dto.ids) {
  //     await this.delete(id, loadModel)
  //   }
  // }
}
