import { Injectable } from '@nestjs/common'
import { Op, Transaction } from 'sequelize'
import { ProductionOrder } from '@model/production/productionOrder.model'
import { ProcessTask } from '@model/production/processTask.model'
import { PerformanceConfig } from '@model/performance/performanceConfig.model'
import { InspectionForm } from '@model/quantity/inspectionForm.model'
import { InspectionTemplateMat } from '@model/quantity/inspectionTemplateMat.model'
// import { InspectionTemplateItem } from '@model/quantity/inspectionTemplateItem.model'
import { OpenTaskDto, PadRegisterDto, PickingOutboundDto } from './productionReport.dto'
import { POSITION_TASK_STATUS, PROCESS_TASK_STATUS, ProductSerialStatus, TaskStatus } from '@common/enum'
import { Aide } from '@library/utils/aide'
import { UserDuration } from '@model/production/userDuration.model'
import { UserTaskDuration } from '@model/production/userTaskDuration.model'
import { InspectionTemplate } from '@model/quantity/inspectionTemplate.model'
import {
  InspectionFormInfo,
  InspectionFormItem,
  Process,
  ProcessTaskLog,
  ProductionOrderTask,
  ProductionOrderTaskOfReport,
  ProductionReport,
  ProductionReportDetail,
  ProductSerial,
  TeamUser,
} from '@model/index'
import { InspectionTemplateTypeEnum } from '@modules/admin/inspectionTemplate/inspectionTemplate.dto'
import { KingdeeeService } from '@library/kingdee'
import moment = require('moment')
import _ = require('lodash')
import { ProcessPositionTask } from '@model/production/processPositionTask.model'

@Injectable()
export class ProductionReportTwoService {
  constructor() {}

  // 开工、暂停
  public async openTask(dto: OpenTaskDto, user) {
    const transaction = await ProcessTask.sequelize.transaction()
    const { status: taskStatus } = dto
    let taskList: ProcessPositionTask[] = []
    console.log(1)
    try {
      const process = await Process.findOne({ where: { id: dto.processId } })
      for (const processDto of dto.productionOrderTask) {
        console.log(2)
        // 工单任务
        // await ProductionOrderTask.update({ actualStartTime: new Date() }, { where: { id: processDto.productionOrderTaskId }, transaction }) // 工单  --- TODO,不知道为什么很慢 这条代码
        for (const item of processDto.positions) {
          console.log(3)
          // 工序任务
          const processTask = await ProcessTask.findOne({ where: { serialId: item.serialId, processId: process.parentId } })
          await processTask.update(
            {
              status: taskStatus == TaskStatus.OPEN_TASK ? PROCESS_TASK_STATUS.running : PROCESS_TASK_STATUS.pause,
              actualStartTime: processTask.actualStartTime && new Date(),
            },
            { transaction }
          )
          // 工位任务
          const processPositionTask = await ProcessPositionTask.findOne({
            where: { serialId: item.serialId, processId: dto.processId },
            include: [{ association: 'operateLogs' }],
          })
          if (processPositionTask.status == POSITION_TASK_STATUS.IN_PROGRESS && taskStatus == TaskStatus.OPEN_TASK) throw new Error('当前任务正在进行中，不能重新开工')
          if (processPositionTask.status == POSITION_TASK_STATUS.PAUSED && taskStatus == TaskStatus.PAUSE) throw new Error('当前任务已暂停，不能暂停')
          await processPositionTask.update(
            {
              actualStartTime: processPositionTask.dataValues.actualStartTime ?? new Date(),
              status: taskStatus == TaskStatus.OPEN_TASK ? POSITION_TASK_STATUS.IN_PROGRESS : POSITION_TASK_STATUS.PAUSED,
            },
            { transaction }
          )
          taskList.push(processPositionTask)
          // 序列号
          await ProductSerial.update(
            { status: taskStatus == TaskStatus.OPEN_TASK ? ProductSerialStatus.IN_PROGRESS : ProductSerialStatus.PAUSED, currentProcessTaskId: processTask.dataValues.id },
            { where: { id: item.serialId } }
          )
          // 日志
          const logs = await ProcessTaskLog.create(
            {
              processTaskID: processTask.id,
              processPositionTaskId: processPositionTask.dataValues.id,
              ...(taskStatus == TaskStatus.OPEN_TASK ? { resumeTime: new Date() } : { pauseTime: new Date() }),
            },
            { transaction }
          )
          taskList[taskList.length - 1]['operateLogs'].push(logs)
        }
      }
      // 创建用户时长和任务单用户关系
      const taskTime = await this.createReportUserDuration(user, taskList)
      console.log(4)
      await transaction.commit()

      return taskTime

      // 3. 处理工时
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  // 报工
  public async reportTask(dto: PadRegisterDto, user) {
    const transaction = await ProcessTask.sequelize.transaction()
    let taskList: ProcessPositionTask[] = []
    try {
      // 1. 创建报工单
      const productionReport = await ProductionReport.create({ processId: dto.processId, productUserId: user.id, teamId: dto.teamId }, { transaction })
      // 2. 处理报工产生的关联及工序的推进
      // 2.1 处理工单
      for (const processDto of dto.productionOrderTask) {
        const productionOrderTaskOfReport = await ProductionOrderTaskOfReport.create(
          { productionOrderTaskId: processDto.productionOrderTaskId, reportId: productionReport.id },
          { transaction }
        )
        const process = await Process.findOne({ where: { id: dto.processId } })
        // 2.2 处理工序（工位）
        for (const item of processDto.positions) {
          // 工序任务
          const processTask = await ProcessTask.findOne({ where: { serialId: item.serialId, processId: process.parentId } })
          if (process.isQC) {
            await processTask.update(
              {
                goodCount: item.QCResult ? 1 : 0,
                reportQuantity: item.QCResult ? 1 : 0,
              },
              { transaction }
            )
            if (!item.QCResult) {
              // 不良品 不良原因
            }
          }
          // 工位任务
          const processPositionTask = await ProcessPositionTask.findOne({
            where: { serialId: item.serialId, processId: dto.processId },
            include: [{ association: 'operateLogs' }],
          })
          // 上一道子工序
          const preProcessPositionTask = await ProcessPositionTask.findOne({
            where: { serialId: processPositionTask.serialId, id: processPositionTask.id - 1 },
            order: [['id', 'ASC']],
            transaction,
          })
          if (processPositionTask.dataValues.status != POSITION_TASK_STATUS.IN_PROGRESS) throw new Error('当前序列号不在进行中，无法报工')
          if (preProcessPositionTask && preProcessPositionTask.dataValues.status != POSITION_TASK_STATUS.COMPLETED) throw new Error('上一道子工序未完成，无法报工')
          await processPositionTask.update({ status: POSITION_TASK_STATUS.COMPLETED, actualEndTime: new Date() }, { transaction })
          await ProductionReportDetail.create(
            {
              productionReportId: productionReport.id,
              processPositionTaskId: processPositionTask.id,
              taskOfReportId: productionOrderTaskOfReport.id,
              reportQuantity: 1,
              startTime: processPositionTask.actualStartTime,
              endTime: new Date(),
            },
            { transaction }
          )
          taskList.push(processPositionTask)

          // 日志
          const logs = await ProcessTaskLog.create(
            {
              processTaskID: processTask.id,
              processPositionTaskId: processPositionTask.dataValues.id,
              pauseTime: new Date(),
            },
            { transaction }
          )
          taskList[taskList.length - 1]['operateLogs'].push(logs)

          // 处理下一道工位
          const nextProcessPositionTask = await ProcessPositionTask.findOne({
            where: { serialId: processPositionTask.serialId, id: processPositionTask.id + 1 },
            order: [['id', 'ASC']],
            // include: [{ association: 'process', attributes: ['id', 'processName'] }],
            transaction,
          })

          if (nextProcessPositionTask) {
            // if (nextProcessPositionTask.status == PROCESS_TASK_STATUS.notStart) {
            //   await nextProcessPositionTask.update({ status: PROCESS_TASK_STATUS.running }, { transaction })
            // }
          } else {
            // 没有下一道工位
            await processTask.update({ status: PROCESS_TASK_STATUS.finish, actualEndTime: new Date() }, { transaction })
            // 生产汇报单
            // await this.produceStore(
            //   {
            //     serialId: task.serialId,
            //     goodCount: deltaGood,
            //     badCount: 0,
            //     taskId: task.id,
            //   },
            //   transaction
            // )
          }
        }
      }
      // 3. 创建用户时长和报工关系、工时
      const taskTime = await this.createReportUserDuration(user, taskList, productionReport.id)

      await transaction.commit()

      return {
        taskTime,
        productionReport,
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  private async handleInspection(task: ProcessTask, result: ProductionReport, date) {
    const year = date.getFullYear().toString().substring(2)
    const month = date.getMonth().toString().padStart(2, '0')
    const day = date.getDate().toString()

    const temp = await InspectionForm.findOne({
      order: [['createdAt', 'DESC']],
      where: { code: { [Op.like]: `IPQC${year}${month}%` } },
    })

    const ipqcCode = temp ? this.generateNextCode(temp.code, year, month, day) : `IPQC${year}${month}${day}0001`

    // 第一步：判断工序类型
    const nextTask = await ProcessTask.findOne({
      where: {
        id: task.id + 1,
        serialId: task.serialId,
      },
      attributes: ['id'],
    })
    const isLastProcess = !nextTask // 没有下一道工序则为末道工序
    const inspectionType = isLastProcess ? '成品检验单' : '过程检验单'

    let inspectItems = null

    // 第二步：判断是否存在物料模板
    const mat = await InspectionTemplateMat.findOne({
      // where: { materialId: task.order.bom.materialId },
    })

    if (mat) {
      // 存在物料模板，直接使用
      inspectItems = await InspectionTemplate.findOne({
        where: { id: mat.inspectionTemplateId },
        include: [
          {
            association: 'items',
            attributes: ['id', 'name', 'data'],
            include: [
              {
                association: 'inspectionItem',
                attributes: ['id', 'name'],
              },
            ],
          },
        ],
      })
    } else {
      // 第三步：不存在物料模板，判断是否存在通用模板
      inspectItems = await InspectionTemplate.findOne({
        where: {
          templateType: InspectionTemplateTypeEnum.GENERAL,
          type: inspectionType,
        },
        include: [
          {
            association: 'items',
            attributes: ['id', 'name', 'data'],
            include: [
              {
                association: 'inspectionItem',
                attributes: ['id', 'name'],
              },
            ],
          },
        ],
      })
    }

    if (inspectItems) {
      const form = await InspectionForm.create({
        code: ipqcCode,
        type: inspectItems.type,
        originType: '报工检验单',
        inspectionAt: new Date(moment(date).format('YYYY-MM-DD HH:mm:ss')),
        processId: result.processId,
        productionReportId: result.id,
      })
      const info = await InspectionFormInfo.create({
        inspectionFormId: form.id,
        // count: result.reportQuantity,
        result: 0,
        status: 0,
        goodCount: 0,
        badCount: 0,
        templateId: inspectItems.id,
        ttId: inspectItems.ttId,
        // materialId: task.order.bom.parentMaterial.id,
      })

      const itemsData = inspectItems.dataValues.items.map(item => ({
        name: item.name,
        data: JSON.parse(item.dataValues.data),
      }))

      await InspectionFormItem.create({
        inspectionFormInfoId: info.id,
        data: JSON.stringify(itemsData),
        name: inspectItems.name,
      })
    }
  }

  //创建用户时长和报告用户关系
  private async createReportUserDuration(user, tasks: ProcessPositionTask[], productionReportId?: number) {
    //实际总时长
    // const actualTotalDuration = userDurations.reduce((total, userDuration) => total + userDuration.duration, 0);
    let taskTime = []

    tasks.forEach(async task => {
      const taskDuration = this.calculateTotalDuration(task)
      const days = moment.duration(taskDuration).days().toString().padStart(2, '0')
      console.log(4444444, task.id, `${days}天`, moment.utc(taskDuration).format('HH:mm:ss'))
      taskTime.push({
        taskId: task.id,
        duration: taskDuration,
        time: moment.utc(taskDuration).format('HH:mm:ss'),
        day: `${days}天`,
      })
      const userTaskDuration = await UserTaskDuration.findOne({
        where: {
          userId: user.id,
          processPositionTaskId: task.id,
        },
      })

      if (userTaskDuration) {
        await userTaskDuration.update({ duration: taskDuration, ...(productionReportId && { productionReportId }) })
      } else {
        await UserTaskDuration.create({ userId: user.id, processPositionTaskId: task.id, duration: taskDuration })
      }

      // if (productionReports) {
      //   // 查找与当前工序任务关联的所有生产报告
      //   const relatedReports = productionReports.filter(report => report.processId === task.processId)

      //   if (relatedReports.length > 0) {
      //     relatedReports.forEach(productionReport => {
      //         reportUsers.push({
      //           productionReportId: productionReport.id,
      //           userId: user.id,
      //         })
      //     })
      //   }

      //   await UserTaskDuration.bulkCreate(reportUsers)
      // }
    })

    // 报工
    if (productionReportId) {
      const userTaskDuration = await UserTaskDuration.findAll({ where: { productionReportId } })
      const totalDuration = userTaskDuration.reduce((total, task) => total + task.duration, 0)
      const userDuration = await UserDuration.findOne({ where: { userId: user.id } })
      if (!userDuration) {
        await UserDuration.create({ userId: user.id, duration: totalDuration })
      } else {
        await userDuration.update({ duration: totalDuration })
      }
    }

    return taskTime
  }

  //创建用户时长和报告用户关系
  public async getReportUserDuration(user, tasks: ProcessPositionTask[], productionReportId?: number) {
    //实际总时长
    // const actualTotalDuration = userDurations.reduce((total, userDuration) => total + userDuration.duration, 0);
    let taskTime = []

    tasks.forEach(async task => {
      const taskDuration = this.calculateTotalDuration(task)
      const days = moment.duration(taskDuration).days().toString().padStart(2, '0')
      console.log(4444444, task.id, taskDuration, `${days}天`, moment.utc(taskDuration).format('HH:mm:ss'))
      taskTime.push({
        taskId: task.id,
        duration: taskDuration,
        time: moment.utc(taskDuration).format('HH:mm:ss'),
        day: `${days}天`,
      })

      return taskTime
    })

    // 报工
    if (productionReportId) {
      const userTaskDuration = await UserTaskDuration.findAll({ where: { productionReportId } })
      const totalDuration = userTaskDuration.reduce((total, task) => total + task.duration, 0)
      const userDuration = await UserDuration.findOne({ where: { userId: user.id } })
      if (!userDuration) {
        await UserDuration.create({ userId: user.id, duration: totalDuration })
      } else {
        await userDuration.update({ duration: totalDuration })
      }
    }

    return taskTime
  }

  //创建生产汇报单
  public async produceStore(dto: PickingOutboundDto, transaction: Transaction = null) {
    try {
      // let order = await ProductionOrder.findOne({ where: { id: dto.orderId } })
      // if (!order || !order.fseq) {
      //   console.log('生产订单不存在或没有对应的金蝶行号')
      //   return {
      //     message: '生产订单不存在或没有对应的金蝶行号',
      //     state: false,
      //   }
      // }
      //检测是否为最后一道工序
      if (dto.taskId) {
        const tempTask = await ProcessTask.findOne({ where: { id: dto.taskId + 1, serialId: dto.serialId }, attributes: ['id', 'goodCount'] })
        if (tempTask) {
          console.log('当前工序不是最后一道工序')
          return {
            message: '当前工序不是最后一道工序',
            state: false,
          }
        } else {
          const task = await ProcessTask.findOne({ where: { id: dto.taskId }, attributes: ['id', 'goodCount'] })
          //最后一道工序判断是否结束工单
          //存在事务未提交的情况查询不出新数据
          const goodCount = transaction ? task.goodCount + dto.goodCount : task.goodCount
          // console.log('判断良品数：', goodCount, order.plannedOutput)
          // if (goodCount == order.plannedOutput) {
          //   const actualOutput = order.actualOutput + dto.goodCount
          //   await order.update(
          //     {
          //       actualOutput,
          //       ...(actualOutput == order.plannedOutput
          //         ? {
          //             status: '已结束',
          //             actualEndTime: new Date(),
          //             currentProcess: null,
          //           }
          //         : {}),
          //     },
          //     { transaction }
          //   )
          // }
        }
      }
      // order.FStatus = "已入库"
      // await order.save()
      // 审核对应生产领料单
      //下推生成生产汇报单
      let oData = {
        Ids: [dto.serialId],
        Numbers: '',
        // EntryIds: order.fseq,
        RuleId: '',
        TargetBillTypeId: '',
        TargetOrgId: 0,
        TargetFormId: 'PRD_MORPT',
        IsEnableDefaultRule: 'true',
        IsDraftWhenSaveFail: 'true',
        CustomParams: {},
      }
      //SCP_InStock
      //STK_InStock
      let alod = await KingdeeeService.push('PRD_MO', oData)
      // return alod
      //解析生产汇报单id
      let hbid = alod.Result.ResponseStatus.SuccessEntitys[0].Id
      //查询生产入库单对应明细id
      let data = await KingdeeeService.getList('PRD_MORPT', 'FID,FEntity_FEntryID,FMoBillNo,FMoEntrySeq', `FID=${hbid}`)
      let mx = []
      // const temp = data.find(v => v.FMoEntrySeq == order.fseq)
      // if (!temp)
      //   return {
      //     message: '未找到对应行号',
      //     data: {
      //       data,
      //       // fseq: order.fseq,
      //     },
      //     state: false,
      //   }
      // mx.push({
      //   FEntryID: temp.FEntity_FEntryID,
      //   /*"FStockId": {
      //     "FNumber": orderDetail.warehouse.code
      //   },*/
      //   FFinishQty: dto.goodCount + dto.badCount,
      //   FQuaQty: dto.goodCount,
      //   FFailQty: dto.badCount,
      // })
      //保存对应生产汇报单
      let morptData = {
        Model: {
          FID: hbid,
          'FWorkshipIdH ': {
            FNumber: 'HN08',
          },
          F_ZKSD_BillStatus_83g: 'B',
          FEntity: mx,
        },
      }
      await KingdeeeService.save('PRD_MORPT', morptData)
      let morptSubmit = {
        Ids: `${hbid}`,
      }
      //提交对应生产汇报单
      await KingdeeeService.submit('PRD_MORPT', morptSubmit)
      //审核对应生产汇报单
      await KingdeeeService.audit('PRD_MORPT', morptSubmit)
      // if (order.billType.indexOf('汇报入库') > 0) {
      //   //下推生产汇报单生成对应生产入库单
      //   let morptPush = {
      //     Ids: `${hbid}`,
      //     Numbers: [],
      //     EntryIds: '',
      //     RuleId: '',
      //     TargetBillTypeId: '',
      //     TargetOrgId: 0,
      //     TargetFormId: 'PRD_INSTOCK',
      //     IsEnableDefaultRule: 'true',
      //     IsDraftWhenSaveFail: 'true',
      //     CustomParams: {},
      //   }
      //   let morpt = await KingdeeeService.push('PRD_MORPT', morptPush)
      //   console.log('汇报入库单生成', JSON.stringify(morpt))

      //   //解析生产入库单id
      //   let rkid = morpt.Result.ResponseStatus.SuccessEntitys[0].Id
      //   //保存对应生产入库单，暂无
      //   let rkSubmit = {
      //     Ids: `${rkid}`,
      //     IgnoreInterationFlag: 'true',
      //   }
      //   //提交对应生产入库单
      //   await KingdeeeService.submit('PRD_INSTOCK', rkSubmit)

      //   //审核对应生产入库单
      //   await KingdeeeService.audit('PRD_INSTOCK', rkSubmit)
      // } else if (order.billType.indexOf('生产入库') > 0) {
      //   let productionData = {
      //     Ids: [order.id],
      //     Numbers: '',
      //     // EntryIds: order.fseq,
      //     RuleId: '',
      //     TargetBillTypeId: '',
      //     TargetOrgId: 0,
      //     TargetFormId: 'PRD_INSTOCK',
      //     IsEnableDefaultRule: 'true',
      //     IsDraftWhenSaveFail: 'true',
      //     CustomParams: {},
      //   }
      //   //SCP_InStock
      //   //STK_InStock
      //   let productionLod = await KingdeeeService.push('PRD_MO', productionData)
      //   console.log('生产入库单生成', JSON.stringify(productionLod))
      //   //解析生产入库单id
      //   let { Id: rkid, EntryIds } = productionLod.Result.ResponseStatus.SuccessEntitys[0]
      //   const dataInst = await KingdeeeService.getList(
      //     'PRD_INSTOCK',
      //     'FID,FEntity_FEntryID,FMoBillNo,FMoEntrySeq,FMaterialId.FNumber,FInStockType,FUnitID.FNumber,FBaseUnitId.FNumber,FOwnerTypeId,FStockId.FNumber,FStockStatusId.FNumber',
      //     `FID=${rkid}`
      //   )
      //   const dataOne = dataInst[0]
      //   // console.log("查询信息",JSON.stringify(dataInst))
      //   let morptData1 = {
      //     Model: {
      //       FID: rkid,
      //       FEntity: [
      //         {
      //           FEntryID: dataOne['FEntity_FEntryID'],
      //           FMustQty: dto.goodCount,
      //           FRealQty: dto.goodCount,
      //           FStockStatusId: {
      //             FNumber: dataOne['FStockStatusId.FNumber'],
      //           },
      //           FStockId: {
      //             FNumber: '03',
      //           },
      //           FOwnerTypeId: dataOne.FOwnerTypeId,
      //           FBaseUnitId: { FNumber: dataOne['FBaseUnitId.FNumber'] },
      //           FUnitID: { FNumber: dataOne['FUnitID.FNumber'] },
      //           FInStockType: dataOne.FInStockType,
      //           FMaterialId: { FNumber: dataOne['FMaterialId.FNumber'] },
      //           FMoBillNo: dataOne.FMoBillNo,
      //         },
      //       ],
      //     },
      //   }
      //   // console.log("生产入库单数据",JSON.stringify(morptData1))
      //   const inboundSave = await KingdeeeService.save('PRD_INSTOCK', morptData1)
      //   console.log('生产入库单保存', JSON.stringify(inboundSave))

      //   //保存对应生产入库单，暂无
      //   let rkSubmit = {
      //     Ids: `${rkid}`,
      //     IgnoreInterationFlag: 'true',
      //   }
      //   //提交对应生产入库单
      //   // await KingdeeeService.submit('PRD_INSTOCK', rkSubmit)

      //   //审核对应生产入库单
      //   // await KingdeeeService.audit('PRD_INSTOCK', rkSubmit)
      // }
      return {
        message: '生产汇报单生成成功',
        state: true,
      }
    } catch (e) {
      console.log('生产汇报单生成失败', e)
      return {
        message: e.message,
        state: false,
      }
    }
  }

  //-------------------------

  private generateNextCode(oldCode: string, year, month, day) {
    const lastFourChars = oldCode.length >= 4 ? oldCode.slice(-4) : '0'.repeat(4 - oldCode.length) + oldCode
    const num = parseInt(lastFourChars) + 1
    return `IPQC${year}${month}${day}${num.toString().padStart(4, '0')}`
  }

  // 将时间字符串转换为 Date 对象
  public calculateTotalDuration(task: ProcessPositionTask) {
    const endTime = new Date(task.actualEndTime || new Date())

    // 计算总时间差（毫秒）--- 开始到现在
    let totalDuration = endTime.getTime()

    console.log(JSON.stringify(task.operateLogs))

    // 遍历暂停时间，扣除暂停时间
    if (task.operateLogs) {
      let resumeTime
      let pauseTime
      task.operateLogs.forEach((time, i) => {
        resumeTime = time.resumeTime ? new Date(time.resumeTime) : 0
        pauseTime = time.pauseTime ? new Date(time.pauseTime) : 0
        if (resumeTime) {
          totalDuration -= resumeTime.getTime()
        }
        // 最后如果为暂停则不加
        if (pauseTime && i != task.operateLogs.length - 1) {
          totalDuration += pauseTime.getTime()
        }
      })
    }

    if (!task.operateLogs) throw '数据错误'
    return totalDuration
  }
}
