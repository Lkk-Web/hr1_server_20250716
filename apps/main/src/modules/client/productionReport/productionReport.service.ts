import { Pagination } from '@common/interface'
import { HttpException, Injectable } from '@nestjs/common'
import { ProductionReport } from '@model/production/productionReport.model'
import { batchDto, CProductionReportDto, FindPaginationDto, UProductionReportDto } from './productionReport.dto'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { ProductionOrder } from '@model/production/productionOrder.model'
import { POP } from '@model/production/POP.model'
import { ProcessTask } from '@model/production/processTask.model'
import { PRI } from '@model/production/PRI.model'
import { User } from '@model/sys/user.model'
import { Performance } from '@model/performance/performance.model'
import { deleteIdsDto } from '@common/dto'
import { PerformanceDetailed } from '@model/index'
import moment = require('moment')

@Injectable()
export class ProductionReportService {
  constructor() {}

  public async create(dto: CProductionReportDto, user: User) {
    if (!user.id) {
      throw new HttpException('登录信息异常,请重新登录', 400)
    }
    const temp = await ProductionReport.findAll({ where: { productionOrderId: dto.orderId, processId: dto.processId } })
    let order = await ProductionOrder.findByPk(dto.orderId, {
      include: [
        {
          association: 'bom',
          attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity', 'formData'],
          where: {},
          include: [
            {
              association: 'parentMaterial',
              attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
              where: {},
            },
          ],
        },
      ],
    })
    const task = await ProcessTask.findByPk(dto.taskId)
    const sum = await ProductionReport.sum('goodCount', {
      where: {
        productionOrderId: dto.orderId,
        processId: dto.processId,
      },
    })
    if (sum + dto.goodCount > task.dataValues.planCount) {
      throw new HttpException('此次报工已超过该工单可报工上限', 400)
    }

    const sequelize = POP.sequelize
    return sequelize
      .transaction(async transaction => {
        try {
          const date: Date = new Date()
          const formattedDate = moment(date, 'YYYY-MM-DD HH:mm:ss').toDate()
          const result = await ProductionReport.create(
            {
              ...dto,
              createdUserId: user.id,
              updatedUserId: user.id,
            },
            { transaction }
          )
          const pop = await POP.findOne({ where: { processTaskId: dto.taskId }, transaction })
          if (pop.planCount >= pop.goodCount + dto.goodCount) {
            if (pop.status === '未开始') {
              await POP.update(
                { status: '执行中' },
                {
                  where: {
                    processTaskId: dto.taskId,
                  },
                  transaction,
                }
              )
            }
            if (pop.planCount == pop.goodCount + dto.goodCount) {
              const pop1 = await POP.findOne({ where: { processTaskId: dto.taskId }, transaction })
              if (pop1.dataValues.actualStartTime) {
                await POP.update(
                  {
                    goodCount: pop.goodCount + dto.goodCount,
                    badCount: pop.badCount + dto.badCount,
                    actualEndTime: formattedDate,
                    status: '已结束',
                  },
                  { where: { processTaskId: dto.taskId }, transaction }
                )
                //工序完成开启下一道工序

                let popTemp = await POP.findOne({
                  where: { id: pop1.id + 1 },
                  order: [['id', 'ASC']],
                  include: [{ association: 'process', attributes: ['id', 'processName'] }],
                  transaction,
                })
                //如果存在下到工序就更新
                if (popTemp) {
                  await popTemp.update({ status: '执行中' }, { transaction })
                  popTemp = await POP.findOne({
                    where: { productionOrderId: dto.orderId, status: '执行中' },
                    order: [['id', 'ASC']],
                    include: [{ association: 'process', attributes: ['id', 'processName'] }],
                    transaction,
                  })
                  await ProductionOrder.update(
                    { currentProcess: popTemp.dataValues.process.processName },
                    {
                      where: { id: dto.orderId },
                      transaction,
                    }
                  )
                }
              } else {
                await POP.update(
                  {
                    goodCount: pop.goodCount + dto.goodCount,
                    badCount: pop.badCount + dto.badCount,
                    actualEndTime: formattedDate,
                    actualStartTime: formattedDate,
                    status: '已结束',
                  },
                  { where: { processTaskId: dto.taskId }, transaction }
                )

                let popTemp = await POP.findOne({
                  where: { id: pop1.id + 1 },
                  order: [['id', 'ASC']],
                  include: [{ association: 'process', attributes: ['id', 'processName'] }],
                  transaction,
                })
                //如果存在下到工序就更新
                if (popTemp) {
                  await popTemp.update({ status: '执行中' }, { transaction })
                  popTemp = await POP.findOne({
                    where: { productionOrderId: dto.orderId, status: '执行中' },
                    order: [['id', 'ASC']],
                    include: [{ association: 'process', attributes: ['id', 'processName'] }],
                    transaction,
                  })
                  await ProductionOrder.update(
                    { currentProcess: popTemp.dataValues.process.processName },
                    {
                      where: { id: dto.orderId },
                      transaction,
                    }
                  )
                }
              }
              //如果报完所有工序将order转为已结束
              const pops = await POP.findAll({
                where: { productionOrderId: dto.orderId },
                order: [['id', 'ASC']],
                transaction,
              })
              if (pops[pops.length - 1].dataValues.processId === dto.processId) {
                await order.update({ status: '已结束', actualOutput: order.actualOutput + dto.goodCount, actualEndTime: formattedDate, currentProcess: null }, { transaction })

                const popTemp = await POP.findOne({
                  where: { productionOrderId: dto.orderId, status: '执行中' },
                  order: [['id', 'ASC']],
                  include: [{ association: 'process', attributes: ['id', 'processName'] }],
                  transaction,
                })
                //如果存在工序就更新
                if (popTemp) {
                  await ProductionOrder.update(
                    { currentProcess: popTemp.dataValues.process.processName },
                    {
                      where: { id: dto.orderId },
                      transaction,
                    }
                  )
                }
              }
            } else {
              await POP.update(
                {
                  goodCount: pop.goodCount + dto.goodCount,
                  badCount: pop.badCount + dto.badCount,
                  actualStartTime: formattedDate,
                },
                { where: { processTaskId: dto.taskId }, transaction: transaction }
              )
              //如果报完所有工序将order转为已结束
              const pops = await POP.findAll({
                where: { productionOrderId: dto.orderId },
                order: [['id', 'ASC']],
                transaction,
              })
              if (pops[pops.length - 1].dataValues.processId === dto.processId) {
                await order.update({ actualOutput: order.actualOutput + dto.goodCount }, { transaction })
              }
            }
          }
          const task = await ProcessTask.findOne({ where: { id: dto.taskId }, transaction })
          console.log(task)
          if (task.planCount >= task.goodCount + dto.goodCount) {
            if (task.status === '未开始') {
              await ProcessTask.update(
                { status: '执行中' },
                {
                  where: {
                    id: dto.taskId,
                  },
                  transaction,
                }
              )
            }
            if (task.planCount == task.goodCount + dto.goodCount) {
              if (task.actualStartTime) {
                await ProcessTask.update(
                  {
                    goodCount: task.goodCount + dto.goodCount,
                    badCount: task.badCount + dto.badCount,
                    actualEndTime: formattedDate,
                    status: '已结束',
                  },
                  { where: { id: dto.taskId }, transaction }
                )
              } else {
                await ProcessTask.update(
                  {
                    goodCount: task.goodCount + dto.goodCount,
                    badCount: task.badCount + dto.badCount,
                    actualStartTime: formattedDate,
                    actualEndTime: formattedDate,
                    status: '已结束',
                  },
                  { where: { id: dto.taskId }, transaction }
                )
              }

              const temp = await ProcessTask.findByPk(task.id + 1, { transaction })
              //如果存在下一道工序才能开始
              if (temp && temp.status === '未开始') {
                await temp.update({ status: '执行中' }, { transaction })
              }
            } else {
              const temp = await ProcessTask.findOne({ where: { id: dto.taskId }, transaction })
              //已有计划时间则不改
              if (temp.actualStartTime) {
                await ProcessTask.update(
                  {
                    goodCount: task.goodCount + dto.goodCount,
                    badCount: task.badCount + dto.badCount,
                  },
                  { where: { id: dto.taskId }, transaction }
                )
              } else {
                await ProcessTask.update(
                  {
                    goodCount: task.goodCount + dto.goodCount,
                    badCount: task.badCount + dto.badCount,
                    actualStartTime: formattedDate,
                  },
                  { where: { id: dto.taskId }, transaction }
                )
              }
            }
          }
          if (dto.items) {
            for (const item of dto.items) {
              await PRI.create(
                {
                  productionReportId: result.id,
                  defectiveItemId: item.defectiveItemId,
                  count: item.count,
                },
                { transaction }
              )
            }
          }
          order = await ProductionOrder.findByPk(dto.orderId, { transaction })
          await order.update(
            { totalWorkingHours: order.totalWorkingHours + Number(dto.reportDurationHours) + Number(Number(Number(dto.reportDurationMinutes) / 60).toFixed(2)) },
            { transaction }
          )
          return result.id
        } catch (error) {
          // 如果出现错误，Sequelize 将自动回滚事务
          throw error
        }
      })
      .then(async id => {
        return this.find(id)
      })
      .catch(e => {
        throw e
      })
  }

  public async edit(dto: UProductionReportDto, id: number, user: User) {
    if (!user.id) {
      throw new HttpException('登录信息异常,请重新登录', 400)
    }
    const sequelize = POP.sequelize
    let productionReport = await ProductionReport.findOne({ where: { id } })
    if (!productionReport) {
      throw new HttpException('数据不存在', 400006)
    }
    let order = await ProductionOrder.findByPk(dto.orderId, {
      include: [
        {
          association: 'bom',
          attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity', 'formData'],
          where: {},
          include: [
            {
              association: 'parentMaterial',
              attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
              where: {},
            },
          ],
        },
      ],
    })
    return sequelize
      .transaction(async transaction => {
        try {
          //编辑报工数量之前减去上一次报工的数量再写入本次数量
          let pop = await POP.findOne({
            where: {
              processTaskId: dto.taskId,
            },
            transaction,
          })
          if (pop) {
            await POP.update(
              {
                goodCount: pop.goodCount - productionReport.goodCount,
                badCount: pop.badCount - productionReport.badCount,
              },
              { where: { processTaskId: dto.taskId }, transaction }
            )
          }
          let task = await ProcessTask.findOne({
            where: {
              id: dto.taskId,
            },
            transaction,
          })
          if (task) {
            await ProcessTask.update(
              {
                goodCount: task.goodCount - productionReport.goodCount,
                badCount: task.badCount - productionReport.badCount,
              },
              { where: { id: dto.taskId }, transaction }
            )
          }

          const pops = await POP.findAll({
            where: { productionOrderId: dto.orderId },
            order: [['id', 'ASC']],
            transaction,
          })
          if (pops[pops.length - 1].dataValues.processId === dto.processId) {
            await order.update({ actualOutput: order.actualOutput - productionReport.goodCount }, { transaction })
          }
          //删除相关不良品项
          await PRI.destroy({ where: { productionReportId: id }, transaction })

          await order.update(
            {
              totalWorkingHours:
                order.totalWorkingHours - Number(productionReport.reportDurationHours) - Number(Number(Number(productionReport.reportDurationMinutes) / 60).toFixed(2)),
            },
            { transaction }
          )

          const date: Date = new Date()
          const formattedDate = moment(date, 'YYYY-MM-DD HH:mm:ss').toDate()
          const sum = await ProductionReport.sum('goodCount', {
            where: {
              productionOrderId: dto.orderId,
              processId: dto.processId,
            },
            transaction,
          })
          if (sum + dto.goodCount - productionReport.goodCount > task.dataValues.planCount) {
            throw new HttpException('此次报工已超过该工单可报工上限', 400)
          }

          await productionReport.update(
            {
              ...dto,
              // updatedUserId: user.id,
            },
            { transaction }
          )

          pop = await POP.findOne({ where: { processTaskId: dto.taskId }, transaction })
          if (pop.planCount >= pop.goodCount + dto.goodCount) {
            if (pop.status === '未开始') {
              await POP.update(
                { status: '执行中' },
                {
                  where: {
                    productionOrderId: dto.orderId,
                    processId: dto.processId,
                  },
                  transaction,
                }
              )
            }
            if (pop.planCount == pop.goodCount + dto.goodCount) {
              const pop1 = await POP.findOne({ where: { processTaskId: dto.taskId }, transaction })
              if (pop1.dataValues.actualStartTime) {
                await POP.update(
                  {
                    goodCount: pop.goodCount + dto.goodCount,
                    badCount: pop.badCount + dto.badCount,
                    actualEndTime: formattedDate,
                    status: '已结束',
                  },
                  { where: { processTaskId: dto.taskId }, transaction }
                )
                //工序完成开启下一道工序

                let popTemp = await POP.findOne({
                  where: { id: pop1.id + 1 },
                  order: [['id', 'ASC']],
                  include: [{ association: 'process', attributes: ['id', 'processName'] }],
                  transaction,
                })
                //如果存在下到工序就更新
                if (popTemp) {
                  await popTemp.update({ status: '执行中' }, { transaction })
                  popTemp = await POP.findOne({
                    where: { productionOrderId: dto.orderId, status: '执行中' },
                    order: [['id', 'ASC']],
                    include: [{ association: 'process', attributes: ['id', 'processName'] }],
                    transaction,
                  })
                  await ProductionOrder.update(
                    { currentProcess: popTemp.dataValues.process.processName },
                    {
                      where: { id: dto.orderId },
                      transaction,
                    }
                  )
                }
              } else {
                await POP.update(
                  {
                    goodCount: pop.goodCount + dto.goodCount,
                    badCount: pop.badCount + dto.badCount,
                    actualEndTime: formattedDate,
                    actualStartTime: formattedDate,
                    status: '已结束',
                  },
                  { where: { processTaskId: dto.taskId }, transaction }
                )

                let popTemp = await POP.findOne({
                  where: { id: pop1.id + 1 },
                  order: [['id', 'ASC']],
                  include: [{ association: 'process', attributes: ['id', 'processName'] }],
                  transaction,
                })
                //如果存在下到工序就更新
                if (popTemp) {
                  await popTemp.update({ status: '执行中' }, { transaction })
                  popTemp = await POP.findOne({
                    where: { productionOrderId: dto.orderId, status: '执行中' },
                    order: [['id', 'ASC']],
                    include: [{ association: 'process', attributes: ['id', 'processName'] }],
                    transaction,
                  })
                  await ProductionOrder.update(
                    { currentProcess: popTemp.dataValues.process.processName },
                    {
                      where: { id: dto.orderId },
                      transaction,
                    }
                  )
                }
              }
              //如果报完所有工序将order转为已结束
              const pops = await POP.findAll({
                where: { productionOrderId: dto.orderId },
                order: [['id', 'ASC']],
                transaction,
              })
              if (pops[pops.length - 1].dataValues.processId === dto.processId) {
                await order.update({ status: '已结束', actualOutput: order.actualOutput + dto.goodCount, actualEndTime: formattedDate, currentProcess: null }, { transaction })

                const popTemp = await POP.findOne({
                  where: { productionOrderId: dto.orderId, status: '执行中' },
                  order: [['id', 'ASC']],
                  include: [{ association: 'process', attributes: ['id', 'processName'] }],
                  transaction,
                })
                //如果存在工序就更新
                if (popTemp) {
                  await ProductionOrder.update(
                    { currentProcess: popTemp.dataValues.process.processName },
                    {
                      where: { id: dto.orderId },
                      transaction,
                    }
                  )
                }
              }
            } else {
              await POP.update(
                {
                  goodCount: pop.goodCount + dto.goodCount,
                  badCount: pop.badCount + dto.badCount,
                },
                { where: { processTaskId: dto.taskId }, transaction: transaction }
              )
              //产出
              const pops = await POP.findAll({
                where: { productionOrderId: dto.orderId },
                order: [['id', 'ASC']],
                transaction,
              })
              if (pops[pops.length - 1].dataValues.processId === dto.processId) {
                await order.update({ actualOutput: order.actualOutput + dto.goodCount }, { transaction })
              }
            }
          }
          task = await ProcessTask.findOne({ where: { id: dto.taskId }, transaction })
          if (task.planCount >= task.goodCount + dto.goodCount) {
            if (task.status === '未开始') {
              await ProcessTask.update(
                { status: '执行中' },
                {
                  where: {
                    id: dto.taskId,
                  },
                  transaction,
                }
              )
            }
            if (task.planCount == task.goodCount + dto.goodCount) {
              await ProcessTask.update(
                {
                  goodCount: task.goodCount + dto.goodCount,
                  badCount: task.badCount + dto.badCount,
                  actualEndTime: formattedDate,
                  status: '已结束',
                },
                { where: { id: dto.taskId }, transaction }
              )
              const temp = await ProcessTask.findByPk(task.id + 1, { transaction })
              //如果存在下一道工序才能开始
              if (temp && temp.status === '未开始') {
                await temp.update({ status: '执行中' }, { transaction })
              }
            } else {
              const temp = await ProcessTask.findOne({ where: { id: dto.taskId }, transaction })
              //已有计划时间则不改
              if (temp.actualStartTime) {
                await ProcessTask.update(
                  {
                    goodCount: task.goodCount + dto.goodCount,
                    badCount: task.badCount + dto.badCount,
                  },
                  { where: { id: dto.taskId }, transaction }
                )
              } else {
                await ProcessTask.update(
                  {
                    goodCount: task.goodCount + dto.goodCount,
                    badCount: task.badCount + dto.badCount,
                    actualStartTime: formattedDate,
                  },
                  { where: { id: dto.taskId }, transaction }
                )
              }
            }
          }

          if (dto.items) {
            for (const item of dto.items) {
              await PRI.create(
                {
                  productionReportId: id,
                  defectiveItemId: item.defectiveItemId,
                  count: item.count,
                },
                { transaction }
              )
            }
          }
          order = await ProductionOrder.findByPk(dto.orderId, { transaction })
          await order.update(
            { totalWorkingHours: order.totalWorkingHours + Number(dto.reportDurationHours) + Number(Number(Number(dto.reportDurationMinutes) / 60).toFixed(2)) },
            { transaction }
          )
          return id
        } catch (error) {
          // 如果出现错误，Sequelize 将自动回滚事务
          throw error
        }
      })
      .then(async id => {
        return this.find(id)
      })
      .catch(e => {
        throw e
      })
  }

  public async delete(id: number) {
    //删除记录前减去对应工序任务单和生产工单的数量
    let productionReport = await ProductionReport.findOne({ where: { id } })
    if (!productionReport) {
      throw new HttpException('数据不存在', 400006)
    }
    if (productionReport.auditStatus === '已审核') {
      throw new HttpException('该报工单已审核,不允许删除！', 400)
    }
    //编辑报工数量之前减去上一次报工的数量再写入本次数量
    let pop = await POP.findAll({
      where: {
        productionOrderId: productionReport.productionOrderId,
        processId: productionReport.processId,
      },
    })
    for (const pop1 of pop) {
      if (pop1) {
        await POP.update(
          {
            goodCount: pop1.goodCount - productionReport.goodCount,
            badCount: pop1.badCount - productionReport.badCount,
            status: '执行中',
          },
          { where: { id: pop1.dataValues.id } }
        )
      }
    }
    let task = await ProcessTask.findAll({
      where: {
        productionOrderId: productionReport.productionOrderId,
        processId: productionReport.processId,
      },
    })
    for (const processTask of task) {
      if (processTask) {
        await ProcessTask.update(
          {
            goodCount: processTask.goodCount - productionReport?.goodCount,
            badCount: processTask.badCount - productionReport?.badCount,
            status: '执行中',
          },
          { where: { id: processTask.dataValues.id } }
        )
      }
    }
    await PRI.destroy({ where: { productionReportId: id } })

    if (productionReport.auditStatus === '已审核') {
      //删除对应绩效
      const temp = await PerformanceDetailed.findOne({ where: { productionReportId: id } })
      let per = await Performance.findOne({ where: { id: temp.dataValues.performanceId } })
      await Performance.update(
        {
          goodCount: per.dataValues.goodCount - productionReport.dataValues.goodCount,
          badCount: per.dataValues.badCount - productionReport.dataValues.badCount,
          goodCountWages: per.dataValues.goodCountWages - temp.dataValues.goodCountWages,
          badCountWages: per.dataValues.badCountWages - temp.dataValues.badCountWages,
        },
        { where: { id: temp.dataValues.performanceId } }
      )

      per = await Performance.findOne({ where: { id: temp.dataValues.performanceId } })
      await per.update({ yieldRate: (per.dataValues.goodCount / per.dataValues.badCount) * 100 })
      await PerformanceDetailed.destroy({ where: { productionReportId: id } })
    }
    const result = await ProductionReport.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number) {
    const options: FindOptions = {
      where: { id },
      include: [
        {
          association: 'order',
          attributes: ['id', 'code', 'plannedOutput'],
          include: [
            {
              association: 'bom',
              attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity', 'formData'],
              where: {},
              include: [
                {
                  association: 'parentMaterial',
                  attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                  where: {},
                },
              ],
            },
          ],
        },
        {
          association: 'process',
          attributes: ['id', 'processName'],
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
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'order',
          attributes: ['id', 'code', 'plannedOutput', 'plannedOutput'],
          where: {},
          required: false,
          include: [
            {
              association: 'bom',
              attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity', 'formData'],
              required: false,
              where: {},
              include: [
                {
                  association: 'parentMaterial',
                  attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                  required: false,
                  where: {},
                },
              ],
            },
          ],
        },
        {
          association: 'process',
          attributes: ['id', 'processName'],
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
          association: 'pri',
          include: [
            {
              association: 'defectiveItem',
            },
          ],
        },
      ],
    }

    if (dto.orderCode) {
      options.include[0].where['code'] = {
        [Op.like]: `%${dto.orderCode}%`,
      }
      options.include[0].required = true
      options.include[0].include[0].required = true
      options.include[0].include[0].include[0].required = true
    }
    if (dto.materialCode) {
      options.include[0].include[0].include[0].where['code'] = {
        [Op.like]: `%${dto.materialCode}%`,
      }
      options.include[0].required = true
      options.include[0].include[0].required = true
      options.include[0].include[0].include[0].required = true
    }

    if (dto.materialName) {
      options.include[0].include[0].include[0].where['name'] = {
        [Op.like]: `%${dto.materialName}%`,
      }
      options.include[0].required = true
      options.include[0].include[0].required = true
      options.include[0].include[0].include[0].required = true
    }
    if (dto.processName) {
      options.include[1].where['processName'] = {
        [Op.like]: `%${dto.processName}%`,
      }
      options.include[1].required = true
    }
    if (dto.orderId) {
      options.where['orderId'] = {
        [Op.eq]: dto.orderId,
      }
    }
    if (dto.processId) {
      options.where['processId'] = {
        [Op.eq]: dto.processId,
      }
    }
    if (dto.auditStatus) {
      options.where['auditStatus'] = {
        [Op.eq]: dto.auditStatus,
      }
    }

    const result = await ProductionReport.findPagination<ProductionReport>(options)
    return result
  }

  async batch(dto: batchDto, user: User) {
    if (dto) {
      for (const dtoElement of dto.dtos) {
        await this.create(dtoElement, user)
      }
    }
    return 'sucess'
  }

  public async batDelete(dto: deleteIdsDto) {
    for (const id of dto.ids) {
      await this.delete(id)
    }
  }
}
