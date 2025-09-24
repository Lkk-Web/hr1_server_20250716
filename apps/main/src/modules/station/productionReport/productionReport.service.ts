import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { Inject, Injectable } from '@nestjs/common'
import { ProductionReport } from '@model/production/productionReport.model'
import { Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'

import { ResultVO } from '@common/resultVO'
import moment = require('moment')
import { Paging } from '@library/utils/paging'
// import { InspectionTemplateItem } from '@model/quantity/inspectionTemplateItem.model'
import { Material, PerformancePrice, PerformancePriceDetail, PerformancePriceTotal, PositionDetail, ProductionOrderTask, SOP } from '@model/index'
import { BatchLogService } from '@modules/admin/batchLog/batchLog.service'
import { FindPaginationDto, auditDto, FindPaginationReportTaskListDto } from './productionReport.dto'
import { POSITION_TASK_STATUS } from '@common/enum'
import { ProductionReportTwoService } from './productionReportTwo.service'
import { conforms } from 'lodash'

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
          attributes: ['id', 'orderCode', 'splitQuantity', 'goodCount', 'badCount', 'actualStartTime', 'actualEndTime'],
          required: false,
          through: {},
          where: {},
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
      options.include[0].where['orderCode'] = {
        [Op.like]: `%${dto.orderCode}%`,
      }
    }
    const result = await Paging.diyPaging(ProductionReport, options)
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

  /**
   * 批量反审核报工单
   */
  async auditAntireview(ids: number[]) {
    const transaction = await ProductionReport.sequelize.transaction()

    try {
      await ProductionReport.update({ auditStatus: '待审核' }, { where: { id: ids }, transaction })
      await PerformancePriceTotal.destroy({ where: { productionReportId: ids }, transaction })
      await transaction.commit()
      return '反审核成功'
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  /**
   * 根据ID查询报工单详情
   */
  public async findById(id: number, loadModel) {
    const options = {
      where: { id },
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
              where: { productionReportId: id },
              required: false,
              include: [
                {
                  association: 'serial',
                  require: true,
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

    const result = await ProductionReport.findOne(options)
    if (!result) {
      throw new Error('报工单不存在')
    }

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

  // public async audit(dto: auditDto, user, loadModel) {
  //   await ProductionReport.update({ auditStatus: dto.status }, { where: { id: dto.ids } })

  //   return `${dto.status}成功`
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
  //       // if (report) {
  //       //   const date: Date = new Date()
  //       //   const formattedDate = moment(date, 'YYYY-MM-DD HH:mm:ss').toDate()
  //       //   await ProductionReport.update(
  //       //     {
  //       //       auditorId: user.id,
  //       //       auditStatus: dto.status,
  //       //       auditedAt: formattedDate,
  //       //     },
  //       //     { where: { id } }
  //       //   )
  //       //   if (dto.status === '已审核') {
  //       //     const order = await ProductionOrder.findByPk(report.processPositionTask?.processTask?.serialId, {
  //       //       include: [
  //       //         {
  //       //           association: 'bom',
  //       //           attributes: ['id', 'parentMaterialCode', 'remark', 'version', 'quantity', 'formData'],
  //       //           where: {},
  //       //           include: [
  //       //             {
  //       //               association: 'parentMaterial',
  //       //               attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
  //       //               where: {},
  //       //             },
  //       //           ],
  //       //         },
  //       //         {
  //       //           association: 'boms',
  //       //           required: false,
  //       //         },
  //       //       ],
  //       //     })
  //       //     const perUser = await User.findByPk(report.productUserId)
  //       //     let per = await Performance.findOne({ where: { userId: perUser.id } })
  //       //     let config = await PerformanceConfig.findOne({
  //       //       where: {
  //       //         // materialId: order.dataValues.bom.materialId,
  //       //         processId: report.processId,
  //       //       },
  //       //     })
  //       //     if (!per) {
  //       //       per = await Performance.create({
  //       //         deptId: perUser.departmentId,
  //       //         userId: perUser.id,
  //       //         goodCount: 0,
  //       //         badCount: 0,
  //       //         yieldRate: 0,
  //       //         goodCountWages: 0,
  //       //         badCountWages: 0,
  //       //         wages: 0,
  //       //       })
  //       //     }
  //       //     if (config) {
  //       //       if (report.accountingType === '计件') {
  //       //         per.update({
  //       //           goodCount: report.goodCount + per.goodCount,
  //       //           badCount: report.badCount + per.badCount,
  //       //           yieldRate: ((report.goodCount + per.goodCount) / (report.badCount + report.goodCount + per.goodCount + per.badCount)) * 100,
  //       //           goodCountWages: report.goodCount * config.goodCountPrice + per.goodCountWages,
  //       //           badCountWages: report.badCount * config.badCountPrice + per.badCountWages,
  //       //           wages: report.goodCount * config.goodCountPrice + report.badCount * config.badCountPrice + per.wages,
  //       //         })
  //       //         //生成绩效明细
  //       //         const temp = await PerformanceDetailed.findOne({
  //       //           where: {
  //       //             productionReportId: id,
  //       //             // materialId: order.dataValues.bom.materialId,
  //       //             processId: report.processId,
  //       //             performanceId: per.id,
  //       //             id: report.processPositionTask?.processTask?.serialId,
  //       //             userId: perUser.id,
  //       //           },
  //       //         })
  //       //         if (!temp) {
  //       //           await PerformanceDetailed.create({
  //       //             productionReportId: id,
  //       //             // materialId: order.dataValues.bom.dataValues.parentMaterial.id,
  //       //             processId: report.processId,
  //       //             performanceId: per.id,
  //       //             id: report.processPositionTask?.processTask?.serialId,
  //       //             userId: perUser.id,
  //       //             goodCount: report.goodCount,
  //       //             badCount: report.badCount,
  //       //             goodCountPrice: config.goodCountPrice,
  //       //             badCountPrice: config.badCountPrice,
  //       //             goodCountWages: report.goodCount * config.goodCountPrice,
  //       //             badCountWages: report.badCount * config.badCountPrice,
  //       //             yieldRate: (report.goodCount / (report.badCount + report.goodCount)) * 100,
  //       //             wages: report.badCount * config.badCountPrice + report.goodCount * config.goodCountPrice,
  //       //           })
  //       //         } else {
  //       //           await temp.update({
  //       //             goodCount: report.goodCount,
  //       //             badCount: report.badCount,
  //       //             goodCountPrice: config.goodCountPrice,
  //       //             badCountPrice: config.badCountPrice,
  //       //             goodCountWages: report.goodCount * config.goodCountPrice,
  //       //             badCountWages: report.badCount * config.badCountPrice,
  //       //             yieldRate: (report.goodCount / (report.badCount + report.goodCount)) * 100,
  //       //             wages: report.badCount * config.badCountPrice + report.goodCount * config.goodCountPrice,
  //       //           })
  //       //         }
  //       //       } else {
  //       //         per.update({
  //       //           goodCount: report.goodCount + per.goodCount,
  //       //           badCount: report.badCount + per.badCount,
  //       //           yieldRate: ((report.goodCount + per.goodCount) / (report.badCount + report.goodCount + per.goodCount + per.badCount)) * 100,
  //       //           goodCountWages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice + per.goodCountWages,
  //       //           wages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice + per.wages,
  //       //         })

  //       //         const temp = await PerformanceDetailed.findOne({
  //       //           where: {
  //       //             productionReportId: id,
  //       //             // materialId: order.dataValues.bom.materialId,
  //       //             processId: report.processId,
  //       //             performanceId: per.id,
  //       //             id: report.processPositionTask?.processTask?.serialId,
  //       //           },
  //       //         })
  //       //         if (!temp) {
  //       //           //生成绩效明细
  //       //           await PerformanceDetailed.create({
  //       //             productionReportId: id,
  //       //             // materialId: order.dataValues.bom.dataValues.parentMaterial.id,
  //       //             processId: report.processId,
  //       //             performanceId: per.id,
  //       //             id: report.processPositionTask?.processTask?.serialId,
  //       //             userId: perUser.id,
  //       //             goodCount: report.goodCount,
  //       //             badCount: report.badCount,
  //       //             goodCountPrice: config.goodCountPrice,
  //       //             badCountPrice: config.badCountPrice,
  //       //             goodCountWages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice,
  //       //             yieldRate: (report.goodCount / (report.badCount + report.goodCount)) * 100,
  //       //             wages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice,
  //       //           })
  //       //         } else {
  //       //           await temp.update({
  //       //             goodCount: report.goodCount,
  //       //             badCount: report.badCount,
  //       //             goodCountPrice: config.goodCountPrice,
  //       //             badCountPrice: config.badCountPrice,
  //       //             goodCountWages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice,
  //       //             yieldRate: (report.goodCount / (report.badCount + report.goodCount)) * 100,
  //       //             wages: report.reportDurationHours * 60 * config.goodCountPrice + report.reportDurationMinutes * config.goodCountPrice,
  //       //           })
  //       //         }
  //       //       }
  //       //     }
  //       //   } else if (dto.status === '取消审核') {
  //       //     const order = await ProductionOrder.findByPk(report.processPositionTask?.processTask?.serialId, {
  //       //       include: [
  //       //         {
  //       //           association: 'bom',
  //       //           attributes: ['id', 'parentMaterialCode', 'remark', 'version', 'quantity', 'formData'],
  //       //           where: {},
  //       //           include: [
  //       //             {
  //       //               association: 'parentMaterial',
  //       //               attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
  //       //               where: {},
  //       //             },
  //       //           ],
  //       //         },
  //       //       ],
  //       //     })
  //       //     // 删除相关绩效
  //       //     if (user.id) {
  //       //       const perUser = await User.findByPk(user.id)
  //       //       let per = await Performance.findOne({ where: { userId: perUser.id } })
  //       //       let config = await PerformanceConfig.findOne({
  //       //         where: {
  //       //           // materialId: order.dataValues.bom.dataValues.materialId,
  //       //           processId: report.dataValues.processId,
  //       //         },
  //       //       })
  //       //       let detail = await PerformanceDetailed.findOne({
  //       //         where: { performanceId: per.id },
  //       //         order: [['createdAt', 'DESC']],
  //       //       })
  //       //       if (per) {
  //       //         if (report.accountingType === '计件') {
  //       //           per.update({
  //       //             goodCount: per.goodCount - detail.goodCount,
  //       //             badCount: per.badCount - detail.badCount,
  //       //             yieldRate: ((per.goodCount - detail.goodCount) / (per.goodCount + per.badCount - detail.badCount - detail.goodCount)) * 100,
  //       //             goodCountWages: per.goodCountWages - detail.goodCountWages,
  //       //             badCountWages: per.badCountWages - detail.badCountWages,
  //       //             wages: per.wages - detail.goodCountWages - detail.badCountWages,
  //       //           })
  //       //         } else {
  //       //           per.update({
  //       //             goodCount: per.goodCount - detail.goodCount,
  //       //             badCount: per.badCount - detail.badCount,
  //       //             yieldRate: ((per.goodCount - detail.goodCount) / (per.goodCount + per.badCount - detail.badCount - detail.goodCount)) * 100,
  //       //             goodCountWages: per.goodCountWages - detail.goodCountWages,
  //       //             wages: per.wages - detail.goodCountWages,
  //       //           })
  //       //         }
  //       //       }
  //       //       await detail.destroy()
  //       //     }
  //       //   }
  //       // }
  //     }
  //   }
  //   return new ResultVO()
  // }

  public async audit(dto: auditDto, user, loadModel) {
    if (!dto?.ids || dto.ids.length === 0) {
      return '无可审核的报工单'
    }

    const transaction = await ProductionReport.sequelize.transaction()
    try {
      await ProductionReport.update({ auditStatus: dto.status }, { where: { id: dto.ids }, transaction })

      // 审核通过后，生成绩效计件统计
      if (dto.status === '已通过') {
        // 仅加载必要字段，减少 include 体量
        const reports = await ProductionReport.findAll({
          where: { id: dto.ids },
          include: [
            {
              association: 'productionReportDetails',
              attributes: ['id', 'reportQuantity'],
              include: [
                {
                  association: 'productionOrderTask',
                  attributes: ['id', 'materialId'],
                },
              ],
            },
          ],
          attributes: ['id', 'teamId', 'productUserId', 'processId'],
          transaction,
        })

        // 批量查工位
        const userIds = Array.from(new Set(reports.map(r => r.productUserId).filter(Boolean)))
        let positionMap = new Map<number, number | null>()
        if (userIds.length > 0) {
          const positionDetails = await PositionDetail.findAll({
            where: { userId: userIds },
            attributes: ['userId', 'positionId'],
            transaction,
          })
          positionMap = new Map(positionDetails.map(pd => [pd.userId, pd.positionId]))
        }

        // 收集所有需要的 (processId, materialId) 组合
        const keyFrom = (processId: number, materialId: number) => `${processId}:${materialId}`
        const priceKeySet = new Set<string>()
        const allMaterialIds = new Set<number>()
        const allProcessIds = new Set<number>()
        for (const report of reports) {
          const processId = report.processId
          if (!processId) continue
          allProcessIds.add(processId)
          const details = report.productionReportDetails || []
          for (const d of details) {
            const matId = d?.productionOrderTask?.materialId
            if (!matId) continue
            allMaterialIds.add(matId)
            priceKeySet.add(keyFrom(processId, matId))
          }
        }

        // 批量查询工价：为每个物料单独查询对应的工价
        let priceMap = new Map<string, PerformancePrice>()
        if (allMaterialIds.size > 0 && allProcessIds.size > 0) {
          const materials = await Material.findAll({
            where: { id: Array.from(allMaterialIds) },
            attributes: ['id', 'spec'],
            transaction,
          })

          // 为每个物料单独查询工价
          for (const material of materials) {
            if (!material.spec) continue

            // 转义规格字符串以匹配数据库存储
            const productSpecStr = material.spec.replace(/\r\n/g, '\\r\\n').replace(/\n/g, '\\n').replace(/\r/g, '\\r')

            const perfDetails = await PerformancePriceDetail.findAll({
              where: { materialId: material.id },
              include: [
                {
                  association: 'performancePrice',
                  where: {
                    processId: Array.from(allProcessIds),
                    status: 1,
                    productSpec: productSpecStr,
                  },
                  attributes: ['id', 'processId', 'price', 'productSpec', 'status'],
                },
              ],
              order: [['id', 'DESC']],
              transaction,
            })

            // 为每个 (processId, materialId) 组合设置工价
            for (const pd of perfDetails) {
              const procId = pd.performancePrice?.processId
              if (!procId) continue
              const k = keyFrom(procId, material.id)
              if (!priceMap.has(k)) {
                priceMap.set(k, pd.performancePrice)
              }
            }
          }
        }

        // 组装批量插入的数据
        const rows: Array<Partial<PerformancePriceTotal>> = []
        for (const report of reports) {
          const positionId = positionMap.get(report.productUserId) ?? null
          const details = report.productionReportDetails || []

          for (const d of details) {
            const matId = d?.productionOrderTask.dataValues?.materialId
            const k = keyFrom(report.processId, matId)
            const perfPrice = priceMap.get(k)
            console.log(perfPrice)
            if (!perfPrice || !perfPrice.id) {
              throw new Error(`未绑定产品工价`)
            }

            const price = Number(perfPrice.price || 0)
            const qty = Number(d.reportQuantity || 0)
            if (!qty || !price) continue

            rows.push({
              teamId: report.teamId,
              updatedUserId: report.productUserId,
              positionId,
              productionReportId: report.id,
              materialId: matId,
              performancePriceId: perfPrice.id,
              productSpec: perfPrice.productSpec,
              reportQuantity: qty,
              totalPrice: qty * price,
            })
          }
        }

        if (rows.length > 0) {
          await PerformancePriceTotal.bulkCreate(rows, { transaction })
        }
      }
      await transaction.commit()
      return `${dto.status}成功`
    } catch (e) {
      await transaction.rollback()
      throw e
    }
  }
}
