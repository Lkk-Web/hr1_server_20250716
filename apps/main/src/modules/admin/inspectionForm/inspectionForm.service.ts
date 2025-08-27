import { Pagination } from '@common/interface'
import { HttpException, Injectable } from '@nestjs/common'
import { AuditDto, FindPaginationDto, UInspectionFormDto } from './inspectionForm.dto'
import { InspectionForm } from '@model/quantity/inspectionForm.model'
import { FindOptions, Op, Sequelize, Transaction } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { InspectionFormItem } from '@model/quantity/InspectionFormItem.model'
import { InspectionFormInfo } from '@model/quantity/inspectionFormInfo.model'
import { InspectionFormResult } from '@model/quantity/inspectionFormResult.model'
import { Material } from '@model/base/material.model'
import { deleteIdsDto } from '@common/dto'
import { ProductionReport } from '@model/production/productionReport.model'
import { ProcessTask } from '@model/production/processTask.model'
import { PROCESS_TASK_STATUS } from '@common/enum'
import { ProcessTaskDept } from '@model/production/processTaskDept.model'
import { User } from '@model/auth/user'
import { InspectionFormBy } from '@model/quantity/inspectionFormBy.model'
import dayjs = require('dayjs')

@Injectable()
export class InspectionFormService {
  constructor() {}

  public async edit(dto: UInspectionFormDto, id: number) {
    const inspectionForm = await InspectionForm.findOne({ where: { id } })
    if (!inspectionForm) {
      throw new HttpException('数据不存在', 400006)
    }
    if (inspectionForm.status !== '暂存') {
      throw new HttpException('当前单据状态不允许修改', 400006)
    }

    //查询质检人是否存在
    if (dto.inspectorIds) {
      const tempList = await User.count({
        where: {
          id: dto.inspectorIds,
        },
      })
      if (tempList != dto.inspectorIds.length) {
        throw new HttpException('质检人不存在', 400006)
      }
    }

    if (dto.infos) {
      const infos = await InspectionFormInfo.findAll({ where: { inspectionFormId: id }, attributes: ['id'] })
      const formInfoIds = infos.map(v => v.id)
      if (formInfoIds.length) {
        await Promise.all([
          InspectionFormItem.destroy({ where: { inspectionFormInfoId: formInfoIds } }),
          InspectionFormResult.destroy({ where: { inspectionFormInfoId: formInfoIds } }),
          InspectionFormInfo.destroy({ where: { inspectionFormId: id } }),
        ])
      }

      for (const info of dto.infos) {
        const infoTemp = await InspectionFormInfo.create({
          inspectionFormId: id,
          result: info.result,
          status: info.status,
          count: info.count,
          goodCount: info.goodCount,
          badCount: info.badCount,
          materialId: info.materialId,
          templateId: info.templateId,
        })
        await Promise.all([
          info.item?.data
            ? InspectionFormItem.create({
                inspectionFormInfoId: infoTemp.id,
                data: info.item.data,
              })
            : null,
          info.results
            ? InspectionFormResult.bulkCreate(
                info.results.map(result => ({
                  inspectionFormInfoId: infoTemp.id,
                  desc: result.desc,
                  count: result.count,
                  result: result.result,
                  handle: result.handle,
                  isReview: result.isReview,
                  review: result.review,
                  processId: result.processId,
                }))
              )
            : null,
        ])
      }
    }
    inspectionForm.update({ status: '审核中' })
    if (dto.inspectorIds?.length)
      InspectionFormBy.bulkCreate(
        dto.inspectorIds.map(v => ({
          inspectionFormId: id,
          inspectorId: v,
        }))
      )
    return inspectionForm
  }

  public async delete(id: number) {
    // let inspectionForm = await InspectionForm.findOne({ where: { id }, include: [{ all: true }] })
    const infos = await InspectionFormInfo.findAll({ where: { inspectionFormId: id } })
    for (const info of infos) {
      await InspectionFormItem.destroy({ where: { inspectionFormInfoId: info.id } })
      await InspectionFormResult.destroy({ where: { inspectionFormInfoId: info.id } })
    }
    await InspectionFormInfo.destroy({ where: { inspectionFormId: id } })
    const result = await InspectionForm.destroy({
      where: {
        id: id,
      },
    })
    return true
  }

  public async find(id: number) {
    const options: FindOptions = {
      where: { id },
      include: [
        {
          association: 'infos',
          attributes: ['id', 'inspectionFormId', 'count', 'result', 'status', 'goodCount', 'badCount', 'remark', 'ttId'],
          include: [
            {
              association: 'template',
              attributes: ['id', 'name', 'code', 'data'],
            },
            {
              association: 'material',
              attributes: ['id', 'name', 'code', 'spec', 'unit'],
            },
            {
              association: 'item',
              attributes: ['id', 'inspectionFormInfoId', 'data'],
            },
            {
              association: 'results',
              // attributes: ['id', 'inspectionFormInfoId', 'status', 'count', 'result', 'badProcess', 'badProcessStatus']
            },
          ],
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
          association: 'auditor',
          attributes: ['id', 'userName'],
        },
        {
          association: 'inspectors',
          attributes: ['id', 'userName'],
          through: { attributes: [] },
        },
        {
          association: 'process',
          attributes: ['processName'],
        },
      ],
    }
    const result = await InspectionForm.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, pad = false) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      attributes: ['id', 'code', 'type', 'status', 'inspectionAt', 'originCode', 'originType', 'createdAt', 'updatedAt', 'auditedAt', 'remark', 'processId'],
      include: [],
    }
    if (pad) {
      options.include = [
        {
          association: 'process',
          attributes: ['processName'],
        },
        {
          association: 'infos',
          attributes: ['id'],
          include: [
            {
              association: 'material',
              attributes: ['id', 'name', 'code', 'spec', 'unit'],
            },
          ],
        },
      ]
    } else {
      options.include = [
        {
          association: 'createdUser',
          attributes: ['id', 'userName'],
        },
        {
          association: 'updatedUser',
          attributes: ['id', 'userName'],
        },
        {
          association: 'auditor',
          attributes: ['id', 'userName'],
        },
        {
          association: 'inspectors',
          attributes: ['id', 'userName'],
          through: { attributes: [] },
        },
      ]
    }
    if (dto.code) {
      options.where['code'] = {
        [Op.eq]: dto.code,
      }
    }
    if (dto.status) {
      options.where['status'] = {
        [Op.eq]: dto.status,
      }
    }
    if (dto.processId) {
      options.where['processId'] = dto.processId
    }
    if (dto.originCode) {
      options.where['originCode'] = {
        [Op.like]: `%${dto.originCode}%`,
      }
    }
    if (dto.inspectionAt) {
      options.where['inspectionAt'] = {
        [Op.gte]: dayjs(dto.inspectionAt).format('YYYY-MM-DD 00:00:00'),
        [Op.lte]: dayjs(dto.inspectionAt).format('YYYY-MM-DD 23:59:59'),
      }
    }
    if (dto.inspectorName) {
      options['include'][4]['where'] = {
        userName: { [Op.like]: `%${dto.inspectorName}%` },
      }
      options['include'][4]['required'] = true
    }
    const result = await InspectionForm.findPagination<InspectionForm>(options)
    return result
  }

  async audit(dto: AuditDto, user) {
    if (!(user && user.id)) throw new HttpException('用户登录信息异常，请重新登录', 400)
    const date = new Date(dayjs().format('YYYY-MM-DD HH:mm:ss'))
    for (const id of dto.ids) {
      const sequelize = Material.sequelize
      return sequelize.transaction(async transaction => {
        try {
          const form = await this.find(id)
          if (dto.status === '审核') {
            const [, productionReport] = await Promise.all([
              InspectionForm.update(
                { status: '已审核', auditorId: user.id, auditedAt: date, inspectionAt: date },
                {
                  where: { id },
                  transaction,
                }
              ),
              ProductionReport.findOne({
                where: { id: form.productionReportId },
                include: [
                  {
                    association: 'processPositionTask',
                    required: true,
                    include: [
                      {
                        association: 'processTask',
                      },
                    ],
                  },
                  { association: 'order', attributes: [], where: { code: form.originCode } },
                ],
                attributes: ['id', 'processPositionTaskId', 'processId'],
              }),
            ])

            // if (productionReport && form.infos?.length) {
            //   const info = form.infos[0]
            //   await Promise.all([
            //     productionReport.update(
            //       {
            //         goodCount: info.goodCount,
            //         badCount: info.badCount,
            //       },
            //       { transaction }
            //     ),
            //     ProcessTask.update(
            //       {
            //         goodCount: Sequelize.literal(`goodCount+${info.goodCount}`),
            //         badCount: Sequelize.literal(`badCount+${info.badCount}`),
            //       },
            //       {
            //         where: { id: productionReport.processPositionTask?.processTask?.id },
            //         transaction,
            //       }
            //     ),
            //   ])
            //   await Promise.all([
            //     ProcessTask.update(
            //       {
            //         goodCount: Sequelize.literal(`goodCount+${info.goodCount}`),
            //         badCount: Sequelize.literal(`badCount+${info.badCount}`),
            //       },
            //       {
            //         where: { id: productionReport.processPositionTask?.processTask?.id, processId: productionReport.processId },
            //         transaction,
            //       }
            //     ),
            //     //创建生产汇报单
            //     // this.productionReportTwoService.produceStore(
            //     //   {
            //     //     orderId: productionReport.productionOrderId,
            //     //     goodCount: info.goodCount,
            //     //     badCount: info.badCount,
            //     //     taskId: productionReport.taskId,
            //     //   },
            //     //   transaction
            //     // ),
            //     info.goodCount
            //       ? ProcessTask.update(
            //           {
            //             receptionCount: Sequelize.literal(`receptionCount+${info.goodCount}`),
            //           },
            //           { where: { id: (productionReport.processPositionTask?.processTask?.id || 0) + 1 } }
            //         )
            //       : null,
            //   ])

            //   // 工序返工
            //   const handle = {
            //     processId: 0,
            //     workCount: 0,
            //   }
            //   for (let i = 0; i < form.infos.length; i++) {
            //     const info = form.infos[i]
            //     console.log(info)
            //     if (info.results[0].processId) {
            //       handle.processId = info.results[0].processId
            //       handle.workCount = info.results[0].count
            //       break
            //     }
            //   }

            //   //创建工序单
            //   if (handle.processId && handle.workCount) {
            //     await this.createReworkInspectionForm(
            //       productionReport.processPositionTask?.processTask,
            //       handle.workCount,
            //       handle.processId,
            //       productionReport.processPositionTask?.processTask?.serialId,
            //       transaction
            //     )
            //   }
            // }
          } else if (dto.status === '取消审核') {
            await InspectionForm.update(
              { status: '未审核', auditorId: user.id, auditedAt: date },
              {
                where: { id },
                transaction,
              }
            )
            //
            // //修改报工数量
            // await ProductionReport.update({ goodCount: 0, badCount: 0, auditorId: user.id, auditedAt: date, auditStatus: '未审核' }, { where: { id: form.productionReportId }, transaction })
            // // 删除相关绩效
            // if (user.id) {
            // 	let detail = await PerformanceDetailed.findOne({
            // 		where: { productionReportId: form.productionReportId },
            // 		order: [['createdAt', 'DESC']],
            // 		transaction
            // 	})
            // 	if (detail) {
            // 		await detail.destroy()
            // 	}
            // }
          }
        } catch (error) {
          // 如果出现错误，Sequelize 将自动回滚事务
          throw error
        }
      })
    }
  }

  public async batDelete(dto: deleteIdsDto) {
    let success = 0
    let failed = 0
    let errors: Array<string> = []
    for (const id of dto.ids) {
      try {
        const deleteNum = await this.delete(id)
        if (deleteNum) {
          success++
        } else {
          failed++
        }
      } catch (e) {
        errors.push(`删除供应商 ID ${id} 时出错: ${e.message}`)
        failed++
      }
    }
    return { success, failed, errors }
  }

  //创建返工工序单
  public async createReworkInspectionForm(oldTask: ProcessTask, workCount: number, processId: number, serialId, transaction: Transaction) {
    let task = await ProcessTask.create(
      {
        serialId: serialId,
        processId,
        reportRatio: oldTask.reportRatio,
        planCount: workCount,
        workCount,
        isOutsource: oldTask.isOutsource,
        isInspection: oldTask.isInspection,
        status: PROCESS_TASK_STATUS.notStart,
        priority: '无',
        startTime: oldTask.startTime,
        endTime: oldTask.endTime,
      },
      { transaction }
    )
    const [oldDepts, oldPop] = await Promise.all([
      ProcessTaskDept.findAll({ where: { taskId: oldTask.id } }),
      ProcessTask.findOne({
        where: { id: oldTask.id, processId: oldTask.processId },
      }),
    ])

    await Promise.all([
      ProcessTaskDept.bulkCreate(
        oldDepts.map(v => ({ taskId: task.id, deptId: v.deptId })),
        { transaction }
      ),
      ProcessTask.create(
        {
          processId,
          serialId: oldPop.serialId,
          reportRatio: oldPop.reportRatio,
          isReport: oldPop.isReport,
          isInspection: oldPop.isInspection,
          isOutsource: oldPop.isOutsource,
          sort: oldPop.sort,
          planCount: oldPop.planCount,
          status: oldPop.status,
          startTime: oldPop.startTime,
          endTime: oldPop.endTime,
          goodCount: 0,
          badCount: 0,
        },
        { transaction }
      ),
    ])
  }
}
