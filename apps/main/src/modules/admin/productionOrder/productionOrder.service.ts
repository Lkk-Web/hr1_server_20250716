import { Pagination } from '@common/interface'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Injectable } from '@nestjs/common'
import { ProductionOrder } from '@model/production/productionOrder.model'
import { actionDto, CProductionOrderDTO, ERPFindPaginationDto, FindPaginationDto, pobDto, POBPaginationDto, priorityDto } from './productionOrder.dto'
import { FindOptions, Op, or, where } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Material } from '@model/base/material.model'
import { POP } from '@model/production/POP.model'
import { POD } from '@model/production/PODmodel'
import { POI } from '@model/production/POI.model'
import { POB } from '@model/production/POB.model'
import { ProcessTask } from '@model/production/processTask.model'
import { ProcessTaskDept } from '@model/production/processTaskDept.model'
import { Aide, JsExclKey } from '@library/utils/aide'
import { ProcessRoute } from '@model/process/processRoute.model'
import { User } from '@model/auth/user'
import { ResultVO } from '@common/resultVO'
import { BOM } from '@model/base/bom.model'
import { ApiDict, DefectiveItem, PerformanceConfig, Process, Organize, WarehouseMaterial, WorkCenterOfPOP } from '@model/index'
import { Paging } from '@library/utils/paging'
import { KingdeeeService } from '@library/kingdee'
import { POBD } from '@model/production/POBD.model'
// import { SENTENCE } from '@common/enum'
import { deleteIdsDto } from '@common/dto'
import { BomService } from '../baseData/bom/bom.service'
import { PROCESS_TASK_STATUS } from '@common/enum'
import moment = require('moment')
import dayjs = require('dayjs')
import _ = require('lodash')
import { log } from 'console'

@Injectable()
export class ProductionOrderService {
  constructor(
    @InjectModel(ProductionOrder)
    private productionOrderModel: typeof ProductionOrder,
    private bomService: BomService
  ) {}

  public async create(dto: CProductionOrderDTO, loadModel) {
    const sequelize = PerformanceConfig.sequelize
    return sequelize
      .transaction(async transaction => {
        try {
          if (!dto.code || dto.code.length === 0) {
            const temp2 = await ProductionOrder.findOne({ order: [['id', 'DESC']] })
            if (temp2) {
              const oldNO = temp2.code
              const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
              let num = parseInt(lastFourChars)
              num++
              let newNO = num.toString().padStart(4, '0')
              const date = new Date()
              const year = date.getFullYear().toString().slice(2)
              let temp = date.getMonth() + 1
              const mouth = temp.toString().padStart(2, '0')
              dto.code = 'GD' + year + mouth + newNO
            } else {
              const date = new Date()
              const year = date.getFullYear().toString().slice(2)
              let temp1 = date.getMonth() + 1
              const mouth = temp1.toString().padStart(2, '0')
              dto.code = 'GD' + year + mouth + '0001'
            }
          }

          const temp = await ProductionOrder.findOne({ where: { code: dto.code } })
          if (temp) {
            throw new HttpException('已存在相同编号的生产工单！', 400)
          }
          const result = await ProductionOrder.create(
            {
              kingdeeRow: dayjs().unix().toString(),
              code: dto.code,
              bomId: dto.bomId,
              salesOrderId: dto.salesOrderId,
              plannedOutput: dto.plannedOutput,
              startTime: dto.startTime,
              endTime: dto.endTime,
              actualOutput: dto.actualOutput,
              priority: dto.priority,
              remark: dto.remark,
            },
            { transaction }
          )
          //创建工序任务
          if (dto.processes) {
            for (const process of dto.processes) {
              const temp = await Process.findByPk(process.processId)
              if (!temp) {
                throw new HttpException('所选ID为:' + process.processId + '的工序不存在', 400)
              }
              const pro = await POP.create(
                {
                  productionOrderId: result.id,
                  processId: process.processId,
                  reportRatio: process.reportRatio,
                  isReport: process.isReport,
                  isOutsource: process.isOutsource,
                  isInspection: process.isInspection,
                  sort: process.sort,
                  planCount: process.planCount,
                  goodCount: process.goodCount,
                  badCount: process.badCount,
                  fileId: process.fileId,
                  startTime: process.startTime,
                  endTime: process.endTime,
                },
                { transaction }
              )
              //创建部门关联
              if (process.deptsId) {
                for (const deptsIdElement of process.deptsId) {
                  const dept = await Organize.findByPk(deptsIdElement)
                  if (dept) {
                    await POD.create({ popId: pro.id, deptId: deptsIdElement }, { transaction })
                  } else {
                    throw new HttpException('新增生产工单失败!ID为:' + deptsIdElement + '的部门不存在', 400)
                  }
                }
              }
              //创建不良品项关联
              if (process.items) {
                for (const item of process.items) {
                  const defectiveItem = await DefectiveItem.findByPk(item)
                  if (defectiveItem) {
                    await POI.create({ popId: pro.id, defectiveItemId: item }, { transaction })
                  } else {
                    throw new HttpException('新增生产工单失败!ID为:' + item + '的不良品项不存在', 400)
                  }
                }
              }
            }
          }
          //创建用料清单
          if (dto.boms) {
            for (const bom of dto.boms) {
              const temp = await Material.findByPk(bom.materialId)
              if (!temp) {
                throw new HttpException('所选ID为:' + bom.materialId + '的物料不存在', 400)
              }
              await POB.create({ productionOrderId: dto.code, code: `PPBO${dto.code}`, ...bom }, { transaction })
            }
          }

          return result.id
        } catch (error) {
          // 如果出现错误，Sequelize 将自动回滚事务
          throw error
        }
      })
      .then(async id => {
        const findDto = {
          kingdeeCode: dto.code,
        }
        return this.find(id, loadModel, findDto)
      })
      .catch(e => {
        throw e
      })
  }

  // public async edit(dto: UProductionOrderDTO, id: number, loadModel) {
  //   let productionOrder = await ProductionOrder.findOne({ where: { id } })
  //   if (!productionOrder) {
  //     throw new HttpException('数据不存在', 400006)
  //   }
  //   if (dto.code != productionOrder.code) {
  //     productionOrder = await ProductionOrder.findOne({ where: { code: dto.code } })
  //     if (productionOrder) {
  //       throw new HttpException('已存在相同编号生产工单,无法修改', 400)
  //     }
  //   }
  //   const sequelize = ProductionOrder.sequelize
  //   return sequelize
  //     .transaction(async transaction => {
  //       try {
  //         await productionOrder.update(
  //           {
  //             code: dto.code,
  //             bomId: dto.bomId,
  //             salesOrderId: dto.salesOrderId,
  //             plannedOutput: dto.plannedOutput,
  //             startTime: dto.startTime,
  //             endTime: dto.endTime,
  //             actualOutput: dto.actualOutput,
  //             priority: dto.priority,
  //             remark: dto.remark,
  //           },
  //           { transaction }
  //         )
  //         //删除依赖关系
  //         const process = await POP.findAll({ where: { productionOrderId: id } })
  //         for (const process1 of process) {
  //           await POD.destroy({ where: { popId: process1.id }, transaction })
  //           await POI.destroy({ where: { popId: process1.id }, transaction })
  //         }
  //         await POP.destroy({ where: { productionOrderId: id }, transaction })
  //         await POB.destroy({ where: { productionOrderId: id }, transaction })
  //
  //         //创建工序任务
  //         if (dto.processes) {
  //           for (const process of dto.processes) {
  //             const temp = await Process.findByPk(process.processId)
  //             if (!temp) {
  //               throw new HttpException('所选ID为:' + process.processId + '的工序不存在', 400)
  //             }
  //             const pro = await POP.create(
  //               {
  //                 productionOrderId: id,
  //                 processId: process.processId,
  //                 reportRatio: process.reportRatio,
  //                 isReport: process.isReport,
  //                 isOutsource: process.isOutsource,
  //                 isInspection: process.isInspection,
  //                 sort: process.sort,
  //                 planCount: process.planCount,
  //                 goodCount: process.goodCount,
  //                 badCount: process.badCount,
  //                 fileId: process.fileId,
  //                 startTime: process.startTime,
  //                 endTime: process.startTime,
  //               },
  //               { transaction }
  //             )
  //             //创建部门关联
  //             if (process.deptsId) {
  //               for (const deptsIdElement of process.deptsId) {
  //                 const dept = await SYSOrg.findByPk(deptsIdElement)
  //                 if (dept) {
  //                   await POD.create({ popId: pro.id, deptId: deptsIdElement }, { transaction })
  //                 } else {
  //                   throw new HttpException('新增生产工单失败!ID为:' + deptsIdElement + '的部门不存在', 400)
  //                 }
  //               }
  //             }
  //             //创建不良品项关联
  //             if (process.items) {
  //               for (const item of process.items) {
  //                 const defectiveItem = await DefectiveItem.findByPk(item)
  //                 if (defectiveItem) {
  //                   await POI.create({ popId: pro.id, defectiveItemId: item }, { transaction })
  //                 } else {
  //                   throw new HttpException('新增生产工单失败!ID为:' + item + '的不良品项不存在', 400)
  //                 }
  //               }
  //             }
  //           }
  //         }
  //         //创建用料清单
  //         if (dto.boms) {
  //           for (const bom of dto.boms) {
  //             const temp = await Material.findByPk(bom.materialId)
  //             if (!temp) {
  //               throw new HttpException('所选ID为:' + bom.materialId + '的物料不存在', 400)
  //             }
  //             await POB.create({ productionOrderId: id, ...bom }, { transaction })
  //           }
  //         }
  //
  //         return id
  //       } catch (e) { }
  //     })
  //     .then(async id => {
  //       return this.find(id, loadModel)
  //     })
  //     .catch(e => {
  //       throw e
  //     })
  // }
  //
  public async delete(id: number, loadModel) {
    const productOrder = await ProductionOrder.findByPk(id, { attributes: ['id', 'status'] })
    if (!productOrder) Aide.throwException(400, '生产工单不存在')
    if (!['未开始', '已取消'].includes(productOrder.status)) Aide.throwException(400, '当前状态不允许删除')
    const transaction = await PerformanceConfig.sequelize.transaction()
    try {
      //删除依赖关系
      const process = await POP.findAll({ where: { productionOrderId: id }, attributes: ['id'] })
      const pobs = await POB.findAll({ where: { productionOrderId: id }, attributes: ['id'] })
      await POD.destroy({ where: { popId: process.map(v => v.id) }, transaction })
      await POI.destroy({ where: { popId: process.map(v => v.id) }, transaction })
      await WorkCenterOfPOP.destroy({ where: { POPId: process.map(v => v.id) }, transaction })
      await POBD.destroy({ where: { pobId: pobs.map(v => v.id) }, transaction })
      await POP.destroy({ where: { productionOrderId: id }, transaction })
      await POB.destroy({ where: { productionOrderId: id }, transaction })
      const result = await productOrder.destroy({ transaction })
      await transaction.commit()
      return result
    } catch (e) {
      await transaction.rollback()
      throw e
    }
  }

  public async find(id: string, loadModel, dto?: pobDto) {
    const options: FindOptions = {
      where: { id },
      include: [
        {
          association: 'bom',
          attributes: ['id', 'code', 'materialId', 'spec', 'attr', 'unit', 'quantity', 'orderNo', 'figureNumber', 'remark', 'version', 'status', 'formData'],
          where: {},
          required: false,
          include: [
            {
              association: 'parentMaterial',
              attributes: ['id', 'materialName', 'code', 'spec', 'attribute', 'unit', 'status'],
              required: false,
              where: {},
            },
          ],
        },
        {
          association: 'processes',
          include: [
            {
              association: 'process',
              attributes: ['id', 'processName'],
            },
            {
              association: 'depts',
              attributes: ['id', 'name'],
              through: {
                attributes: [], // 隐藏中间表的数据
              },
            },
            {
              association: 'items',
              attributes: ['id', 'name'],
              through: {
                attributes: [], // 隐藏中间表的数据
              },
            },
            {
              association: 'file',
              attributes: ['id', 'name', 'versionCode', 'url'],
              where: {},
              required: false,
            },
          ],
        },
      ],
    }
    let pobList = await POB.findAll({
      attributes: ['id', 'productionOrderId', 'code', 'fz', 'count', 'remark', 'bomId'],
      where: { productionOrderId: id },
      include: [
        {
          association: 'material',
          required: false,
          attributes: ['id', 'materialName', 'code', 'spec', 'attribute', 'unit'],
          where: {},
        },
        {
          association: 'items',
          required: false,
          attributes: [
            'id',
            'item',
            'ratio',
            'type',
            'numerator',
            'denominator',
            'sendCount',
            'length',
            'method',
            'warehouseId',
            'transferCount',
            'receivedCount',
            'unclaimedCount',
            'replaceCount',
            'actualReceived',
          ],
          include: [
            {
              association: 'material',
              attributes: ['id', 'materialName', 'code', 'spec', 'attribute', 'unit'],
              required: false,
            },
          ],
        },
      ],
    })
    let res = await ProductionOrder.findOne(options)
    let result = JSON.parse(JSON.stringify(res))
    let boms = []
    for (const bom of pobList) {
      if (bom.bomId == result.bomId) {
        boms.push(bom.dataValues)
      }
    }
    for (const process of result.processes) {
      const temp = await PerformanceConfig.findOne({
        where: {
          materialId: result.bom.materialId,
          processId: process.processId,
        },
      })
      if (temp) {
        process['performanceConfig'] = temp
      }
    }
    result['boms'] = boms
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, user: User) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      order: [
        ['kingdeeCode', 'DESC'],
        ['code', 'DESC'],
      ],
      attributes: [
        'id',
        'kingdeeCode',
        'kingdeeRow',
        'code',
        'FStatus',
        'status',
        'priority',
        'plannedOutput',
        'startTime',
        'endTime',
        'actualOutput',
        'actualStartTime',
        'actualEndTime',
        'totalWorkingHours',
        'currentProcess',
        'remark',
        'schedulingStatus',
        'salesOrderCode',
      ],
      include: [
        {
          association: 'bom',
          attributes: ['id', 'code', 'materialId', 'spec', 'attr', 'unit', 'quantity', 'orderNo', 'figureNumber', 'remark', 'version', 'status', 'formData'],
          where: {},
          required: false,
          include: [
            {
              association: 'parentMaterial',
              attributes: ['id', 'code', 'attribute', 'category', 'materialName', 'spec', 'unit', 'status', 'k3DataStatus'],
              required: true,
              // include: [
              //   {
              //     association: 'boms',
              //     required: false,
              //     attributes:['id','code','materialId','remark','version','spec','attr','quantity','size'],
              //   },
              // ],
              where: {},
            },
          ],
        },
        // {
        //   association: 'salesOrder',
        //   attributes: ['id', 'code'],
        //   required: false,
        // },
        {
          association: 'processes',
          attributes: [
            'id',
            'productionOrderId',
            'processId',
            'reportRatio',
            'reportRatio',
            'isOutsource',
            'sort',
            'planCount',
            'goodCount',
            'badCount',
            'startTime',
            'endTime',
            'actualStartTime',
            'actualEndTime',
            'processTaskId',
            'isInspection',
            'reportQuantity',
          ],
          include: [
            {
              association: 'process',
              attributes: ['id', 'processName'],
              include: [
                {
                  association: 'children',
                  attributes: ['id', 'processName', 'reportRatio', 'isOut', 'createdAt', 'updatedAt'],
                  required: false,
                },
              ],
            },
            {
              association: 'workCenter',
              // where: {},
              attributes: ['id', 'name'],
              through: {
                attributes: ['id'],
              },
            },
            {
              association: 'depts',
              attributes: ['id', 'name'],
              through: {
                attributes: [], // 隐藏中间表的数据
              },
            },
            {
              association: 'items',
              attributes: ['id', 'name'],
              through: {
                attributes: [], // 隐藏中间表的数据
              },
            },
            {
              association: 'file',
              attributes: ['id', 'name', 'versionCode', 'url'],
              where: {},
              required: false,
            },
          ],
        },
        // {
        //   association: 'boms',
        //   attributes: ['id', 'productionOrderCode', 'code', 'fz', 'count', 'remark'],
        //   required: false,
        //   include: [
        //     {
        //       association: 'material',
        //       required: false,
        //       attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit'],
        //       where: {},
        //     },
        //     {
        //       association: 'items',
        //       required: false,
        //       attributes: ['id', 'item', 'ratio', 'type', 'numerator', 'denominator', 'sendCount', 'length', 'method', 'warehouseId', 'transferCount', 'receivedCount', 'unclaimedCount', 'replaceCount', 'actualReceived'],
        //       include: [
        //         {
        //           association: 'material',
        //           attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit'],
        //           required: false,
        //         }
        //       ]
        //     }
        //   ],
        //   where: {},
        // },
      ],
    }
    if (dto.code) {
      options.where['code'] = {
        [Op.like]: `%${dto.code}%`,
      }
    }

    if (dto.kingdeeCode) {
      options.where['kingdeeCode'] = {
        [Op.like]: `%${dto.kingdeeCode}%`,
      }
    }

    if (dto.name) {
      options.include[0].include[0].where['name'] = {
        [Op.like]: `%${dto.name}%`,
      }
    }

    if (dto.status) {
      if (dto.status === '未完成') {
        options.where['status'] = {
          [Op.in]: ['未开始', '执行中'],
        }
      } else {
        options.where['status'] = {
          [Op.eq]: dto.status,
        }
      }
    }

    if (dto.materialCode) {
      options.include[0].include[0].where['code'] = {
        [Op.like]: `%${dto.materialCode}%`,
      }
    }

    if (dto.isDept) {
      if (user) {
        const user1 = await User.findByPk(user.id)
        if (user1.departmentId) {
          options.include[1].include[1].where['id'] = {
            [Op.eq]: user1.departmentId,
          }
        }
      }
    }

    if (dto.startTime) {
      options.where['startTime'] = {
        [Op.gte]: moment(dto.startTime).startOf('day').toISOString(),
        [Op.lte]: moment(dto.startTime).endOf('day').toISOString(),
      }
    }

    if (dto.endTime) {
      options.where['endTime'] = {
        [Op.gte]: moment(dto.endTime).startOf('day').toISOString(),
        [Op.lte]: moment(dto.endTime).endOf('day').toISOString(),
      }
    }

    // 工序排产
    if (dto.popStartTime && dto.popEndTime) {
      // 筛选startTime >= dto.startTime 且 endTime <= dto.endTime 的记录
      options.where['startTime'] = { [Op.gte]: dto.popStartTime }
      options.where['endTime'] = { [Op.lte]: dto.popEndTime }
    } else if (dto.popStartTime) {
      // 只有开始时间，筛选startTime >= dto.startTime的记录
      options.where['startTime'] = { [Op.gte]: dto.popStartTime }
    } else if (dto.popEndTime) {
      // 只有结束时间，筛选endTime <= dto.endTime的记录
      options.where['endTime'] = { [Op.lte]: dto.popEndTime }
    }

    if (dto.schedulingStatus) {
      options.where['schedulingStatus'] = dto.schedulingStatus
    }

    const result = await ProductionOrder.findPagination<ProductionOrder>(options)
    // @ts-ignore
    // for (const datum of result.data) {
    //   for (const process of datum.dataValues.processes) {
    //     const temp = await PerformanceConfig.findOne({
    //       where: {
    //         materialId: datum.dataValues.bom.dataValues.materialId,
    //         processId: process.processId,
    //       },
    //     })
    //     if (temp) {
    //       process.setDataValue('performanceConfig', temp)
    //     }
    //   }
    // }

    return result
  }

  public async batDelete(dto: deleteIdsDto, loadModel) {
    for (const id of dto.ids) {
      await this.delete(id, loadModel)
    }
  }

  public async action(dto: actionDto, loadModel) {
    const kingdeeCodes = _.uniq(dto.kingdeeCodes)
    for (const kingdeeCode of kingdeeCodes) {
      let orders = await ProductionOrder.findAll({ where: { kingdeeCode: kingdeeCode } })
      for (let order of orders) {
        let number = order.id
        if (!order) {
          throw new HttpException('请携带工序操作!', 400)
        }
        if (dto.type == '开始') {
          if (order.status != '未开始') {
            // throw new HttpException('该操作只能对”未开始“状态工单操作，谢谢！', 400)
            continue
          }
          await ProductionOrder.update({ status: '执行中' }, { where: { id: number } })
          let pop = await POP.findOne({ where: { productionOrderId: number }, order: [['id', 'ASC']] })
          if (pop) {
            POP.update({ status: '执行中' }, { where: { productionOrderId: number } })
          }
          // await pop.update({ status: '执行中' })

          await ProcessTask.destroy({ where: { productionOrderId: order.id } })
          //创建工序任务单
          order = await this.find(number, loadModel, { kingdeeCode: order.kingdeeCode })
          // console.log(order)
          pop = await POP.findOne({
            where: { productionOrderId: number, status: '执行中' },
            order: [['id', 'ASC']],
            include: [{ association: 'process', attributes: ['id', 'processName'] }],
          })
          // console.log(pop)
          if (pop) {
            await ProductionOrder.update({ currentProcess: pop.dataValues.process.processName }, { where: { id: number } })
          }
          let count = 0

          for (let i = 0; i < order.processes.length; i++) {
            const process = order.processes[i]
            let task = await ProcessTask.create({
              productionOrderId: order.id,
              processId: process.processId,
              reportRatio: process.reportRatio,
              planCount: process.planCount,
              isOutsource: process.isOutsource,
              isInspection: process.isInspection,
              status: PROCESS_TASK_STATUS.notStart,
              priority: '无',
              startTime: process.startTime,
              endTime: process.endTime,
              receptionCount: i == 0 ? process.planCount : 0,
            })
            for (const dept of process.depts) {
              await ProcessTaskDept.create({ taskId: task.id, deptId: dept.id })
            }
            await POP.update({ processTaskId: task.dataValues.id }, { where: { id: process.id } })
            const date: Date = new Date()
            const formattedDate = moment(date, 'YYYY-MM-DD HH:mm:ss').toDate()
            await ProductionOrder.update({ actualStartTime: formattedDate }, { where: { id: number } })
            count++
          }
        } else if (dto.type == '结束') {
          if (order.status != '执行中') {
            throw new HttpException('该操作只能对”执行中“状态工单操作，谢谢！', 400)
          }
          await ProductionOrder.update({ status: '已结束' }, { where: { id: number } })
          await ProcessTask.update({ status: '已结束' }, { where: { productionOrderId: number } })
        } else if (dto.type == '取消') {
          // @ts-ignore
          if (order.status != '未开始' && order.status != '执行中') {
            throw new HttpException('该操作只能对“未开始”、“执行中”状态工单操作，谢谢！', 400)
          }
          await ProductionOrder.update({ status: '已取消' }, { where: { id: number } })
          await ProcessTask.update({ status: '已结束' }, { where: { productionOrderId: number } })
        } else if (dto.type == '撤回') {
          // @ts-ignore
          if (order.status == '未开始') {
            throw new HttpException('该工单已为最初始的“未开始”状态，无法操作撤回，谢谢！', 400)
          }
          if (order.status == '已取消') {
            await ProductionOrder.update({ status: '已结束' }, { where: { id: number } })
            await ProcessTask.update({ status: '已结束' }, { where: { productionOrderId: number } })
          } else if (order.status == '已结束') {
            throw new HttpException('已产生相关业务数据,不允许撤回', 400)
            // await ProductionOrder.update({ status: '执行中' }, { where: { id: number } })
            // await ProcessTask.update({ status: '执行中' }, { where: { productionOrderId: number } })
          } else if (order.status == '执行中') {
            const tasks = await ProcessTask.findAll({ where: { productionOrderId: order.id }, attributes: ['id', 'status'] })
            if (tasks.find(v => v.status != '未开始')) {
              throw new HttpException('已产生相关业务数据,不允许撤回', 400)
            }
            await ProductionOrder.update({ status: '未开始' }, { where: { id: number } })
            await ProcessTaskDept.destroy({ where: { taskId: tasks.map(v => v.id) } })
            await ProcessTask.destroy({ where: { productionOrderId: order.id } })
          }
        }
      }
    }
    return true
  }

  public async importExcel(buffer: Buffer, loadModel) {
    const mapper: JsExclKey[] = [
      {
        keyName: '工单编号', // 假定Excel中有一个列是父物料编码
        key: 'code', // 对应BOM类中的父物料Id
      },
      {
        keyName: '产品编号',
        key: 'materialCode',
      },
      {
        keyName: '计划数', // 假定Excel中有一个列是父物料编码
        key: 'plannedOutput', // 对应BOM类中的父物料Id
      },
      {
        keyName: '计划开始时间', // 假定Excel中有一个列是父物料编码
        key: 'startTime', // 对应BOM类中的父物料Id
      },
      {
        keyName: '计划结束时间', // 假定Excel中有一个列是父物料编码
        key: 'endTime', // 对应BOM类中的父物料Id
      },
      {
        keyName: '备注',
        key: 'remark',
      },
    ]
    let result = {}
    let processSuccess = 0
    let processUpdate = 0
    let processFailed = 0
    let total = 0
    let errors: Array<string> = []

    // 将当前Sheet的数据转换为JSON
    const json = await Aide.excelToJson(buffer, mapper)

    const sequelize = POP.sequelize
    return sequelize.transaction(async transaction => {
      try {
        // 遍历每行数据并保存到数据库
        for (const rowElement of json.row) {
          rowElement.startTime = dayjs(rowElement.startTime).subtract(8, 'hour').format('YYYY-MM-DD HH:mm:ss')
          rowElement.endTime = dayjs(rowElement.endTime).subtract(8, 'hour').format('YYYY-MM-DD HH:mm:ss')
          const material = await Material.findOne({ where: { code: rowElement.materialCode } })
          let bom
          if (material) {
            bom = await BOM.findOne({ where: { materialId: material.id } })
          }
          if (!material && !bom) {
            errors.push('未找到编码为' + rowElement.material + '的BOM')
            processFailed++
            continue
          }
          const temp = await ProductionOrder.findOne({ where: { code: rowElement.code } })
          if (temp) {
            errors.push('已有相同编号的生产工单存在')
            processFailed++
            continue
          }
          //创建生产工单
          const order = await ProductionOrder.create(
            {
              code: rowElement.code,
              bomId: bom.id,
              plannedOutput: rowElement.plannedOutput,
              startTime: rowElement.startTime,
              endTime: rowElement.endTime,
              remark: rowElement.remark,
            },
            { transaction }
          )

          //创建工序列表
          const route = await ProcessRoute.findOne({
            where: { status: true },
            include: [
              {
                association: 'material',
                attributes: ['id', 'materialName', 'attribute', 'spec', 'unit'],
                where: { id: material.id },
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
                association: 'processRouteList',
                include: [
                  {
                    //工序自带的不良品项
                    association: 'process',
                    include: [
                      {
                        association: 'processItem',
                        attributes: ['id', 'name'],
                      },
                      {
                        association: 'processDept',
                        attributes: ['id', 'name'],
                      },
                    ],
                  },
                  //编辑的不良品项
                  {
                    association: 'items',
                    include: [
                      {
                        association: 'defectiveItem',
                      },
                    ],
                  },
                ],
              },
            ],
          })

          if (route.dataValues.processRouteList) {
            for (const processRouteList of route.dataValues.processRouteList) {
              const pop = await POP.create(
                {
                  productionOrderId: order.id,
                  processId: processRouteList.dataValues.processId,
                  reportRatio: processRouteList.dataValues.reportRatio,
                  isReport: processRouteList.dataValues.isReport,
                  isOutsource: processRouteList.dataValues.isOutsource,
                  sort: processRouteList.dataValues.sort,
                  fileId: processRouteList.dataValues.fileId,
                  startTime: order.dataValues.startTime,
                  endTime: order.dataValues.endTime,
                  planCount: order.dataValues.plannedOutput,
                },
                { transaction }
              )
              for (const proElement of processRouteList.dataValues.process.dataValues.processItem) {
                await POI.create({ popId: pop.id, defectiveItemId: proElement.dataValues.id }, { transaction })
              }
              for (const proElement of processRouteList.dataValues.process.dataValues.processDept) {
                await POD.create({ popId: pop.id, deptId: proElement.dataValues.id }, { transaction })
              }
            }
            // //创建用料清单
            // const boms = await BOM.findAll({ where: { parentId: order.bomId }, include: [{ association: 'parentMaterial', attributes: ['id', 'unit'] }], order: [['id', 'ASC']] })
            // let bomCount = 0
            // for (const bom1 of boms) {
            //   bomCount++
            //   await POB.create(
            //     {
            //       productionOrderId: order.id,
            //       materialId: bom1.dataValues.parentMaterial.id,
            //       quantity: bom1.quantity,
            //       unit: bom1.dataValues.parentMaterial.unit,
            //       needCount: bom1.quantity * order.plannedOutput,
            //       sort: bomCount,
            //     },
            //     { transaction }
            //   )
            // }

            // //创建工序任务单
            // const order1 = await this.find(order.id)
            // let count = 0
            // for (const process of order1.dataValues.processes) {
            //   if (count === 0) {
            //     const task = await ProcessTask.create({
            //       productionOrderId: order1.id,
            //       processId: process.processId,
            //       reportRatio: process.reportRatio,
            //       planCount: process.planCount,
            //       status: '执行中',
            //       priority: '无',
            //       startTime: process.startTime,
            //       endTime: process.endTime,
            //     })
            //
            //     for (const dept of process.dataValues.depts) {
            //       await ProcessTaskDept.create({ taskId: task.id, deptId: dept.id })
            //     }
            //   } else {
            //     const task = await ProcessTask.create({
            //       productionOrderId: order1.id,
            //       processId: process.processId,
            //       reportRatio: process.reportRatio,
            //       planCount: process.planCount,
            //       status: '未开始',
            //       priority: '无',
            //       startTime: process.startTime,
            //       endTime: process.endTime,
            //     })
            //
            //     for (const dept of process.dataValues.depts) {
            //       await ProcessTaskDept.create({ taskId: task.id, deptId: dept.id })
            //     }
            //   }
            // }
          }
          processSuccess++

          total++
        }
      } catch (error) {
        // 如果出现错误，Sequelize 将自动回滚事务
        processFailed++
        throw new HttpException(error, 400)
      }
      result = { total, success: processSuccess, update: processUpdate, failed: processFailed, errors }
      return result
    })
  }

  public async getOrderCount(user, loadModel) {
    let temp: User
    if (user) {
      temp = await User.findByPk(user.id)
      const options: FindOptions = {
        where: { status: { [Op.in]: ['未开始', '执行中'] } },
        include: [
          {
            association: 'material',
            attributes: ['id', 'materialName', 'code', 'spec', 'attribute', 'unit'],
            where: {},
          },
          {
            association: 'processes',
            include: [
              {
                association: 'process',
                attributes: ['id', 'processName'],
              },
              {
                association: 'depts',
                attributes: ['id', 'name'],
                where: { id: temp.departmentId },
              },
              {
                association: 'items',
                attributes: ['id', 'name'],
              },
            ],
          },
          {
            association: 'boms',
            include: [
              {
                association: 'material',
                attributes: ['id', 'materialName', 'code', 'spec', 'attribute', 'unit'],
              },
              {
                association: 'feedProcess',
                attributes: ['id', 'processName'],
              },
            ],
          },
        ],
      }
      const notDo = await ProductionOrder.count(options)
      const options1: FindOptions = {
        where: { status: { [Op.eq]: '已结束' } },
        include: [
          {
            association: 'material',
            attributes: ['id', 'materialName', 'code', 'spec', 'attribute', 'unit'],
            where: {},
          },
          {
            association: 'processes',
            include: [
              {
                association: 'process',
                attributes: ['id', 'processName'],
              },
              {
                association: 'depts',
                attributes: ['id', 'name'],
                where: { id: temp.departmentId },
              },
              {
                association: 'items',
                attributes: ['id', 'name'],
              },
            ],
          },
          {
            association: 'boms',
            include: [
              {
                association: 'material',
                attributes: ['id', 'materialName', 'code', 'spec', 'attribute', 'unit'],
              },
              {
                association: 'feedProcess',
                attributes: ['id', 'processName'],
              },
            ],
          },
        ],
      }
      const done = await ProductionOrder.count(options1)

      return new ResultVO({ notDo, done })
    } else {
      throw new HttpException('未查询到用户', 400)
    }
  }

  async changePriority(dto: priorityDto, id, loadModel) {
    const order = await ProductionOrder.findByPk(id)
    if (order) {
      await order.update({ priority: dto.priority })
    }
    return this.find(id, loadModel, { kingdeeCode: order.kingdeeCode })
  }

  public async simpleList(dto: FindPaginationDto, pagination: Pagination, user, loadModel: any) {
    const options: FindPaginationOptions = {
      where: {},
      attributes: ['id', 'code', 'kingdeeCode'],
      pagination,
      include: [
        {
          association: 'bom',
          attributes: ['id', 'materialId', 'remark', 'version', 'quantity'],
          where: {},
          required: false,
          include: [
            {
              association: 'parentMaterial',
              attributes: ['id', 'materialName', 'code', 'spec', 'attribute', 'unit', 'status'],
              required: false,
            },
          ],
        },
      ],
    }
    if (dto.isExp) {
      options.include = [
        options.include[0],
        {
          association: 'boms',
          required: false,
          include: [
            {
              association: 'material',
              required: false,
              attributes: ['id', 'materialName', 'code', 'spec', 'attribute', 'unit'],
              where: {},
            },
            {
              association: 'items',
              where: {},
              include: [
                {
                  association: 'material',
                  attributes: ['id', 'materialName', 'code', 'spec', 'attribute', 'unit'],
                },
              ],
            },
          ],
          where: {},
        },
      ]
    }
    if (dto.code) {
      options.where['code'] = {
        [Op.like]: `%${dto.code}%`,
      }
    }

    if (dto.name) {
      options.include[0].include[0].where['name'] = {
        [Op.like]: `%${dto.name}%`,
      }
    }

    if (dto.status) {
      if (dto.status === '未完成') {
        options.where['status'] = {
          [Op.in]: ['未开始', '执行中'],
        }
      } else {
        options.where['status'] = {
          [Op.eq]: dto.status,
        }
      }
    }

    if (dto.kingdeeCode) {
      options.where['kingdeeCode'] = {
        [Op.like]: `%${dto.kingdeeCode}%`,
      }
    }

    if (dto.materialCode) {
      options.include[0].include[0].where['code'] = {
        [Op.like]: `%${dto.materialCode}%`,
      }
    }

    if (dto.isDept) {
      if (user) {
        const user1 = await User.findByPk(user.id)
        if (user1.departmentId) {
          options.include[1].include[1].where['id'] = {
            [Op.eq]: user1.departmentId,
          }
        }
      }
    }
    const result = await Paging.diyPaging(ProductionOrder, pagination, options)

    if (dto.warehouseId) {
      for (const datum of result.data) {
        for (const detail of datum.dataValues.boms) {
          const warehouseCount = await WarehouseMaterial.findOne({
            where: {
              warehouseId: dto.warehouseId,
              materialId: detail.materialId,
            },
          })
          detail.dataValues.material.setDataValue('warehouseCount', warehouseCount ? warehouseCount.count : 0)
        }
      }
    }
    return result
  }

  public async asyncKingdee() {
    // let filterString = await KingdeeeService.buildFilterString([
    //   { key: 'FPrdOrgId.FNumber', type: 'string', value: '102' },
    //   { key: 'FWorkshopID.FName', type: 'string', value: '线束车间' },
    // ])
    let filterString = `FDate>='2025-03-25' and FDocumentStatus='C' and FStatus='4' and FBillType = '123f39178eb2424c8449f992e1fff1ee'`
    let data = await KingdeeeService.getList(
      'PRD_MO',
      'FTreeEntity_FEntryId,FID,FBillNo,FRowId,FWorkShopID,FWorkshopID.FName,FPlanStartDate,FPlanFinishDate,FMaterialId,FMaterialId.FMasterID,FQty,FBomId,FRoutingId,FSrcBillType,FSrcBillNo,FTreeEntity_FSEQ,FBillType.FName,FStatus,FDocumentStatus',
      filterString
    )
    // return data
    const dataMap = data.reduce((map, item) => {
      map[item.FBillNo] = item
      return map
    }, {} as Record<string, any>)
    let mate = []
    let code
    //按规则创建编码
    const date = new Date()
    const year = date.getFullYear().toString().substring(2)
    const month = date.getMonth().toString().padStart(2, '0')
    for (const item of data) {
      //C=已审核 4=开工 不满足条件就跳过
      // if (item.FDocumentStatus != 'C' || item.FStatus != '4') continue
      if (code) {
        const oldNO = code
        const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
        let num = parseInt(lastFourChars)
        num++
        let newNO = num.toString().padStart(4, '0')

        code = 'SCDD' + year + month + newNO
      } else {
        const temp1 = await ProductionOrder.findOne({
          order: [['id', 'DESC']],
          where: { code: { [Op.like]: `SCGD${year}${month}%` } },
        })

        if (temp1) {
          const oldNO = temp1.code
          const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
          let num = parseInt(lastFourChars)
          num++
          let newNO = num.toString().padStart(4, '0')

          code = 'SCDD' + year + month + newNO
        } else {
          code = 'SCDD' + year + month + '0001'
        }
      }
      let topMaterialId
      // if (item.FSrcBillType && item.FSrcBillType.length > 0 && item.FSrcBillType === 'PRD_MO' && item['FWorkshopID.FName'] === '线束车间') {
      const parentOrder = dataMap[item.FSrcBillNo]
      if (parentOrder) {
        topMaterialId = parentOrder.FMaterialId // 从上级单据中直接获取物料 ID
      }

      let temp = {
        id: item.FBillNo + String(item['FTreeEntity.FEntryId']),
        kingdeeCode: item.FBillNo,
        kingdeeRow: item.FRowId,
        bomId: item.FBomId ? item.FBomId : null,
        code: code,
        topMaterialId: topMaterialId ? topMaterialId : null,
        subMaterialId: item['FMaterialId.FMasterID'],
        FStatus: item.FStatus,
        plannedOutput: item.FQty,
        startTime: item.FPlanStartDate,
        endTime: item.FPlanFinishDate,
        fid: item.FID,
        fseq: item.FTreeEntity_FSEQ,
        billType: item['FBillType.FName'],
      }
      mate.push(temp)
    }
    for (let i = 0; i < mate.length; i += 100) {
      let batch = mate.slice(i, i + 100)
      // console.log(batch)
      //查询bom是否存在不存在就过滤保存
      const bomIds = _.uniq(batch.map(item => item.bomId)).filter(id => id !== null)
      if (bomIds.length) {
        const existingBoms = await BOM.findAll({
          where: { id: bomIds },
          attributes: ['id'],
        })
        const existingBomIds = existingBoms.map(bom => bom.id)
        batch = batch.filter(item => existingBomIds.includes(item.bomId))
      }
      let result = await ProductionOrder.bulkCreate(batch, {
        updateOnDuplicate: [
          'id',
          'kingdeeCode',
          'kingdeeRow',
          'bomId',
          'code',
          'topMaterialId',
          'subMaterialId',
          'FStatus',
          'plannedOutput',
          'startTime',
          'endTime',
          'fid',
          'salesOrderCode',
          'billType',
        ],
      })

      // 手动获取 id
      if (result.some(record => record.id === null)) {
        result = await ProductionOrder.findAll({
          where: {
            kingdeeCode: batch.map(item => item.kingdeeCode),
            kingdeeRow: batch.map(item => item.kingdeeRow),
          },
        })
      }

      // 批量获取最新的生产订单数据字段
      const productionOrderIds = result.map(po => po.id)
      const freshProductionOrders = await ProductionOrder.findAll({
        where: { id: productionOrderIds },
        attributes: ['id', 'subMaterialId', 'plannedOutput', 'startTime', 'endTime', 'schedulingStatus'],
      })

      // 创建到现有映射
      const productionOrderMap = new Map()
      freshProductionOrders.forEach(po => {
        productionOrderMap.set(po.id, po)
      })

      for (const productionOrder of result) {
        // 使用映射获取最新数据，避免重复数据库查询
        const freshProductionOrder = productionOrderMap.get(productionOrder.id) || productionOrder

        const route = await ProcessRoute.findOne({
          where: { status: true },
          include: [
            {
              association: 'processRouteList',
              include: [
                {
                  //工序自带的不良品项
                  association: 'process',
                  include: [
                    {
                      association: 'processItem',
                      attributes: ['id', 'name'],
                    },
                    {
                      association: 'processDept',
                      attributes: ['id', 'name'],
                    },
                  ],
                },
              ],
            },
            {
              association: 'material',
              attributes: ['id', 'materialName', 'attribute', 'spec', 'unit'],
              where: { id: freshProductionOrder.subMaterialId },
            },
          ],
        })
        if (route && route.dataValues.processRouteList && route.dataValues.processRouteList.length > 0) {
          const existingPops = await POP.findAll({
            where: { productionOrderId: freshProductionOrder.id },
          })
          for (const processRouteList of route.dataValues.processRouteList) {
            const existingPop = existingPops.find(v => v.processId === processRouteList.processId)
            if (existingPop) {
              // 更新已存在的工序任务，使用最新的生产订单数据
              await existingPop.update({
                reportRatio: processRouteList.reportRatio,
                isReport: processRouteList.isReport,
                isOutsource: processRouteList.isOutsource,
                isInspection: processRouteList.isInspection,
                sort: processRouteList.sort,
                planCount: freshProductionOrder.plannedOutput,
                goodCount: existingPop.goodCount,
                badCount: existingPop.badCount,
                fileId: processRouteList.fileId,
                ...(freshProductionOrder.schedulingStatus == '已排产' ? {} : { startTime: freshProductionOrder.startTime, endTime: freshProductionOrder.endTime }),
              })
            } else if (existingPops.length == 0) {
              //如果已经创建或就不会创建新的工序绑定
              const pro = await POP.create({
                productionOrderId: freshProductionOrder.id,
                processId: processRouteList.processId,
                reportRatio: processRouteList.reportRatio,
                isReport: processRouteList.isReport,
                isOutsource: processRouteList.isOutsource,
                isInspection: processRouteList.isInspection,
                sort: processRouteList.sort,
                planCount: freshProductionOrder.plannedOutput,
                goodCount: 0,
                badCount: 0,
                fileId: processRouteList.fileId,
                startTime: freshProductionOrder.startTime,
                endTime: freshProductionOrder.endTime,
              })
              for (const dept of processRouteList.dataValues.process.dataValues.processDept) {
                await POD.create({ popId: pro.id, deptId: dept.id })
              }
              for (const item of processRouteList.dataValues.process.dataValues.processItem) {
                await POI.create({ popId: pro.id, defectiveItemId: item.id })
              }
            }
          }
        }
      }
    }

    // let filterString2 = await KingdeeeService.buildFilterString([
    //   { key: 'FWorkshopID.FName', type: 'string', value: '线束车间' },
    // ])
    let filterString2 = "FCreateDate>='2025-03-25' and FMoEntryStatus='4' and FMOType.FName = '汇报入库-普通生产'"
    data = await KingdeeeService.getList(
      'PRD_PPBOM',
      'FMOEntryID,FID,FBillNo,FMaterialID.FMasterID,FBOMID,FWorkshopID,FWorkshopID.FName,FUnitID,FMOBillNO,FQty,FMOEntrySeq,FDocumentStatus,FDescription',
      filterString2
    )
    mate = []
    let unitList = await ApiDict.findAll({
      where: { name: '单位', xtName: '金蝶' },
      attributes: ['fid', 'code', 'content'],
    })
    for (const item of data) {
      let unitName = null
      for (const unit of unitList) {
        if (unit.fid == item.FBaseUnitId) {
          unitName = unit.content
        }
      }
      let temp = {
        id: item.FID,
        productionOrderId: item.FMOBillNO + item.FMOEntryID,
        code: item.FBillNo,
        materialId: item['FMaterialID.FMasterID'],
        bomId: item.FBOMID,
        workShopId: item.FWorkshopID,
        unit: unitName,
        count: item.FQty,
        orderRowNum: item.FMOEntrySeq,
        remark: item.FDescription,
      }
      mate.push(temp)
    }
    // console.log(mate)
    for (let i = 0; i < mate.length; i += 100) {
      let batch = mate.slice(i, i + 100)
      //查询bom是否存在不存在就过滤保存
      const bomIds = _.uniq(batch.map(item => item.bomId)).filter(id => id !== null)
      if (bomIds.length) {
        const existingBoms = await BOM.findAll({
          where: { id: bomIds },
          attributes: ['id'],
        })
        const existingBomIds = existingBoms.map(bom => bom.id)
        batch = batch.filter(item => existingBomIds.includes(item.bomId))
      }
      let result = await POB.bulkCreate(batch, {
        updateOnDuplicate: ['id', 'productionOrderId', 'code', 'materialId', 'bomId', 'workShopId', 'unit', 'count', 'orderRowNum', 'remark'],
        // ignoreDuplicates: true,
      })
    }

    data = await KingdeeeService.getList(
      'PRD_PPBOM',
      'FEntity_FEntryId,FID,FBillNo,FReplaceGroup,FMaterialID2.FMasterID,FUseRate,FMaterialType,FNumerator,FDenominator,FUnitID2,FMustQty,FIssueType,FTranslateQty,FPickedQty,FRePickedQty,FNoPickedQty,FACTUALPICKQTY',
      filterString2
    )
    // 分组数据
    const groupByFBillNo = (data: any[][]) => {
      return data.reduce((groups, row) => {
        const billNo = row['FBillNo']
        if (!groups[billNo]) {
          groups[billNo] = []
        }
        groups[billNo].push(row)
        return groups
      }, {} as Record<string, any[]>)
    }
    const groupedData = groupByFBillNo(data)
    mate = []
    for (const groupedDataKey in groupedData) {
      const rows = groupedData[groupedDataKey]
      for (const item of rows) {
        let temp
        let unitName = null
        for (const unit of unitList) {
          if (unit.fid == item.FBaseUnitId) {
            unitName = unit.content
          }
        }
        temp = {
          id: item.FEntity_FEntryId,
          pobId: item.FID,
          item: item.FReplaceGroup,
          materialId: item['FMaterialID2.FMasterID'],
          ratio: item.FUseRate,
          type: item.FMaterialType,
          numerator: item.FNumerator,
          denominator: item.FDenominator,
          sendCount: item.FMustQty,
          method: item.FIssueType,
          transferCount: item.FTranslateQty,
          receivedCount: item.FPickedQty,
          unclaimedCount: item.FNoPickedQty,
          replaceCount: item.FRePickedQty,
          actualReceived: item.FACTUALPICKQTY,
        }
        mate.push(temp)
      }
    }
    for (let i = 0; i < mate.length; i += 100) {
      let batch = mate.slice(i, i + 100)
      //查询pob是否存在不存在就过滤保存
      const pobIdIds = _.uniq(batch.map(item => item.pobId)).filter(id => id !== null)
      if (pobIdIds.length) {
        const existingBoms = await POB.findAll({
          where: { id: pobIdIds },
          attributes: ['id'],
        })
        const existingBomIds = existingBoms.map(bom => bom.id)
        batch = batch.filter(item => existingBomIds.includes(item.pobId))
      }
      let result = await POBD.bulkCreate(batch, {
        updateOnDuplicate: [
          'id',
          'pobId',
          'item',
          'materialId',
          'ratio',
          'type',
          'numerator',
          'denominator',
          'sendCount',
          'method',
          'transferCount',
          'receivedCount',
          'unclaimedCount',
          'replaceCount',
          'actualReceived',
        ],
      })
    }

    return { data: true }
  }

  async findAllPOB(dto: POBPaginationDto, pagination: Pagination, user) {
    const options: FindPaginationOptions = {
      where: {},
      include: [
        {
          association: 'boms',
          include: [
            {
              association: 'items',
              where: {},
              include: [
                {
                  association: 'material',
                  attributes: ['id', 'materialName', 'code', 'spec', 'unit'],
                },
              ],
            },
          ],
          where: {},
        },
      ],
    }
    if (dto.code) {
      options.where['kingdeeCode'] = {
        [Op.like]: `%${dto.code}%`,
      }
    }

    if (dto.materialName) {
      options.include[0].include[0].include[0]['where'] = {
        name: { [Op.like]: `%${dto.materialName}%` },
      }
    }

    if (dto.materialCode) {
      options.include[0].include[0].include[0]['where'] = {
        code: { [Op.like]: `%${dto.materialCode}%` },
      }
    }
    const result = await ProductionOrder.findPagination<ProductionOrder>(options)
    let data = []
    for (const datum of result.data) {
      for (const bom of datum.dataValues.boms) {
        for (const item of bom.dataValues.items) {
          if (item.dataValues.material) {
            let temp = {
              id: item.dataValues.material.id,
              materialId: item.dataValues.material.id,
              name: item.dataValues.material.materialName,
              code: item.dataValues.material.code,
              spec: item.dataValues.material.spec,
              unit: item.dataValues.material.unit,
              pobCode: bom.code,
            }
            //判断data是否已存在temp
            if (!data.some(item => item.id === temp.id)) {
              data.push(temp)
            }
          }
        }
      }
    }

    return data
  }

  async ERPCodeSelect(dto: ERPFindPaginationDto, pagination: Pagination, user) {
    const options: FindPaginationOptions = {
      where: {},
      attributes: ['id', 'code', 'kingdeeCode'],
    }
    if (dto.code) {
      options.where['kingdeeCode'] = {
        [Op.like]: `%${dto.code}%`,
      }
    }
    const result = await ProductionOrder.findAll(options)

    const uniqueResult = Array.from(new Map(result.map(item => [item.kingdeeCode, item])).values())

    const data = Aide.diyPaging(uniqueResult, pagination)

    return data
  }
}
