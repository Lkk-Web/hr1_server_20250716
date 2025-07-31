import { Pagination } from '@common/interface'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Injectable } from '@nestjs/common'
import { ProductionOrder } from '@model/production/productionOrder.model'
import { actionDto, CProductionOrderDTO, ERPFindPaginationDto, FindPaginationDto, pobDto, POBPaginationDto, priorityDto } from './productionOrder.dto'
import { FindOptions, Op, or, where, Sequelize } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Material } from '@model/base/material.model'
import { POP } from '@model/production/POP.model'
import { POD } from '@model/production/PODmodel'
import { POI } from '@model/production/POI.model'
import { POB } from '@model/production/POB.model'
import { ProcessTask } from '@model/production/processTask.model'
import { ProductionOrderTask } from '@model/production/productionOrderTask.model'
import { ProcessTaskDept } from '@model/production/processTaskDept.model'
import { Aide, JsExclKey } from '@library/utils/aide'
import { ProcessRoute } from '@model/process/processRoute.model'
import { User } from '@model/auth/user'
import { ResultVO } from '@common/resultVO'
import { BOM } from '@model/base/bom.model'
import { ApiDict, DefectiveItem, PerformanceConfig, Process, Organize, WarehouseMaterial, WorkCenterOfPOP } from '@model/index'
import { Paging } from '@library/utils/paging'
import { KingdeeeService } from '@library/kingdee'
import { POBDetail } from '@model/production/POBDetail.model'
// import { SENTENCE } from '@common/enum'
import { deleteIdsDto } from '@common/dto'
import { BomService } from '../baseData/bom/bom.service'
import { PROCESS_TASK_STATUS, ProductionOrderTaskStatus, ProductSerialStatus } from '@common/enum'
import { ProductSerial } from '@model/production/productSerial.model'
import moment = require('moment')
import dayjs = require('dayjs')
import _ = require('lodash')
import { log } from 'console'
import { K3Mapping } from '@library/kingdee/kingdee.keys.config'
import { kingdeeServiceConfig } from '@common/config'
import { ProductionOrderDetail } from '@model/production/productionOrderDetail.model'

@Injectable()
export class ProductionOrderService {
  constructor(
    @InjectModel(ProductionOrder)
    private productionOrderModel: typeof ProductionOrder,
    private bomService: BomService
  ) {}

  public async delete(id: number, loadModel) {
    const productOrder = await ProductionOrder.findByPk(id, { attributes: ['id', 'status'] })
    if (!productOrder) Aide.throwException(400, '生产工单不存在')
    const transaction = await PerformanceConfig.sequelize.transaction()
    try {
      //删除依赖关系
      const process = await POP.findAll({ where: { productionOrderId: id }, attributes: ['id'] })
      const pobs = await POB.findAll({ where: { productionOrderDetailId: id }, attributes: ['id'] })
      await POD.destroy({ where: { popId: process.map(v => v.id) }, transaction })
      await POI.destroy({ where: { popId: process.map(v => v.id) }, transaction })
      await WorkCenterOfPOP.destroy({ where: { POPId: process.map(v => v.id) }, transaction })
      await POBDetail.destroy({ where: { pobId: pobs.map(v => v.id) }, transaction })
      await POP.destroy({ where: { productionOrderId: id }, transaction })
      await POB.destroy({ where: { productionOrderDetailId: id }, transaction })
      await productOrder.destroy({ transaction })
      await transaction.commit()
      return { code: 200, message: '删除成功' }
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
          association: 'productionOrderDetail',
          where: {},
          required: false,
          attributes: {
            exclude: ['productionOrderId'],
          },
          include: [
            {
              association: 'boms',
              include: [{ association: 'pobDetail' }],
            },
          ],
        },
        // {
        //   association: 'processes',
        //   include: [
        //     {
        //       association: 'process',
        //       attributes: ['id', 'processName'],
        //     },
        //     {
        //       association: 'depts',
        //       attributes: ['id', 'name'],
        //       through: {
        //         attributes: [], // 隐藏中间表的数据
        //       },
        //     },
        //     {
        //       association: 'items',
        //       attributes: ['id', 'name'],
        //       through: {
        //         attributes: [], // 隐藏中间表的数据
        //       },
        //     },
        //     {
        //       association: 'file',
        //       attributes: ['id', 'name', 'versionCode', 'url'],
        //       where: {},
        //       required: false,
        //     },
        //   ],
        // },
      ],
    }

    const res = await ProductionOrder.findOne(options)
    return res
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, user: User) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      order: [['kingdeeCode', 'DESC']],
      include: [
        {
          association: 'salesOrder',
          attributes: ['id', 'code'],
          where: {},
        },
        {
          association: 'productionOrderDetail',
          where: {},
          required: false,
          attributes: {
            exclude: ['productionOrderId', 'materialId'], // 👈 在这里排除你不想要的字段
          },
          include: [
            {
              association: 'material',
              required: true,
              // include: [
              //   {
              //     association: 'boms',
              //     required: false,
              //   },
              // ],
              where: {},
            },
          ],
        },
        // {
        //   // {
        //   //   association: 'processes',
        //   //   attributes: [
        //   //     'id',
        //   //     'productionOrderId',
        //   //     'processId',
        //   //     'reportRatio',
        //   //     'reportRatio',
        //   //     'isOutsource',
        //   //     'sort',
        //   //     'planCount',
        //   //     'goodCount',
        //   //     'badCount',
        //   //     'startTime',
        //   //     'endTime',
        //   //     'actualStartTime',
        //   //     'actualEndTime',
        //   //     'processTaskId',
        //   //     'isInspection',
        //   //     'reportQuantity',
        //   //   ],
        //   //   include: [
        //   //     {
        //   //       association: 'process',
        //   //       attributes: ['id', 'processName'],
        //   //       include: [
        //   //         {
        //   //           association: 'children',
        //   //           attributes: ['id', 'processName', 'reportRatio', 'isOut', 'createdAt', 'updatedAt'],
        //   //           required: false,
        //   //         },
        //   //       ],
        //   //     },
        //   //     {
        //   //       association: 'workCenter',
        //   //       // where: {},
        //   //       attributes: ['id', 'name'],
        //   //       through: {
        //   //         attributes: ['id'],
        //   //       },
        //   //     },
        //   //     {
        //   //       association: 'depts',
        //   //       attributes: ['id', 'name'],
        //   //       through: {
        //   //         attributes: [], // 隐藏中间表的数据
        //   //       },
        //   //     },
        //   //     {
        //   //       association: 'items',
        //   //       attributes: ['id', 'name'],
        //   //       through: {
        //   //         attributes: [], // 隐藏中间表的数据
        //   //       },
        //   //     },
        //   //     {
        //   //       association: 'file',
        //   //       attributes: ['id', 'name', 'versionCode', 'url'],
        //   //       where: {},
        //   //       required: false,
        //   //     },
        //   //   ],
        //   // },
        // },
      ],
    }

    if (dto.kingdeeCode) {
      options.where['kingdeeCode'] = {
        [Op.like]: `%${dto.kingdeeCode}%`,
      }
    }

    if (dto.code) {
      options.include[0].where['code'] = {
        [Op.like]: `%${dto.code}%`,
      }
    }

    // if (dto.name) {
    //   options.include[0].include[0].where['name'] = {
    //     [Op.like]: `%${dto.name}%`,
    //   }
    // }

    // if (dto.status) {
    //   if (dto.status === '未完成') {
    //     options.where['status'] = {
    //       [Op.in]: ['未开始', '执行中'],
    //     }
    //   } else {
    //     options.where['status'] = {
    //       [Op.eq]: dto.status,
    //     }
    //   }
    // }

    if (dto.materialCode) {
      options.include[1].include[0].where['code'] = {
        [Op.like]: `%${dto.materialCode}%`,
      }
    }

    // if (dto.isDept) {
    //   if (user) {
    //     const user1 = await User.findByPk(user.id)
    //     if (user1.departmentId) {
    //       options.include[1].include[1].where['id'] = {
    //         [Op.eq]: user1.departmentId,
    //       }
    //     }
    //   }
    // }

    // if (dto.startTime) {
    //   options.where['startTime'] = {
    //     [Op.gte]: moment(dto.startTime).startOf('day').toISOString(),
    //     [Op.lte]: moment(dto.startTime).endOf('day').toISOString(),
    //   }
    // }

    // if (dto.endTime) {
    //   options.where['endTime'] = {
    //     [Op.gte]: moment(dto.endTime).startOf('day').toISOString(),
    //     [Op.lte]: moment(dto.endTime).endOf('day').toISOString(),
    //   }
    // }

    // // 工序排产
    // if (dto.popStartTime && dto.popEndTime) {
    //   // 筛选startTime >= dto.startTime 且 endTime <= dto.endTime 的记录
    //   options.where['startTime'] = { [Op.gte]: dto.popStartTime }
    //   options.where['endTime'] = { [Op.lte]: dto.popEndTime }
    // } else if (dto.popStartTime) {
    //   // 只有开始时间，筛选startTime >= dto.startTime的记录
    //   options.where['startTime'] = { [Op.gte]: dto.popStartTime }
    // } else if (dto.popEndTime) {
    //   // 只有结束时间，筛选endTime <= dto.endTime的记录
    //   options.where['endTime'] = { [Op.lte]: dto.popEndTime }
    // }

    // if (dto.schedulingStatus) {
    //   options.where['schedulingStatus'] = dto.schedulingStatus
    // }

    const result = await ProductionOrder.findPagination<ProductionOrder>(options)
    // // @ts-ignore
    // // for (const datum of result.data) {
    // //   for (const process of datum.dataValues.processes) {
    // //     const temp = await PerformanceConfig.findOne({
    // //       where: {
    // //         materialId: datum.dataValues.bom.dataValues.materialId,
    // //         processId: process.processId,
    // //       },
    // //     })
    // //     if (temp) {
    // //       process.setDataValue('performanceConfig', temp)
    // //     }
    // //   }
    // // }

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
          const temp = await ProductionOrder.findOne({ where: { kingdeeCode: rowElement.code } })
          if (temp) {
            errors.push('已有相同编号的生产工单存在')
            processFailed++
            continue
          }
          //创建生产工单
          const order = await ProductionOrder.create(
            {
              kingdeeCode: rowElement.code,
              // plannedOutput: rowElement.plannedOutput,
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
                  // planCount: order.dataValues.plannedOutput,
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
    // 生产订单 同步
    {
      const { formID, dbModel, keys, redisKey, detailTypes, detailKeys, dbModelDetail, filterString } = K3Mapping['PRD_MO']

      let data = await KingdeeeService.getListV2(formID, keys.map(v => v[1]).join(','), filterString)

      // 外键0判Null
      data.map(v => {
        if (v.FSaleOrderId == 0) delete v.FSaleOrderId
        return v
      })

      data = KingdeeeService.parseKingdeeDataByMapping(data, keys)
      await dbModel.bulkCreate(data, { updateOnDuplicate: keys.map(v => v[2]) as (keyof ProductionOrder)[] })
      console.log('同步生产订单完成')
      if (detailTypes) {
        // 读取金蝶接口方式
        let detailData = await KingdeeeService.getListV2(formID, detailKeys.map(v => v[1]).join(','), filterString)
        detailData = KingdeeeService.parseKingdeeDataByMapping(detailData, detailKeys)
        let cacheOrder = { key: '', value: 1 }
        detailData = detailData.map(v => {
          if (cacheOrder.key !== v.orderCode) {
            cacheOrder.key = v.orderCode
            cacheOrder.value = 1
          }
          v.orderCode += `-${cacheOrder.value.toString().padStart(2, '0')}`
          cacheOrder.value += 1

          return v
        })
        await dbModelDetail.bulkCreate(detailData, { updateOnDuplicate: detailKeys.map(v => v[2]) as (keyof ProductionOrderDetail)[] })
        console.log('同步生产订单明细完成')
      }
    }

    //  排产计划时间
    {
      //   // 批量获取最新的生产订单数据字段
      //   const productionOrderIds = result.map(po => po.id)
      //   const freshProductionOrders = await ProductionOrder.findAll({
      //     where: { id: productionOrderIds },
      //     attributes: ['id', 'plannedOutput', 'startTime', 'endTime', 'schedulingStatus'],
      //   })
      //   // 创建到现有映射
      //   const productionOrderMap = new Map()
      //   freshProductionOrders.forEach(po => {
      //     productionOrderMap.set(po.id, po)
      //   })
      //   for (const productionOrder of result) {
      //     // 使用映射获取最新数据，避免重复数据库查询
      //     const freshProductionOrder = productionOrderMap.get(productionOrder.id) || productionOrder
      //     const route = await ProcessRoute.findOne({
      //       where: { status: true },
      //       include: [
      //         {
      //           association: 'processRouteList',
      //           include: [
      //             {
      //               //工序自带的不良品项
      //               association: 'process',
      //               include: [
      //                 {
      //                   association: 'processItem',
      //                   attributes: ['id', 'name'],
      //                 },
      //                 {
      //                   association: 'processDept',
      //                   attributes: ['id', 'name'],
      //                 },
      //               ],
      //             },
      //           ],
      //         },
      //       ],
      //     })
      //     if (route && route.dataValues.processRouteList && route.dataValues.processRouteList.length > 0) {
      //       const existingPops = await POP.findAll({
      //         where: { productionOrderId: freshProductionOrder.id },
      //       })
      //       for (const processRouteList of route.dataValues.processRouteList) {
      //         const existingPop = existingPops.find(v => v.processId === processRouteList.processId)
      //         if (existingPop) {
      //           // 更新已存在的工序任务，使用最新的生产订单数据
      //           await existingPop.update({
      //             reportRatio: processRouteList.reportRatio,
      //             isReport: processRouteList.isReport,
      //             isOutsource: processRouteList.isOutsource,
      //             isInspection: processRouteList.isInspection,
      //             sort: processRouteList.sort,
      //             planCount: freshProductionOrder.plannedOutput,
      //             goodCount: existingPop.goodCount,
      //             badCount: existingPop.badCount,
      //             fileId: processRouteList.fileId,
      //             ...(freshProductionOrder.schedulingStatus == '已排产' ? {} : { startTime: freshProductionOrder.startTime, endTime: freshProductionOrder.endTime }),
      //           })
      //         } else if (existingPops.length == 0) {
      //           //如果已经创建或就不会创建新的工序绑定
      //           const pro = await POP.create({
      //             productionOrderId: freshProductionOrder.id,
      //             processId: processRouteList.processId,
      //             reportRatio: processRouteList.reportRatio,
      //             isReport: processRouteList.isReport,
      //             isOutsource: processRouteList.isOutsource,
      //             isInspection: processRouteList.isInspection,
      //             sort: processRouteList.sort,
      //             planCount: freshProductionOrder.plannedOutput,
      //             goodCount: 0,
      //             badCount: 0,
      //             fileId: processRouteList.fileId,
      //             startTime: freshProductionOrder.startTime,
      //             endTime: freshProductionOrder.endTime,
      //           })
      //           for (const dept of processRouteList.dataValues.process.dataValues.processDept) {
      //             await POD.create({ popId: pro.id, deptId: dept.id })
      //           }
      //           for (const item of processRouteList.dataValues.process.dataValues.processItem) {
      //             await POI.create({ popId: pro.id, defectiveItemId: item.id })
      //           }
      //         }
      //       }
      //     }
      //   }
      // }
    }

    // 生产用料清单 同步
    {
      const { formID, dbModel, keys, redisKey, detailTypes, detailKeys, dbModelDetail, filterString, pageSize } = K3Mapping['PRD_PPBOM']
      let data = await KingdeeeService.getListV2(formID, keys.map(v => v[1]).join(','), filterString)
      data = KingdeeeService.parseKingdeeDataByMapping(data, keys)
      await dbModel.bulkCreate(data, { updateOnDuplicate: keys.map(v => v[2]) as (keyof POB)[] })
      console.log('同步生产用料清单完成')
      if (detailTypes) {
        // 读取金蝶接口方式
        let detailData = await KingdeeeService.getListV2(formID, detailKeys.map(v => v[1]).join(','), filterString, pageSize, 0)
        detailData = KingdeeeService.parseKingdeeDataByMapping(detailData, detailKeys)
        await dbModelDetail.bulkCreate(detailData, { updateOnDuplicate: detailKeys.map(v => v[2]) as (keyof POBDetail)[] })
        console.log('同步生产用料清单明细完成')
      }
    }

    return { code: 200, message: '同步成功', data: true }
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
      // for (const bom of datum.dataValues.boms) {
      //   for (const item of bom.dataValues.items) {
      //     if (item.dataValues.material) {
      //       let temp = {
      //         id: item.dataValues.material.id,
      //         materialId: item.dataValues.material.id,
      //         name: item.dataValues.material.materialName,
      //         code: item.dataValues.material.code,
      //         spec: item.dataValues.material.spec,
      //         unit: item.dataValues.material.unit,
      //         pobCode: bom.kingdeeCode,
      //       }
      //       //判断data是否已存在temp
      //       if (!data.some(item => item.id === temp.id)) {
      //         data.push(temp)
      //       }
      //     }
      //   }
      // }
    }

    return data
  }

  async splitOrder(productionOrderDetailId: string, splitQuantity: number, remark?: string, user?: any) {
    const transaction = await ProductionOrder.sequelize.transaction()

    try {
      // 1. 查找生产订单详情
      const productionOrderDetail = await ProductionOrderDetail.findByPk(productionOrderDetailId, {
        include: [
          {
            association: 'material',
            include: [
              {
                association: 'boms',
                where: { materialId: { [Op.col]: 'ProductionOrderDetail.materialId' } },
                required: false,
              },
            ],
          },
        ],
        transaction,
      })

      if (!productionOrderDetail) {
        throw new Error('生产订单详情不存在')
      }

      // 2. 验证拆分数量
      if (splitQuantity <= 0) {
        throw new Error('拆分数量必须大于0')
      }

      if (splitQuantity > productionOrderDetail.plannedOutput - productionOrderDetail.actualOutput) {
        throw new Error('拆分数量不能大于计划产出数量')
      }

      // 3. 检查拆单状态
      if (productionOrderDetail.splitStatus === '已排产') {
        throw new Error('该订单详情已经排产，不能重复排产')
      }

      // 4. 生成ProductionOrderTask拆单编号 (ordercode-01格式)
      const existingSplitOrders = await ProductionOrderTask.findAll({
        where: {
          orderCode: {
            [Op.like]: `${productionOrderDetail.orderCode}-%`,
          },
        },
        order: [['orderCode', 'DESC']],
        transaction,
      })

      let nextSequence = 1
      if (existingSplitOrders.length > 0) {
        const lastDashIndex = existingSplitOrders[0].orderCode.lastIndexOf('-')
        const sequenceStr = existingSplitOrders[0].orderCode.substring(lastDashIndex + 1)
        const sequenceNum = parseInt(sequenceStr, 10)
        if (!isNaN(sequenceNum)) {
          nextSequence = sequenceNum + 1
        }
      }

      const newOrderCode = `${productionOrderDetail.orderCode}-${nextSequence.toString().padStart(2, '0')}`

      const newSplitOrder = await ProductionOrderTask.create(
        {
          orderCode: newOrderCode,
          productionOrderDetailId: productionOrderDetailId,
          materialId: productionOrderDetail.materialId,
          splitQuantity: splitQuantity,
          status: ProductionOrderTaskStatus.NOT_STARTED,
          startTime: productionOrderDetail.startTime,
          endTime: productionOrderDetail.endTime,
          workShop: productionOrderDetail.workShop,
          priority: '无',
          remark: remark || `从订单${productionOrderDetail.orderCode}拆分而来，拆分数量：${splitQuantity}`,
          createdBy: user?.userName || 'system',
          actualOutput: 0,
          goodCount: 0,
          badCount: 0,
        },
        { transaction }
      )

      // 5. 根据group规则生成产品序列号
      const productSerials = []

      let startSequence = 1
      const group = productionOrderDetail.material.boms[0].group

      // if (group === '0101') {
      const currentYear = new Date().getFullYear().toString()
      const yearPrefix = `${currentYear}`

      const existingSerials = await ProductSerial.findAll({
        where: {
          serialNumber: {
            [Op.like]: `${group}-${yearPrefix}%`,
          },
        },
        order: [['serialNumber', 'DESC']],
        limit: 1,
        transaction,
      })

      if (existingSerials.length > 0) {
        startSequence = parseInt(existingSerials[0].serialNumber.slice(-5)) + 1
      }
      // }

      for (let i = 0; i < splitQuantity; i++) {
        let serialNumber: string
        // if (group === '0101') {
        const currentYear = new Date().getFullYear().toString() //2025
        const sequenceNumber = (startSequence + i).toString().padStart(4, '0') //0001
        serialNumber = `${group}-${currentYear}2${sequenceNumber}`
        // }

        const productSerial = await ProductSerial.create(
          {
            serialNumber: serialNumber,
            productionOrderTaskId: newSplitOrder.id,
            status: ProductSerialStatus.NOT_STARTED,
            quantity: 1,
            qualityStatus: '待检',
            processProgress: [], // 初始化为空数组，后续根据工艺路线填充
            createdBy: user?.userName || 'system',
            // remark: `序列号${i}/${splitQuantity}`,
          },
          { transaction }
        )
        productSerials.push(productSerial)
      }

      // 6. 更新原生产订单详情的计划产出数量
      await productionOrderDetail.update(
        {
          actualOutput: productionOrderDetail.actualOutput + splitQuantity,
          splitStatus: productionOrderDetail.actualOutput + splitQuantity == productionOrderDetail.plannedOutput ? '已排产' : '排产中',
        },
        { transaction }
      )

      await transaction.commit()

      return {
        code: 200,
        message: '拆单成功',
        data: {
          originalOrder: {
            orderCode: productionOrderDetail.orderCode,
            remain_quantity: productionOrderDetail.plannedOutput - productionOrderDetail.actualOutput,
          },
          newSplitOrder: {
            id: newSplitOrder.id,
            orderCode: newOrderCode,
            splitQuantity: splitQuantity,
            status: newSplitOrder.status,
            remark: newSplitOrder.remark,
            createdBy: user?.userName || 'system',
          },
          productSerials: productSerials.map(serial => ({
            id: serial.id,
            serialNumber: serial.serialNumber,
            status: serial.status,
            quantity: serial.quantity,
            qualityStatus: serial.qualityStatus,
          })),
        },
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
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
