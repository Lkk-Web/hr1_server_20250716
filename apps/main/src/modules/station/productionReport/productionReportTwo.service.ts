import { Injectable } from '@nestjs/common'
import { Op, Transaction } from 'sequelize'
import { ProcessTask } from '@model/production/processTask.model'
import { InspectionForm } from '@model/quantity/inspectionForm.model'
import { InspectionTemplateMat } from '@model/quantity/inspectionTemplateMat.model'
// import { InspectionTemplateItem } from '@model/quantity/inspectionTemplateItem.model'
import { OpenTaskDto, PadProcessDto, PadRegisterDto, PickingOutboundDto } from './productionReport.dto'
import { LocateStatus, POSITION_TASK_STATUS, PROCESS_TASK_STATUS, ProductSerialStatus, ReworkType, ScrapType, TaskStatus } from '@common/enum'
import { UserDuration } from '@model/production/userDuration.model'
import { UserTaskDuration } from '@model/production/userTaskDuration.model'
import { InspectionTemplate } from '@model/quantity/inspectionTemplate.model'
import {
  InspectionFormInfo,
  InspectionFormItem,
  IronProductSerial,
  Position,
  PositionDetail,
  Process,
  ProcessTaskLog,
  ProductionOrderDetail,
  ProductionOrderTask,
  ProductionOrderTaskOfReport,
  ProductionReport,
  ProductionReportDetail,
  ProductSerial,
} from '@model/index'
import { InspectionTemplateTypeEnum } from '@modules/admin/inspectionTemplate/inspectionTemplate.dto'
import { KingdeeeService } from '@library/kingdee'
import moment = require('moment')
import _ = require('lodash')
import { ProcessPositionTask } from '@model/production/processPositionTask.model'
import { PositionTaskDetail } from '@model/production/positionTaskDetail.model'
import { ProductionOrderService } from '@modules/admin/productionOrder/productionOrder.service'

@Injectable()
export class ProductionReportTwoService {
  constructor(private readonly productionOrderService: ProductionOrderService) {}

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
        const productionOrderTask = await ProductionOrderTask.findOne({ where: { id: processDto.productionOrderTaskId } })
        await productionOrderTask.update({ actualStartTime: new Date() }, { transaction }) // 工单
        // 工位
        const position = await Position.findOne({ where: { processId: dto.processId } })
        const positionDetail = await PositionDetail.findOne({ where: { positionId: position.dataValues.id, userId: user.id } })
        const positionTaskDetail = await PositionTaskDetail.findOne({
          where: { positionDetailId: positionDetail.dataValues.id, productionOrderTaskId: processDto.productionOrderTaskId },
        })

        const allowReportQuantity = positionTaskDetail?.dataValues.allowWorkNum - positionTaskDetail?.dataValues.workNum || 0
        if (allowReportQuantity < processDto.positions.length && taskStatus == TaskStatus.OPEN_TASK)
          throw new Error(`开工数量${processDto.positions.length}大于派工数量${allowReportQuantity}`)

        await positionTaskDetail.update(
          {
            workNum: positionTaskDetail.dataValues.workNum + processDto.positions.length,
          },
          { transaction }
        )
        for (const item of processDto.positions) {
          console.log(3)
          // 工序任务
          const processTask = await ProcessTask.findOne({ where: { serialId: item.serialId, processId: process.parentId } })

          await processTask.update(
            {
              status: taskStatus == TaskStatus.OPEN_TASK ? PROCESS_TASK_STATUS.running : PROCESS_TASK_STATUS.pause,
              actualStartTime: new Date(),
            },
            { transaction }
          )
          console.log(4)
          // 工位任务
          const processPositionTask = await ProcessPositionTask.findOne({
            where: {
              serialId: item.serialId,
              processId: dto.processId,
              status: { [Op.in]: [POSITION_TASK_STATUS.NOT_STARTED, POSITION_TASK_STATUS.IN_PROGRESS, POSITION_TASK_STATUS.PAUSED] },
            },
            include: [{ association: 'operateLogs' }],
          })

          // 上一道子工序
          const preProcessPositionTask = await ProcessPositionTask.findOne({
            where: { serialId: processPositionTask.serialId, id: processPositionTask.prePositionTaskId },
            order: [['id', 'ASC']],
            include: [
              {
                association: 'serial',
              },
            ],
          })
          if (preProcessPositionTask && preProcessPositionTask.dataValues.status != POSITION_TASK_STATUS.COMPLETED) {
            throw new Error(`${preProcessPositionTask.serial.dataValues.serialNumber}上一道子工序未完成，无法开工`)
          }

          if (processPositionTask.status == POSITION_TASK_STATUS.IN_PROGRESS && taskStatus == TaskStatus.OPEN_TASK) throw new Error('当前任务正在进行中，不能重新开工')
          if (processPositionTask.status == POSITION_TASK_STATUS.PAUSED && taskStatus == TaskStatus.PAUSE) throw new Error('当前任务已暂停，不能暂停')
          console.log(5)
          await processPositionTask.update(
            {
              actualStartTime: processPositionTask.dataValues.actualStartTime ?? new Date(),
              status: taskStatus == TaskStatus.OPEN_TASK ? POSITION_TASK_STATUS.IN_PROGRESS : POSITION_TASK_STATUS.PAUSED,
            },
            { transaction }
          )
          taskList.push(processPositionTask)
          // 序列号
          console.log(6)
          await ProductSerial.update(
            { status: taskStatus == TaskStatus.OPEN_TASK ? ProductSerialStatus.IN_PROGRESS : ProductSerialStatus.PAUSED, currentProcessTaskId: processTask.dataValues.id },
            { where: { id: item.serialId }, transaction }
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
      console.log(7)
      const taskTime = await this.createReportUserDuration(user, taskList, undefined, transaction)
      console.log(8)
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
      const productionReport = await ProductionReport.create(
        {
          processId: dto.processId,
          productUserId: user.id,
          teamId: dto.teamId,
          allReportDuration: dto.productionOrderTask.reduce((pre, cur) => pre + cur.positions.reduce((pre, cur) => pre + (cur.duration || 0), 0), 0),
          orderCode: `BG` + moment().format('YYYYMMDDHHmmss'),
        },
        { transaction }
      )
      // 2. 处理报工产生的关联及工序的推进
      // 2.1 处理工单
      for (const processDto of dto.productionOrderTask) {
        const productionOrderTask = await ProductionOrderTask.findOne({ where: { id: processDto.productionOrderTaskId } })
        await ProductionOrderTaskOfReport.create({ productionOrderTaskId: productionOrderTask.dataValues.id, reportId: productionReport.id }, { transaction })
        const process = await Process.findOne({ where: { id: dto.processId } })
        // 2.2 处理工序（工位）
        for (const item of processDto.positions) {
          // 工序任务
          const processTask = await ProcessTask.findOne({ where: { serialId: item.serialId, processId: process.parentId, status: PROCESS_TASK_STATUS.running } })
          // 工位任务
          const processPositionTask = await ProcessPositionTask.findOne({
            where: { serialId: item.serialId, processId: dto.processId, status: POSITION_TASK_STATUS.IN_PROGRESS },
            include: [{ association: 'operateLogs' }],
          })

          if (processPositionTask.dataValues.status != POSITION_TASK_STATUS.IN_PROGRESS) throw new Error('当前序列号不在进行中，无法报工')
          await processPositionTask.update({ status: POSITION_TASK_STATUS.COMPLETED, actualEndTime: new Date(), actualWorkTime: item.duration }, { transaction })

          // 不同工序
          {
            //序列号绑定多个铁芯序列号
            if (process.processName.includes('打合')) {
              const result = await IronProductSerial.findOne({
                where: {
                  serialId: item.serialId,
                },
              })
              if (!result) {
                const ironProductSerial = item.ironSerial.map(v => {
                  return {
                    serialId: item.serialId,
                    ironSerial: v,
                  }
                })
                await IronProductSerial.bulkCreate(ironProductSerial, { transaction })
              }
            }
            // 质检
            if (process.isQC) {
              // 质检工序
              if (item.QCResult) {
                // 良品
                await processTask.update({ goodCount: 1, badCount: 0 }, { transaction })
                await productionReport.update({ allGoodCount: productionReport.allGoodCount + 1 }, { transaction })
                await productionOrderTask.update({ goodCount: productionOrderTask.dataValues.goodCount + 1 }, { transaction })
                await processPositionTask.update({ goodCount: processPositionTask.dataValues.goodCount + 1 }, { transaction })
              } else {
                // 不良品 不良原因
                await processTask.update({ goodCount: 0, badCount: 1 }, { transaction })
                await productionReport.update({ allBadCount: productionReport.allBadCount + 1 }, { transaction })
                await productionOrderTask.update({ badCount: productionOrderTask.dataValues.badCount + 1 }, { transaction })
                await processPositionTask.update({ badCount: processPositionTask.dataValues.badCount + 1, QCReason: item.QCReason }, { transaction })
                // 返工 / 报废
                if (item.scrapType) {
                  if (item.scrapType == ScrapType.SCRAP) {
                    // 报废
                    await this.Scrap(item, productionOrderTask, user, processTask.dataValues.id, transaction)
                  } else if (item.scrapType == ScrapType.REWORK) {
                    // 返工
                    await this.rework(item, productionOrderTask, processTask, dto.processId, user, transaction)
                  }
                } else {
                  throw new Error('不良品必须选择报废或返工')
                }
              }
            }
          }
          await ProductionReportDetail.create(
            {
              productionReportId: productionReport.id,
              processPositionTaskId: processPositionTask.dataValues.id,
              productionOrderTaskId: productionOrderTask.dataValues.id,
              reportQuantity: 1,
              startTime: processPositionTask.dataValues.actualStartTime,
              endTime: new Date(),
            },
            { transaction }
          )
          taskList.push(processPositionTask)

          // 日志
          const logs = await ProcessTaskLog.create(
            {
              processTaskID: processTask.dataValues.id,
              processPositionTaskId: processPositionTask.dataValues.id,
              pauseTime: new Date(),
            },
            { transaction }
          )
          taskList[taskList.length - 1]['operateLogs'].push(logs)

          // 处理下一道工位
          const nextProcessPositionTask = await ProcessPositionTask.findOne({
            where: { serialId: processPositionTask.dataValues.serialId, prePositionTaskId: processPositionTask.dataValues.id },
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

          // 处理下一道工序
          const nextProcessTask = await ProcessTask.findOne({
            where: { serialId: processTask.serialId, preProcessTaskId: processTask.id },
            order: [['id', 'ASC']],
            transaction,
          })

          console.log(8888888, nextProcessTask)

          if (nextProcessTask) {
          } else {
            // 没有下一道工序
            if (processTask.status == PROCESS_TASK_STATUS.finish) {
              // 且当前工序任务已完成
              await ProductSerial.update({ status: ProductSerialStatus.COMPLETED }, { where: { id: item.serialId }, transaction })
            }
          }
        }
      }
      // 3. 创建用户时长和报工关系、工时
      const taskTime = await this.createReportUserDuration(user, taskList, productionReport.id, transaction)

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

  // 报废
  private async Scrap(item: PadProcessDto, productionOrderTask: ProductionOrderTask, user, currentProcessTaskId: number, transaction: Transaction) {
    const { serialId, QCReason } = item

    // 1. 查询当前序列号 及 校验
    const serial = await ProductSerial.findByPk(serialId, {
      include: [{ association: 'productionOrderTask' }],
      transaction,
    })

    if (!serial) {
      throw new Error('序列号不存在')
    }

    // 2. 删除当前工序任务单之后的所有工序任务单和工位任务单
    {
      const subsequentProcessTasks = await ProcessTask.findAll({ where: { serialId: serialId } })

      for (const processTask of subsequentProcessTasks) {
        // 在此之后的工序
        if (processTask.id >= currentProcessTaskId) {
          // 删除关联的工位任务单
          await ProcessPositionTask.destroy({
            where: { processTaskId: processTask.id, status: POSITION_TASK_STATUS.NOT_STARTED },
            transaction,
          })
          // 删除后续工序任务单
          if (processTask.id != currentProcessTaskId) {
            await ProcessTask.destroy({
              where: {
                id: processTask.id,
              },
            })
          }
        }
        // 在此之前的工序
        if (processTask.id <= currentProcessTaskId) {
          // 更新之前的为已报废
          await ProcessPositionTask.update({ status: POSITION_TASK_STATUS.SCRAPPED }, { where: { processTaskId: processTask.id }, transaction }) //先删再改状态
          await ProcessTask.update({ status: PROCESS_TASK_STATUS.scrapped, actualEndTime: new Date() }, { where: { id: processTask.id }, transaction })
        }
      }
    }

    // 3. 将当前序列号状态标记为已报废
    await serial.update({ status: ProductSerialStatus.SCRAPPED, remark: QCReason || '报废' }, { transaction })

    // 4. 创建新序列号并重建工序和工位任务链
    {
      const productionOrderDetail = await ProductionOrderDetail.findOne({
        where: { id: productionOrderTask.productionOrderDetailId },
        include: [
          {
            association: 'material',
            include: [
              {
                association: 'boms',
                where: { materialId: { [Op.col]: 'ProductionOrderDetail.materialId' } },
                required: false,
              },
              {
                association: 'processRoute',
                include: [
                  {
                    association: 'processRouteList',
                    include: [
                      {
                        association: 'process',
                        include: [
                          {
                            association: 'children',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        transaction,
      })
      const processRoute = productionOrderDetail.material.processRoute?.processRouteList //工艺路线
      const productSerials = await this.productionOrderService.productSerials(productionOrderDetail, productionOrderTask, user, 1, transaction)
      // 4.1. 为新序列号创建工序任务单和工位任务单
      await this.productionOrderService.splitOrderTask(productSerials, productionOrderTask, processRoute, transaction)
    }

    // 5. 可派工数增加
    await productionOrderTask.update({ scrapQuantity: productionOrderTask.scrapQuantity + 1, locateStatus: LocateStatus.PART_LOCATED }, { transaction })
  }

  // 返工
  private async rework(item: PadProcessDto, productionOrderTask: ProductionOrderTask, processTask: ProcessTask, currentProcessId: number, user, transaction: Transaction) {
    const { serialId, reworkProcessId, reworkType } = item

    await ProductSerial.update({ isRework: true }, { where: { id: item.serialId }, transaction })

    if (!reworkProcessId) throw new Error('返工工序ID不能为空')

    if (!reworkType) throw new Error('返工类型不能为空')

    const productionOrderDetail = await ProductionOrderDetail.findOne({
      where: { id: productionOrderTask.productionOrderDetailId },
      include: [
        {
          association: 'material',
          include: [
            {
              association: 'processRoute',
              include: [
                {
                  association: 'processRouteList',
                  include: [
                    {
                      association: 'process',
                      include: [
                        {
                          association: 'children',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      transaction,
    })
    const processRoute = productionOrderDetail.material.processRoute?.processRouteList // 工艺路线

    if (processRoute && processRoute.length > 0) {
      // 指定返工：只重置当前返工工位任务单和质检 / 链表的节点添加
      if (reworkType === ReworkType.SINGLE) {
        const [currentProcessPositionTask, reworkProcessPositionTask] = await Promise.all([
          ProcessPositionTask.findOne({ where: { serialId: serialId, processId: currentProcessId } }),
          ProcessPositionTask.findOne({ where: { serialId: serialId, processId: reworkProcessId } }),
        ])

        if (!reworkProcessPositionTask || !currentProcessPositionTask) throw new Error('返工工位任务单不存在')

        await currentProcessPositionTask.update({ status: POSITION_TASK_STATUS.REWORK }, { transaction })
        await reworkProcessPositionTask.update({ status: POSITION_TASK_STATUS.REWORK }, { transaction })

        const newCurrentProcessPositionTask = await ProcessPositionTask.create(
          {
            serialId: serialId,
            productionOrderTaskId: productionOrderTask.id,
            processTaskId: currentProcessPositionTask.dataValues.processTaskId,
            prePositionTaskId: currentProcessPositionTask.dataValues.prePositionTaskId,
            reportRatio: currentProcessPositionTask.dataValues.reportRatio,
            processId: currentProcessPositionTask.dataValues.processId,
            planCount: currentProcessPositionTask.dataValues.planCount,
            status: POSITION_TASK_STATUS.NOT_STARTED,
            isOutsource: currentProcessPositionTask.dataValues.isOutsource,
            isInspection: currentProcessPositionTask.dataValues.isInspection,
          },
          { transaction }
        )
        const newReworkProcessPositionTask = await ProcessPositionTask.create(
          {
            serialId: serialId,
            productionOrderTaskId: productionOrderTask.id,
            processTaskId: reworkProcessPositionTask.dataValues.processTaskId,
            prePositionTaskId: reworkProcessPositionTask.dataValues.prePositionTaskId,
            reportRatio: reworkProcessPositionTask.dataValues.reportRatio,
            processId: reworkProcessPositionTask.dataValues.processId,
            planCount: reworkProcessPositionTask.dataValues.planCount,
            status: POSITION_TASK_STATUS.NOT_STARTED,
            isOutsource: reworkProcessPositionTask.dataValues.isOutsource,
            isInspection: reworkProcessPositionTask.dataValues.isInspection,
          },
          { transaction }
        )
        // 更新下个节点的prePositionTaskId为新节点
        await ProcessPositionTask.update(
          { prePositionTaskId: newCurrentProcessPositionTask.id },
          { where: { serialId: serialId, prePositionTaskId: currentProcessPositionTask.dataValues.id }, transaction }
        )
        await ProcessPositionTask.update(
          { prePositionTaskId: newReworkProcessPositionTask.id },
          { where: { serialId: serialId, prePositionTaskId: reworkProcessPositionTask.dataValues.id }, transaction }
        )

        // 增加可开工数
        const position = await Position.findAll({ where: { processId: [currentProcessId, reworkProcessId] } })
        const positionDetail = await PositionDetail.findAll({ where: { positionId: position.map(item => item.dataValues.id), userId: user.id } })
        const positionTaskDetail = await PositionTaskDetail.findAll({
          where: { positionDetailId: positionDetail.map(item => item.dataValues.id), productionOrderTaskId: productionOrderTask.id },
        })

        await Promise.all(
          positionTaskDetail.map(async item => {
            await item.update({ allowWorkNum: item.dataValues.allowWorkNum + 1 }, { transaction })
          })
        )
      }

      // 顺序返工：重置当前返工到质检工位 / 链表的节点添加
      if (reworkType === ReworkType.ALL) {
        // 找到返工工序在工艺路线中的位置
        const parentProcess = await Process.findOne({ where: { id: processTask.dataValues.processId } })

        const positonRoute = processRoute.find(route => route.processId === parentProcess.dataValues.id)
        const reworkProcessIndex = positonRoute.process.children.findIndex(route => route.id === reworkProcessId)
        const currentProcessIndex = positonRoute.process.children.findIndex(route => route.id === currentProcessId)

        // 从返工工序的下一个工序开始重新创建任务单
        const remainingProcesses = positonRoute.process.children.slice(reworkProcessIndex, currentProcessIndex + 1)
        let index = 0
        let prePositionTaskId = null

        for (const process of remainingProcesses) {
          // 找到返工到已完工的工位任务单
          const reworkProcessPositionTask = await ProcessPositionTask.findOne({
            where: {
              serialId: serialId,
              processId: process.id,
              status: POSITION_TASK_STATUS.COMPLETED,
            },
            transaction,
          })
          if (!reworkProcessPositionTask) throw new Error('返工工位任务单不存在')

          await reworkProcessPositionTask.update({ status: POSITION_TASK_STATUS.REWORK }, { transaction })
          // 增加可开工数
          const position = await Position.findOne({ where: { processId: process.id } })
          const positionDetail = await PositionDetail.findOne({ where: { positionId: position.dataValues.id, userId: user.id } })
          const positionTaskDetail = await PositionTaskDetail.findOne({
            where: { positionDetailId: positionDetail.dataValues.id, productionOrderTaskId: productionOrderTask.id },
          })

          await positionTaskDetail.update({ allowWorkNum: positionTaskDetail.dataValues.allowWorkNum + 1 }, { transaction })

          // 第一个返工的工序指向返工的前一个工序
          if (!prePositionTaskId) {
            prePositionTaskId = reworkProcessPositionTask.dataValues.prePositionTaskId
          }

          const newProcessPositionTask = await ProcessPositionTask.create(
            {
              serialId: serialId,
              productionOrderTaskId: productionOrderTask.id,
              processTaskId: reworkProcessPositionTask.dataValues.processTaskId,
              prePositionTaskId: prePositionTaskId,
              reportRatio: reworkProcessPositionTask.dataValues.reportRatio,
              processId: reworkProcessPositionTask.dataValues.processId,
              planCount: reworkProcessPositionTask.dataValues.planCount,
              status: POSITION_TASK_STATUS.NOT_STARTED,
              isOutsource: reworkProcessPositionTask.dataValues.isOutsource,
              isInspection: reworkProcessPositionTask.dataValues.isInspection,
            },
            { transaction }
          )

          prePositionTaskId = newProcessPositionTask.id // 新创建的工位
          index += 1 // 索引 + 1

          if (index == remainingProcesses.length) {
            // 将返工的后一个工位指向最后一个工位
            await ProcessPositionTask.update(
              { prePositionTaskId: newProcessPositionTask.id },
              { where: { serialId: serialId, processId: process.id + 1, status: POSITION_TASK_STATUS.NOT_STARTED }, transaction }
            )
          }
        }
      }
    }

    await productionOrderTask.update({ reworkQuantity: productionOrderTask.reworkQuantity + 1 }, { transaction })
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

  // 创建用户时长和报告用户关系
  private async createReportUserDuration(user, tasks: ProcessPositionTask[], productionReportId?: number, transaction?: Transaction) {
    //实际总时长
    // const actualTotalDuration = userDurations.reduce((total, userDuration) => total + userDuration.duration, 0);
    let taskTime = []

    // 性能优化：批量查询现有的 UserTaskDuration 记录
    const taskIds = tasks.map(task => task.id)
    const existingUserTaskDurations = await UserTaskDuration.findAll({
      where: {
        userId: user.id,
        processPositionTaskId: { [Op.in]: taskIds },
      },
      transaction,
    })

    // 创建一个 Map 用于快速查找现有记录
    const existingDurationsMap = new Map()
    existingUserTaskDurations.forEach(duration => {
      existingDurationsMap.set(duration.processPositionTaskId, duration)
    })

    // 准备批量操作的数据
    const updatePromises = []
    const createData = []

    // 修复性能问题：使用 for...of 替代 forEach 来确保异步操作按顺序执行
    // forEach 不会等待异步操作完成，导致所有数据库操作并发执行，可能造成数据库连接池耗尽和性能问题
    for (const task of tasks) {
      const taskDuration = this.calculateTotalDuration(task)
      const days = moment.duration(taskDuration).days().toString().padStart(2, '0')
      console.log(4444444, task.id, `${days}天`, moment.utc(taskDuration).format('HH:mm:ss'))
      taskTime.push({
        taskId: task.id,
        duration: taskDuration,
        time: moment.utc(taskDuration).format('HH:mm:ss'),
        day: `${days}天`,
      })

      const existingDuration = existingDurationsMap.get(task.id)
      if (existingDuration) {
        // 准备更新操作
        updatePromises.push(existingDuration.update({ duration: taskDuration, ...(productionReportId && { productionReportId }) }, { transaction }))
      } else {
        // 准备创建操作
        createData.push({
          userId: user.id,
          processPositionTaskId: task.id,
          duration: taskDuration,
          ...(productionReportId && { productionReportId }),
        })
      }
    }

    // 批量执行更新和创建操作
    await Promise.all(updatePromises)

    if (createData.length > 0) {
      try {
        const result = await UserTaskDuration.bulkCreate(createData, { transaction })
        console.log('批量创建完成，创建结果数量:', result.length)
      } catch (error) {
        throw error
      }
    }

    // 报工
    if (productionReportId) {
      const userTaskDuration = await UserTaskDuration.findAll({ where: { productionReportId }, transaction })
      const totalDuration = userTaskDuration.reduce((total, task) => total + task.duration, 0)
      const userDuration = await UserDuration.findOne({ where: { userId: user.id }, transaction })
      if (!userDuration) {
        await UserDuration.create({ userId: user.id, duration: totalDuration }, { transaction })
      } else {
        await userDuration.update({ duration: totalDuration }, { transaction })
      }
    }

    return taskTime
  }

  // 获取用户时长和报告用户关系
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
    })

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

  // 计算任务总时长（扣除暂停时间） TODO 待优化
  public calculateTotalDuration(task: ProcessPositionTask) {
    if (!task.operateLogs || task.operateLogs.length === 0) {
      throw '数据错误：缺少操作日志'
    }

    const endTime = new Date(task.actualEndTime || new Date())
    const startTime = new Date(task.actualStartTime)

    // 计算总时间差（毫秒）--- 从开始到结束
    let totalDuration = endTime.getTime() - startTime.getTime()

    // 分离暂停和恢复记录
    const pauseRecords = task.operateLogs.filter(log => log.pauseTime)
    const resumeRecords = task.operateLogs.filter(log => log.resumeTime)

    console.log('暂停记录数:', pauseRecords.length)
    console.log('恢复记录数:', resumeRecords.length)

    // 计算所有暂停时长并扣除
    let totalPauseDuration = 0

    // 按时间排序暂停记录
    pauseRecords.sort((a, b) => new Date(a.pauseTime).getTime() - new Date(b.pauseTime).getTime())
    resumeRecords.sort((a, b) => new Date(a.resumeTime).getTime() - new Date(b.resumeTime).getTime())

    for (let i = 0; i < pauseRecords.length; i++) {
      const pauseTime = new Date(pauseRecords[i].pauseTime)

      if (i < resumeRecords.length) {
        // 有对应的恢复记录
        const resumeTime = new Date(resumeRecords[i].resumeTime)
        const pauseDuration = resumeTime.getTime() - pauseTime.getTime()
        totalPauseDuration += pauseDuration
      } else {
        // 没有对应的恢复记录，说明当前仍在暂停中
        const pauseDuration = endTime.getTime() - pauseTime.getTime()
        totalPauseDuration += pauseDuration
      }
    }

    // 总时长 = 结束时间 - 开始时间 - 暂停时长
    const actualDuration = totalDuration - totalPauseDuration

    console.log('总时间:', totalDuration, 'ms')
    console.log('暂停时间:', totalPauseDuration, 'ms')
    console.log('实际工作时间:', actualDuration, 'ms')

    return Math.max(0, actualDuration) // 确保不返回负数
  }
}
