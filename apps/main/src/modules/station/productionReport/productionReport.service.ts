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
import { Material, Position, PositionDetail, Process, ProductionOrderTask, SOP, SOParameter, TrendsTemplate } from '@model/index'
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

  public async find(id: number, query) {
    const { materialId } = query
    let bom = {}

    const result = await SOP.findOne({
      where: { processId: id },
      include: [
        {
          association: 'materials',
          where: {
            id: materialId,
          },
          through: {},
        },
        {
          association: 'fileList',
          through: {},
        },
        {
          association: 'parameterList',
          through: {},
        },
      ],
    })

    if (materialId) {
      bom = await Material.findOne({ where: { id: materialId }, include: [{ association: 'boms', include: [{ association: 'bomDetails' }] }] })
    }

    const parameters = result?.parameterList || []

    return {
      result,
      bom,
      parameters,
    }
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'productionOrderTask',
          attributes: ['id', 'orderCode', 'splitQuantity', 'goodCount', 'badCount'],
          required: false,
          through: { attributes: [] },
          where: {},
          include: [
            {
              association: 'productionReportDetails',
              required: false,
              include: [
                {
                  association: 'processPositionTask',
                  include: [{ association: 'serial' }],
                },
              ],
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
          association: 'team',
          attributes: ['id', 'name'],
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
          association: 'processLocates',
          attributes: ['id'],
          include: [
            {
              association: 'processLocateDetails',
              where: { userId: user.id },
            },
          ],
        },
        {
          association: 'positionTaskDetails',
          required: true,
          include: [
            {
              association: 'positionDetail',
              attributes: ['id', 'positionId', 'userId'],
              where: {
                userId: user.id,
              },
              required: false,
              include: [
                {
                  association: 'position',
                  required: false,
                  where: {
                    processId: dto.positioProcessId,
                  },
                },
              ],
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
    } else {
      processPositionTaskWhere['status'] = {
        [Op.notIn]: [POSITION_TASK_STATUS.REWORK],
      }
    }

    if (dto.status == POSITION_TASK_STATUS.IN_PROGRESS) {
      processPositionTaskWhere['status'] = {
        [Op.in]: [POSITION_TASK_STATUS.IN_PROGRESS, POSITION_TASK_STATUS.PAUSED],
      }
    }

    const result = await Paging.diyPaging(ProductionOrderTask, pagination, options)

    result.data = result.data.map(order => {
      const plainOrder = order.get({ plain: true }) // 转换成普通对象、避免循环引用Sequlize
      return {
        ...plainOrder,
        positionTaskDetails: plainOrder.positionTaskDetails.filter(d => d.positionDetail && d.positionDetail.position !== null),
      }
    })

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

  public async audit(dto: auditDto, user, loadModel) {
    await ProductionReport.update({ auditStatus: dto.status }, { where: { id: dto.ids } })

    return `${dto.status}成功`
    if (dto.ids != undefined) {
      for (const id of dto.ids) {
        const report = await ProductionReport.findOne({
          where: { id },
          include: [
            {
              association: 'processPositionTask',
              include: [
                {
                  association: 'processTask',
                  attributes: ['id', 'serialId'],
                },
              ],
            },
          ],
        })
        // if (report) {
        //   const date: Date = new Date()
        //   const formattedDate = moment(date, 'YYYY-MM-DD HH:mm:ss').toDate()
        //   await ProductionReport.update(
        //     {
        //       auditorId: user.id,
        //       auditStatus: dto.status,
        //       auditedAt: formattedDate,
        //     },
        //     { where: { id } }
        //   )
        //   if (dto.status === '已审核') {
        //     const order = await ProductionOrder.findByPk(report.processPositionTask?.processTask?.serialId, {
        //       include: [
        //         {
        //           association: 'bom',
        //           attributes: ['id', 'parentMaterialCode', 'remark', 'version', 'quantity', 'formData'],
        //           where: {},
        //           include: [
        //             {
        //               association: 'parentMaterial',
        //               attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
        //               where: {},
        //             },
        //           ],
        //         },
        //         {
        //           association: 'boms',
        //           required: false,
        //         },
        //       ],
        //     })
        //     const perUser = await User.findByPk(report.productUserId)
        //     let per = await Performance.findOne({ where: { userId: perUser.id } })
        //     let config = await PerformanceConfig.findOne({
        //       where: {
        //         // materialId: order.dataValues.bom.materialId,
        //         processId: report.processId,
        //       },
        //     })
        //     if (!per) {
        //       per = await Performance.create({
        //         deptId: perUser.departmentId,
        //         userId: perUser.id,
        //         goodCount: 0,
        //         badCount: 0,
        //         yieldRate: 0,
        //         goodCountWages: 0,
        //         badCountWages: 0,
        //         wages: 0,
        //       })
        //     }
        //     if (config) {
        //       if (report.accountingType === '计件') {
        //         per.update({
        //           goodCount: report.goodCount + per.goodCount,
        //           badCount: report.badCount + per.badCount,
        //           yieldRate: ((report.goodCount + per.goodCount) / (report.badCount + report.goodCount + per.goodCount + per.badCount)) * 100,
        //           goodCountWages: report.goodCount * config.goodCountPrice + per.goodCountWages,
        //           badCountWages: report.badCount * config.badCountPrice + per.badCountWages,
        //           wages: report.goodCount * config.goodCountPrice + report.badCount * config.badCountPrice + per.wages,
        //         })
        //         //生成绩效明细
        //         const temp = await PerformanceDetailed.findOne({
        //           where: {
        //             productionReportId: id,
        //             // materialId: order.dataValues.bom.materialId,
        //             processId: report.processId,
        //             performanceId: per.id,
        //             id: report.processPositionTask?.processTask?.serialId,
        //             userId: perUser.id,
        //           },
        //         })
        //         if (!temp) {
        //           await PerformanceDetailed.create({
        //             productionReportId: id,
        //             // materialId: order.dataValues.bom.dataValues.parentMaterial.id,
        //             processId: report.processId,
        //             performanceId: per.id,
        //             id: report.processPositionTask?.processTask?.serialId,
        //             userId: perUser.id,
        //             goodCount: report.goodCount,
        //             badCount: report.badCount,
        //             goodCountPrice: config.goodCountPrice,
        //             badCountPrice: config.badCountPrice,
        //             goodCountWages: report.goodCount * config.goodCountPrice,
        //             badCountWages: report.badCount * config.badCountPrice,
        //             yieldRate: (report.goodCount / (report.badCount + report.goodCount)) * 100,
        //             wages: report.badCount * config.badCountPrice + report.goodCount * config.goodCountPrice,
        //           })
        //         } else {
        //           await temp.update({
        //             goodCount: report.goodCount,
        //             badCount: report.badCount,
        //             goodCountPrice: config.goodCountPrice,
        //             badCountPrice: config.badCountPrice,
        //             goodCountWages: report.goodCount * config.goodCountPrice,
        //             badCountWages: report.badCount * config.badCountPrice,
        //             yieldRate: (report.goodCount / (report.badCount + report.goodCount)) * 100,
        //             wages: report.badCount * config.badCountPrice + report.goodCount * config.goodCountPrice,
        //           })
        //         }
        //       } else {
        //         per.update({
        //           goodCount: report.goodCount + per.goodCount,
        //           badCount: report.badCount + per.badCount,
        //           yieldRate: ((report.goodCount + per.goodCount) / (report.badCount + report.goodCount + per.goodCount + per.badCount)) * 100,
        //           goodCountWages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice + per.goodCountWages,
        //           wages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice + per.wages,
        //         })

        //         const temp = await PerformanceDetailed.findOne({
        //           where: {
        //             productionReportId: id,
        //             // materialId: order.dataValues.bom.materialId,
        //             processId: report.processId,
        //             performanceId: per.id,
        //             id: report.processPositionTask?.processTask?.serialId,
        //           },
        //         })
        //         if (!temp) {
        //           //生成绩效明细
        //           await PerformanceDetailed.create({
        //             productionReportId: id,
        //             // materialId: order.dataValues.bom.dataValues.parentMaterial.id,
        //             processId: report.processId,
        //             performanceId: per.id,
        //             id: report.processPositionTask?.processTask?.serialId,
        //             userId: perUser.id,
        //             goodCount: report.goodCount,
        //             badCount: report.badCount,
        //             goodCountPrice: config.goodCountPrice,
        //             badCountPrice: config.badCountPrice,
        //             goodCountWages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice,
        //             yieldRate: (report.goodCount / (report.badCount + report.goodCount)) * 100,
        //             wages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice,
        //           })
        //         } else {
        //           await temp.update({
        //             goodCount: report.goodCount,
        //             badCount: report.badCount,
        //             goodCountPrice: config.goodCountPrice,
        //             badCountPrice: config.badCountPrice,
        //             goodCountWages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice,
        //             yieldRate: (report.goodCount / (report.badCount + report.goodCount)) * 100,
        //             wages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice,
        //           })
        //         }
        //       }
        //     }
        //   } else if (dto.status === '取消审核') {
        //     const order = await ProductionOrder.findByPk(report.processPositionTask?.processTask?.serialId, {
        //       include: [
        //         {
        //           association: 'bom',
        //           attributes: ['id', 'parentMaterialCode', 'remark', 'version', 'quantity', 'formData'],
        //           where: {},
        //           include: [
        //             {
        //               association: 'parentMaterial',
        //               attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
        //               where: {},
        //             },
        //           ],
        //         },
        //       ],
        //     })
        //     // 删除相关绩效
        //     if (user.id) {
        //       const perUser = await User.findByPk(user.id)
        //       let per = await Performance.findOne({ where: { userId: perUser.id } })
        //       let config = await PerformanceConfig.findOne({
        //         where: {
        //           // materialId: order.dataValues.bom.dataValues.materialId,
        //           processId: report.dataValues.processId,
        //         },
        //       })
        //       let detail = await PerformanceDetailed.findOne({
        //         where: { performanceId: per.id },
        //         order: [['createdAt', 'DESC']],
        //       })
        //       if (per) {
        //         if (report.accountingType === '计件') {
        //           per.update({
        //             goodCount: per.goodCount - detail.goodCount,
        //             badCount: per.badCount - detail.badCount,
        //             yieldRate: ((per.goodCount - detail.goodCount) / (per.goodCount + per.badCount - detail.badCount - detail.goodCount)) * 100,
        //             goodCountWages: per.goodCountWages - detail.goodCountWages,
        //             badCountWages: per.badCountWages - detail.badCountWages,
        //             wages: per.wages - detail.goodCountWages - detail.badCountWages,
        //           })
        //         } else {
        //           per.update({
        //             goodCount: per.goodCount - detail.goodCount,
        //             badCount: per.badCount - detail.badCount,
        //             yieldRate: ((per.goodCount - detail.goodCount) / (per.goodCount + per.badCount - detail.badCount - detail.goodCount)) * 100,
        //             goodCountWages: per.goodCountWages - detail.goodCountWages,
        //             wages: per.wages - detail.goodCountWages,
        //           })
        //         }
        //       }
        //       await detail.destroy()
        //     }
        //   }
        // }
      }
    }
    return new ResultVO()
  }

  // public async batDelete(dto: deleteIdsDto, loadModel) {
  //   for (const id of dto.ids) {
  //     await this.delete(id, loadModel)
  //   }
  // }
}
