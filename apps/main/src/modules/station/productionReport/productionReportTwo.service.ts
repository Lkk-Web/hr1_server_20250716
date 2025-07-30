import { Injectable } from '@nestjs/common'
import { ProductionReport } from '@model/production/productionReport.model'
import { Op, Transaction } from 'sequelize'
import { ProductionOrder } from '@model/production/productionOrder.model'
import { POP } from '@model/production/POP.model'
import { ProcessTask } from '@model/production/processTask.model'
import { PerformanceConfig } from '@model/performance/performanceConfig.model'
import { InspectionForm } from '@model/quantity/inspectionForm.model'
import { InspectionTemplateMat } from '@model/quantity/inspectionTemplateMat.model'
// import { InspectionTemplateItem } from '@model/quantity/inspectionTemplateItem.model'
import { PadRegisterDto, PadRegisterUserDto, PickingOutboundDto } from './productionReport.dto'
import { PROCESS_TASK_STATUS } from '@common/enum'
import { Aide } from '@library/utils/aide'
import { ReportUserDuration } from '@model/production/reportUserDuration.model'
import { ReportUser } from '@model/production/reportUser.model'
import { InspectionTemplate } from '@model/quantity/inspectionTemplate.model'
import { InspectionFormInfo, InspectionFormItem, TeamUser } from '@model/index'
import { InspectionTemplateTypeEnum } from '@modules/admin/inspectionTemplate/inspectionTemplate.dto'
import { KingdeeeService } from '@library/kingdee'
import moment = require('moment')
import _ = require('lodash')

@Injectable()
export class ProductionReportTwoService {
  constructor() {}

  //工序报工
  public async padRegister(dto: PadRegisterDto, processId: number, teamId: number) {
    // 合并用户和任务查询
    const ids = dto.process.map(v => v.id)
    const [tasksList, userCount] = await Promise.all([
      ProcessTask.findAll({
        where: { id: ids, status: PROCESS_TASK_STATUS.running, processId },
        attributes: ['id', 'receptionCount', 'reportQuantity'],
      }),
      TeamUser.count({ where: { userId: dto.config.map(v => v.userId), teamId } }),
    ])

    if (tasksList.length != dto.process.length) Aide.throwException(400011)
    if (userCount != dto.config.length) Aide.throwException(400012)
    //报工数量不能大于接收数量
    tasksList.forEach(task => {
      const temp = dto.process.find(v => v.id === task.id)
      //剩余可报工数
      const receptionCount = task.receptionCount - task.reportQuantity
      if (temp.reportQuantity > receptionCount) Aide.throwException(400, '报工数量大于可报工数量')
    })
    // 获取任务及相关信息
    const tasks = await ProcessTask.findAll({
      where: { id: ids },
      include: [
        {
          association: 'order',
          attributes: ['id', 'actualOutput', 'code'],
          include: [
            {
              association: 'bom',
              attributes: ['id', 'materialId'],
              include: [{ association: 'parentMaterial', attributes: ['id', 'unit'] }],
            },
          ],
        },
        { association: 'operateLogs', attributes: ['pauseTime', 'resumeTime'] },
      ],
      attributes: ['id', 'isInspection', 'productionOrderId', 'goodCount', 'badCount', 'actualStartTime', 'planCount', 'receptionCount', 'reportQuantity'],
    })

    // 处理质检任务
    const inspectionTasks = tasks.filter(task => task.isInspection)
    if (inspectionTasks.length) {
      // 检查每个质检任务是否有对应的模板
      for (const task of inspectionTasks) {
        // 第一步：判断工序类型
        const nextTask = await ProcessTask.findOne({
          where: {
            id: task.id + 1,
            productionOrderId: task.productionOrderId,
          },
          attributes: ['id'],
        })
        const isLastProcess = !nextTask
        const inspectionType = isLastProcess ? '成品检验单' : '过程检验单'

        // 第二步：判断是否存在物料模板
        const mat = await InspectionTemplateMat.findOne({
          where: { materialId: task.order.dataValues.bom.materialId },
        })

        if (!mat) {
          // 第三步：不存在物料模板，判断是否存在通用模板
          const generalTemplate = await InspectionTemplate.findOne({
            where: {
              templateType: InspectionTemplateTypeEnum.GENERAL,
              type: inspectionType,
            },
            attributes: ['id'],
          })

          if (!generalTemplate) {
            return {
              message: `物料未配置检验模板且不存在${inspectionType}通用模板`,
              data: [task.order.dataValues.bom.materialId],
            }
          }
        }
      }
    }

    // 获取配置信息
    const configs = await PerformanceConfig.findAll({
      where: {
        materialId: tasks.map(item => item.order.bom.materialId),
        processId,
      },
    })

    const productionReports: ProductionReport[] = []
    const date = new Date()
    const formattedDate = moment(date, 'YYYY-MM-DD HH:mm:ss').toDate()

    // 并行处理任务
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]
      const temp = dto.process.find(v => v.id === task.id)

      const config = configs.find(item => item.materialId === task.order.bom.materialId)

      // 创建生产报告
      const result = await ProductionReport.create({
        reportDurationHours: 0,
        reportDurationMinutes: 0,
        unit: task.order.bom.parentMaterial.unit,
        goodCount: task.isInspection ? 0 : temp.reportQuantity,
        badCount: 0,
        startTime: task.actualStartTime || date,
        endTime: date,
        accountingType: config ? config.pricingMethod : '计时',
        goodCountPrice: config ? config.goodCountPrice : 0,
        badCountPrice: config ? config.badCountPrice : 0,
        taskId: task.id,
        processId,
        productionOrderId: task.productionOrderId,
        processStatus: PROCESS_TASK_STATUS.finish,
        reportQuantity: temp.reportQuantity,
        processProgress: '100',
        teamId,
      })
      productionReports.push(result)
      //判断当前工序是否结束
      const isEnd = temp.reportQuantity + task.reportQuantity >= task.planCount

      // 更新POP
      const pop = await POP.findOne({ where: { processTaskId: task.id } })
      await pop.update({
        goodCount: task.isInspection ? pop.goodCount : pop.goodCount + temp.reportQuantity,
        reportQuantity: pop.reportQuantity + temp.reportQuantity,
        actualStartTime: pop.actualStartTime || formattedDate,
        ...(isEnd ? { status: '已结束', actualEndTime: formattedDate } : {}),
      })

      // 处理下一道工序
      const [nextPop, allPops] = await Promise.all([
        POP.findOne({
          where: { productionOrderId: task.productionOrderId, id: pop.id + 1 },
          order: [['id', 'ASC']],
          include: [{ association: 'process', attributes: ['id', 'processName'] }],
        }),
        POP.findAll({
          where: { productionOrderId: task.productionOrderId },
          order: [['id', 'ASC']],
        }),
      ])

      if (nextPop) {
        if (nextPop.status == '未开始') {
          await nextPop.update({ status: '执行中' })
          await ProductionOrder.update(
            { currentProcess: nextPop.dataValues.process.processName },
            {
              where: { id: task.productionOrderId },
            }
          )
        }
        //更新接收数
        if (!task.isInspection && nextPop.processTaskId)
          await ProcessTask.update(
            {
              receptionCount: temp.reportQuantity + task.goodCount,
            },
            { where: { id: nextPop.processTaskId } }
          )
      }

      // 处理订单完成状态
      if (!task.isInspection && allPops[allPops.length - 1].dataValues.processId === processId) {
        if (!task.isInspection) {
          await task.order.update({
            actualOutput: task.order.actualOutput + temp.reportQuantity,
          })
          await this.produceStore({
            orderId: task.productionOrderId,
            goodCount: temp.reportQuantity,
            badCount: 0,
          })
        }
      }
      await task.update({
        goodCount: task.isInspection ? task.goodCount : temp.reportQuantity + task.goodCount,
        badCount: task.badCount || 0,
        reportQuantity: temp.reportQuantity + task.reportQuantity,
        ...(isEnd ? { status: '已结束', actualEndTime: formattedDate } : {}),
      })

      // 处理质检
      if (task.isInspection) {
        await this.handleInspection(task, result, date)
      }
    }

    // 创建用户时长和报告用户关系
    await this.createReportUserDuration(dto.config, tasks, productionReports)
    return true
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
        productionOrderId: task.productionOrderId,
      },
      attributes: ['id'],
    })
    const isLastProcess = !nextTask // 没有下一道工序则为末道工序
    const inspectionType = isLastProcess ? '成品检验单' : '过程检验单'

    let inspectItems = null

    // 第二步：判断是否存在物料模板
    const mat = await InspectionTemplateMat.findOne({
      where: { materialId: task.order.bom.materialId },
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
        originCode: task.order.kingdeeCode,
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
        materialId: task.order.bom.parentMaterial.id,
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
      const productionReport = productionReports.find(v => v.taskId === task.id)

      if (productionReport) {
        userDurations.forEach(ud => {
          reportUsers.push({
            productionReportId: productionReport.id,
            userDurationId: ud.id,
            duration: Math.floor(ud.duration * percentage), // 按比例分配时长
          })
        })
      }
    })

    await ReportUser.bulkCreate(reportUsers)
  }

  //创建生产汇报单
  public async produceStore(dto: PickingOutboundDto, transaction: Transaction = null) {
    try {
      let order = await ProductionOrder.findOne({ where: { id: dto.orderId } })
      // if (!order || !order.fseq) {
      //   console.log('生产订单不存在或没有对应的金蝶行号')
      //   return {
      //     message: '生产订单不存在或没有对应的金蝶行号',
      //     state: false,
      //   }
      // }
      //检测是否为最后一道工序
      if (dto.taskId) {
        const tempTask = await ProcessTask.findOne({ where: { id: dto.taskId + 1, productionOrderId: dto.orderId }, attributes: ['id', 'goodCount'] })
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
        Ids: [order.id],
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
      if (order.billType.indexOf('汇报入库') > 0) {
        //下推生产汇报单生成对应生产入库单
        let morptPush = {
          Ids: `${hbid}`,
          Numbers: [],
          EntryIds: '',
          RuleId: '',
          TargetBillTypeId: '',
          TargetOrgId: 0,
          TargetFormId: 'PRD_INSTOCK',
          IsEnableDefaultRule: 'true',
          IsDraftWhenSaveFail: 'true',
          CustomParams: {},
        }
        let morpt = await KingdeeeService.push('PRD_MORPT', morptPush)
        console.log('汇报入库单生成', JSON.stringify(morpt))

        //解析生产入库单id
        let rkid = morpt.Result.ResponseStatus.SuccessEntitys[0].Id
        //保存对应生产入库单，暂无
        let rkSubmit = {
          Ids: `${rkid}`,
          IgnoreInterationFlag: 'true',
        }
        //提交对应生产入库单
        await KingdeeeService.submit('PRD_INSTOCK', rkSubmit)

        //审核对应生产入库单
        await KingdeeeService.audit('PRD_INSTOCK', rkSubmit)
      } else if (order.billType.indexOf('生产入库') > 0) {
        let productionData = {
          Ids: [order.id],
          Numbers: '',
          // EntryIds: order.fseq,
          RuleId: '',
          TargetBillTypeId: '',
          TargetOrgId: 0,
          TargetFormId: 'PRD_INSTOCK',
          IsEnableDefaultRule: 'true',
          IsDraftWhenSaveFail: 'true',
          CustomParams: {},
        }
        //SCP_InStock
        //STK_InStock
        let productionLod = await KingdeeeService.push('PRD_MO', productionData)
        console.log('生产入库单生成', JSON.stringify(productionLod))
        //解析生产入库单id
        let { Id: rkid, EntryIds } = productionLod.Result.ResponseStatus.SuccessEntitys[0]
        const dataInst = await KingdeeeService.getList(
          'PRD_INSTOCK',
          'FID,FEntity_FEntryID,FMoBillNo,FMoEntrySeq,FMaterialId.FNumber,FInStockType,FUnitID.FNumber,FBaseUnitId.FNumber,FOwnerTypeId,FStockId.FNumber,FStockStatusId.FNumber',
          `FID=${rkid}`
        )
        const dataOne = dataInst[0]
        // console.log("查询信息",JSON.stringify(dataInst))
        let morptData1 = {
          Model: {
            FID: rkid,
            FEntity: [
              {
                FEntryID: dataOne['FEntity_FEntryID'],
                FMustQty: dto.goodCount,
                FRealQty: dto.goodCount,
                FStockStatusId: {
                  FNumber: dataOne['FStockStatusId.FNumber'],
                },
                FStockId: {
                  FNumber: '03',
                },
                FOwnerTypeId: dataOne.FOwnerTypeId,
                FBaseUnitId: { FNumber: dataOne['FBaseUnitId.FNumber'] },
                FUnitID: { FNumber: dataOne['FUnitID.FNumber'] },
                FInStockType: dataOne.FInStockType,
                FMaterialId: { FNumber: dataOne['FMaterialId.FNumber'] },
                FMoBillNo: dataOne.FMoBillNo,
              },
            ],
          },
        }
        // console.log("生产入库单数据",JSON.stringify(morptData1))
        const inboundSave = await KingdeeeService.save('PRD_INSTOCK', morptData1)
        console.log('生产入库单保存', JSON.stringify(inboundSave))

        //保存对应生产入库单，暂无
        let rkSubmit = {
          Ids: `${rkid}`,
          IgnoreInterationFlag: 'true',
        }
        //提交对应生产入库单
        // await KingdeeeService.submit('PRD_INSTOCK', rkSubmit)

        //审核对应生产入库单
        // await KingdeeeService.audit('PRD_INSTOCK', rkSubmit)
      }
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
    return totalDuration / 1000
  }
}
