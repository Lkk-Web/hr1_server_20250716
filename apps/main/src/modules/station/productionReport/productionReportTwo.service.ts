import { Injectable } from '@nestjs/common'
import { ProductionReport } from '@model/production/productionReport.model'
import { Op, Transaction } from 'sequelize'
import { ProductionOrder } from '@model/production/productionOrder.model'
import { ProcessTask } from '@model/production/processTask.model'
import { PerformanceConfig } from '@model/performance/performanceConfig.model'
import { InspectionForm } from '@model/quantity/inspectionForm.model'
import { InspectionTemplateMat } from '@model/quantity/inspectionTemplateMat.model'
// import { InspectionTemplateItem } from '@model/quantity/inspectionTemplateItem.model'
import { PadRegisterDto, PadRegisterUserDto, PickingOutboundDto } from './productionReport.dto'
import { POSITION_TASK_STATUS, PROCESS_TASK_STATUS } from '@common/enum'
import { Aide } from '@library/utils/aide'
import { ReportUserDuration } from '@model/production/reportUserDuration.model'
import { ReportUser } from '@model/production/reportUser.model'
import { InspectionTemplate } from '@model/quantity/inspectionTemplate.model'
import { InspectionFormInfo, InspectionFormItem, TeamUser } from '@model/index'
import { InspectionTemplateTypeEnum } from '@modules/admin/inspectionTemplate/inspectionTemplate.dto'
import { KingdeeeService } from '@library/kingdee'
import moment = require('moment')
import _ = require('lodash')
import { ProcessPositionTask } from '@model/production/processPositionTask.model'

@Injectable()
export class ProductionReportTwoService {
  constructor() {}

  //工序报工
  public async padRegister(dto: PadRegisterDto) {
    // 使用事务保证一致性
    const sequelize = ProcessTask.sequelize
    return await sequelize.transaction(async transaction => {
      // 仅支持工位任务单报工：所有 process 项必须包含 processPositionTaskId
      const positionTaskIds = dto.process.map(v => v.processPositionTaskId)

      // 查询工位任务单
      const positionTasksList = await ProcessPositionTask.findAll({
        where: {
          id: positionTaskIds,
          status: ['待报工'],
          processId: dto.processId,
        },
        attributes: ['id', 'processTaskId', 'userId', 'planCount', 'goodCount', 'badCount', 'reportRatio', 'isInspection'],
        transaction,
      })

      if (positionTasksList.length !== dto.process.length) {
        Aide.throwException(400, '工位任务单状态异常或不存在')
      }

      // 反查工序任务单 ids
      const processTaskIds = Array.from(new Set(positionTasksList.map(pt => pt.processTaskId)))

      // 查询工序任务单（允许 未开始 与 执行中）
      const [tasksList, userCount] = await Promise.all([
        ProcessTask.findAll({
          where: {
            id: processTaskIds,
            status: [PROCESS_TASK_STATUS.running, PROCESS_TASK_STATUS.notStart],
            processId: dto.processId,
          },
          attributes: ['id', 'receptionCount', 'reportQuantity', 'planCount', 'goodCount', 'actualStartTime', 'actualEndTime', 'isInspection', 'serialId'],
          transaction,
        }),
        TeamUser.count({ where: { userId: { [Op.in]: dto.config.map(v => v.userId) }, teamId: dto.teamId }, transaction }),
      ])

      if (tasksList.length === 0) Aide.throwException(400011)
      if (userCount != dto.config.length) Aide.throwException(400012)

      // 验证每条报工的数量与对应工位任务单剩余量
      for (const processDto of dto.process) {
        const positionTask = positionTasksList.find(pt => pt.id === processDto.processPositionTaskId)
        if (!positionTask) {
          Aide.throwException(400, '工位任务单不存在')
        }
        const remainingCount = positionTask.planCount - positionTask.goodCount - positionTask.badCount
        if (processDto.reportQuantity > remainingCount) {
          Aide.throwException(400, '工位任务单报工数量大于可报工数量')
        }
      }

      const productionReports: ProductionReport[] = []
      const date = new Date()
      const formattedDate = moment(date, 'YYYY-MM-DD HH:mm:ss').toDate()

      // 处理报工
      for (let i = 0; i < dto.process.length; i++) {
        const processDto = dto.process[i]
        const positionTask = positionTasksList.find(pt => pt.id === processDto.processPositionTaskId)
        const task = tasksList.find(t => t.id === positionTask.processTaskId)

        // 创建生产报告
        const result = await ProductionReport.create(
          {
            reportDurationHours: 0,
            reportDurationMinutes: 0,
            ironSerial: dto.ironSerial || null,
            goodCount: positionTask.isInspection ? 0 : processDto.reportQuantity,
            badCount: 0,
            startTime: task.actualStartTime || date,
            endTime: date,
            createdUserId: dto.config[0].userId,
            updatedUserId: dto.config[0].userId,
            processPositionTaskId: processDto.processPositionTaskId,
            processId: dto.processId,
            processStatus: PROCESS_TASK_STATUS.finish,
            reportQuantity: processDto.reportQuantity,
            processProgress: '100',
            teamId: dto.teamId,
            productUserId: positionTask.userId,
          },
          { transaction }
        )
        productionReports.push(result)

        // 更新工位任务单状态与数量
        const isPositionTaskEnd = processDto.reportQuantity + positionTask.goodCount + positionTask.badCount >= positionTask.planCount
        await ProcessPositionTask.update(
          {
            goodCount: positionTask.isInspection ? positionTask.goodCount : positionTask.goodCount + processDto.reportQuantity,
            status: isPositionTaskEnd ? POSITION_TASK_STATUS.COMPLETED : POSITION_TASK_STATUS.TO_ASSIGN,
          },
          { where: { id: processDto.processPositionTaskId }, transaction }
        )

        // 更新工序任务单 - 按比例累计
        const currentReportQuantity = Math.floor(processDto.reportQuantity * (positionTask.reportRatio || 1))
        const prevGood = task.goodCount || 0
        const prevReportQty = task.reportQuantity || 0
        const deltaGood = task.isInspection ? 0 : currentReportQuantity
        const newGood = prevGood + deltaGood
        const newReportQty = prevReportQty + currentReportQuantity
        const isTaskEnd = newReportQty >= task.planCount

        await ProcessTask.update(
          {
            goodCount: newGood,
            reportQuantity: newReportQty,
            actualStartTime: task.actualStartTime || formattedDate,
            ...(isTaskEnd ? { status: PROCESS_TASK_STATUS.finish, actualEndTime: formattedDate } : {}),
          },
          { where: { id: positionTask.processTaskId }, transaction }
        )

        // 处理下一道工序接收数
        const nextPop = await ProcessTask.findOne({
          where: { serialId: task.serialId, id: task.id + 1 },
          order: [['id', 'ASC']],
          include: [{ association: 'process', attributes: ['id', 'processName'] }],
          transaction,
        })

        if (nextPop) {
          if (nextPop.status == PROCESS_TASK_STATUS.notStart) {
            await nextPop.update({ status: PROCESS_TASK_STATUS.running }, { transaction })
          }
          if (!task.isInspection && nextPop.id) {
            await ProcessTask.update({ receptionCount: newGood }, { where: { id: nextPop.id }, transaction })
          }
        }

        // 处理订单完成状态（最后一道工序时触发汇报），按比例的 deltaGood
        const allPops = await ProcessTask.findAll({ where: { serialId: task.serialId }, order: [['id', 'ASC']], transaction })
        if (!task.isInspection && allPops[allPops.length - 1].processId === dto.processId) {
          if (!task.isInspection) {
            await this.produceStore(
              {
                serialId: task.serialId,
                goodCount: deltaGood,
                badCount: 0,
                taskId: task.id,
              },
              transaction
            )
          }
        }
      }

      // 创建用户时长和报告用户关系
      await this.createReportUserDuration(dto.config, tasksList, productionReports)
      return true
    })
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
        count: result.reportQuantity,
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
  private async createReportUserDuration(configList: PadRegisterUserDto[], tasks: ProcessTask[], productionReports: ProductionReport[]) {
    const userDurations = await ReportUserDuration.bulkCreate(
      configList.map(v => ({
        userId: v.userId,
        duration: v.duration,
      }))
    )
    //实际总时长
    // const actualTotalDuration = userDurations.reduce((total, userDuration) => total + userDuration.duration, 0);

    const reportUsers: Partial<ReportUser>[] = []
    //预估总时长
    const totalDuration = tasks.reduce((total, task) => total + this.calculateTotalDuration(task), 0)
    tasks.forEach(task => {
      const taskDuration = this.calculateTotalDuration(task)
      const percentage = taskDuration / totalDuration

      // 查找与当前工序任务关联的所有生产报告
      const relatedReports = productionReports.filter(report => report.processId === task.processId)

      if (relatedReports.length > 0) {
        relatedReports.forEach(productionReport => {
          userDurations.forEach(ud => {
            reportUsers.push({
              productionReportId: productionReport.id,
              userDurationId: ud.id,
              duration: Math.floor(ud.duration * percentage), // 按比例分配时长
            })
          })
        })
      }
    })
    console.log(reportUsers)

    await ReportUser.bulkCreate(reportUsers)
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

  public calculateTotalDuration(task: ProcessTask) {
    // 将时间字符串转换为 Date 对象
    const startTime = new Date(task.actualStartTime)
    const endTime = new Date(task.actualEndTime || new Date())

    // 计算总时间差（毫秒）
    let totalDuration = endTime.valueOf() - startTime.valueOf()

    // 遍历暂停时间，扣除已恢复的暂停时间
    if (task.operateLogs) {
      task.operateLogs.forEach(pause => {
        const pauseTime = new Date(pause.pauseTime)
        const resumeTime = pause.resumeTime ? new Date(pause.resumeTime) : null

        if (resumeTime) {
          // 如果已恢复，扣除暂停时间
          totalDuration -= resumeTime.valueOf() - pauseTime.valueOf()
        } else {
          // 如果未恢复，扣除从暂停时间到任务结束的时间
          totalDuration -= endTime.valueOf() - pauseTime.valueOf()
        }
      })
    }
    return totalDuration / 1000
  }
}
