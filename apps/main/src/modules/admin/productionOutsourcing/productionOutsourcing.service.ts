import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { CProductionOutsourcingDto, FindPaginationDto, UProductionOutsourcingDto } from './productionOutsourcing.dto'
import { ProductionOutsourcing } from '@model/production/productionOutsourcing.model'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import moment = require('moment')
import { Paging } from '@library/utils/paging'
import dayjs = require('dayjs')
import { ProductionProcessTask } from '@model/production/productionProcessTask.model'
import { ProductionOrder } from '@model/production/productionOrder.model'
import { auditDto } from '../productionReport/productionReport.dto'

@Injectable()
export class ProductionOutsourcingService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(ProductionOutsourcing)
    private productionOutsourcingModel: typeof ProductionOutsourcing,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CProductionOutsourcingDto, user, loadModel) {
    if (dto.code) {
      const temp = await ProductionOutsourcing.findOne({ where: { code: dto.code } })
      if (temp) throw new HttpException('已存在相同编号的委外单', 400)
    } else {
      const date = new Date()
      const year = date.getFullYear().toString().substring(2)
      const month = date.getMonth().toString().padStart(2, '0')
      const temp = await ProductionOutsourcing.findOne({
        order: [['id', 'DESC']],
        where: { code: { [Op.like]: `WW${year}${month}%` } },
      })
      if (temp) {
        const oldNO = temp.code
        const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
        let num = parseInt(lastFourChars)
        num++
        let newNO = num.toString().padStart(4, '0')

        dto.code = 'WW' + year + month + newNO
      } else {
        dto.code = 'WW' + year + month + '0001'
      }
    }
    const result = await ProductionOutsourcing.create(dto)
    return result
  }

  public async edit(dto: UProductionOutsourcingDto, id: number, user, loadModel) {
    let productionOutsourcing = await ProductionOutsourcing.findOne({ where: { id } })
    if (!productionOutsourcing) {
      throw new HttpException('数据不存在', 400006)
    }
    await productionOutsourcing.update(dto)
    let result = await ProductionOutsourcing.findOne({ where: { id } })
    return result
  }

  public async delete(id: number, loadModel) {
    const pro = await ProductionOutsourcing.findOne({ where: { id } })
    if (!pro) throw new HttpException('数据不存在', 400006)
    const result = await ProductionOutsourcing.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = {
      where: { id },
      include: [
        {
          association: 'material',
          attributes: ['id', 'code', 'name'],
        },
        {
          association: 'order',
          attributes: ['id', 'code', 'plannedOutput'],
        },
        {
          association: 'process',
          attributes: ['id', 'processName'],
        },
        {
          association: 'auditor',
          attributes: ['id', 'userCode', 'userName'],
        },
        {
          association: 'supplier',
          attributes: ['id', 'code', 'shortName', 'fullName'],
        },
        {
          association: 'task',
          attributes: ['id', 'planCount'],
        },
      ],
    }
    const result = await ProductionOutsourcing.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'material',
          attributes: ['id', 'code', 'name'],
        },
        {
          association: 'order',
          attributes: ['id', 'code', 'plannedOutput'],
        },
        {
          association: 'process',
          attributes: ['id', 'processName'],
        },
        {
          association: 'auditor',
          attributes: ['id', 'userCode', 'userName'],
        },
        {
          association: 'supplier',
          attributes: ['id', 'code', 'shortName', 'fullName'],
        },
        {
          association: 'task',
          attributes: ['id', 'planCount'],
        },
      ],
    }

    if (dto.orderCode) {
      options.include[1].where['code'] = {
        [Op.like]: `%${dto.orderCode}%`,
      }
    }
    if (dto.materialCode) {
      options.include[0].where['code'] = {
        [Op.like]: `%${dto.materialCode}%`,
      }
    }
    if (dto.materialName) {
      options.include[0].where['name'] = {
        [Op.like]: `%${dto.materialName}%`,
      }
    }
    if (dto.processName) {
      options.include[2].where['processName'] = {
        [Op.like]: `%${dto.processName}%`,
      }
    }
    if (dto.supplierName) {
      options.include[4].where['fullName'] = {
        [Op.like]: `%${dto.supplierName}%`,
      }
    }
    if (dto.startTime) {
      options.where['startTime'] = { [Op.gte]: dayjs(dto.startTime).format('YYYY-MM-DD 00:00:00') }
    }
    if (dto.endTime) {
      if (dto.startTime) {
        options.where['startTime'][Op.lte] = dayjs(dto.endTime).format('YYYY-MM-DD 23:59:59')
      } else {
        options.where['startTime'] = { [Op.lte]: dayjs(dto.endTime).format('YYYY-MM-DD 23:59:59') }
      }
    }
    const result = await Paging.diyPaging(ProductionOutsourcing, pagination, options)
    return result
  }

  public async audit(dto: auditDto, user, loadModel: any) {
    for (const id of dto.ids) {
      const outSouce = await ProductionOutsourcing.findByPk(id)
      let order = await ProductionOrder.findByPk(outSouce.productionOrderId)
      const date: Date = new Date()
      const formattedDate = moment(date, 'YYYY-MM-DD HH:mm:ss').toDate()
      if (dto.status === '审核') {
        if (outSouce.types === '委外发出') {
          //委外发出审核之后  更改工序单状态
          const task = await ProcessTask.findByPk(outSouce.taskId)
          if (task) await task.update({ status: '执行中' })
          await ProductionOutsourcing.update({ status: '已审核', auditorId: user.id, auditedAt: formattedDate }, { where: { id } })
        } else if (outSouce.types === '委外接收') {
          //委外接收审核之后 变更工序单以及工单数量状态
          const sequelize = ProcessTask.sequelize
          //开启事务
          return sequelize
            .transaction(async transaction => {
              try {
                //变更工序单数量
                const task = await ProcessTask.findByPk(outSouce.taskId, { transaction })
                if (task.planCount > task.goodCount + outSouce.goodCount) {
                  await ProcessTask.update(
                    { goodCount: Number(task.goodCount) + Number(outSouce.goodCount), badCount: Number(task.badCount) - Number(outSouce.badCount) },
                    { where: { id: task.id }, transaction }
                  )
                  //是否为最后一道工序
                  const pops = await POP.findAll({
                    where: { productionOrderTaskId: outSouce.productionOrderId },
                    order: [['id', 'ASC']],
                    transaction,
                  })
                  if (pops[pops.length - 1].dataValues.processId === outSouce.processId) {
                    if (!task.actualStartTime) {
                      await task.update({ actualStartTime: formattedDate }, { transaction })
                      // await order.update({ actualOutput: order.actualOutput + outSouce.goodCount, actualStartTime: formattedDate }, { transaction })
                      //更新生产工单下面的工序列表数量
                      const pop = await POP.findOne({ where: { processTaskId: outSouce.taskId }, transaction })
                      await POP.update(
                        {
                          goodCount: pop.goodCount + outSouce.goodCount,
                          badCount: pop.badCount + outSouce.badCount,
                          actualStartTime: formattedDate,
                        },
                        { where: { processTaskId: outSouce.taskId }, transaction }
                      )
                    } else if (task.actualStartTime) {
                      // await order.update({ actualOutput: order.actualOutput + outSouce.goodCount }, { transaction })
                      //更新生产工单下面的工序列表数量
                      const pop = await POP.findOne({ where: { processTaskId: outSouce.taskId }, transaction })
                      await POP.update(
                        {
                          goodCount: pop.goodCount + outSouce.goodCount,
                          badCount: pop.badCount + outSouce.badCount,
                        },
                        { where: { processTaskId: outSouce.taskId }, transaction }
                      )
                    }
                  }
                } else if (task.planCount < task.goodCount + outSouce.goodCount) {
                  throw new HttpException('累积接收数量超过工序计划数量', 400)
                } else if (task.planCount == task.goodCount + outSouce.goodCount) {
                  //修改工序数量的同时修改工序状态
                  await ProcessTask.update(
                    { status: '已完成', goodCount: Number(task.goodCount) + Number(outSouce.goodCount), badCount: Number(task.badCount) - Number(outSouce.badCount) },
                    { where: { id: task.id }, transaction }
                  )
                  //是否为最后一道工序
                  const pops = await POP.findAll({
                    where: { productionOrderTaskId: outSouce.productionOrderId },
                    order: [['id', 'ASC']],
                    transaction,
                  })
                  if (pops[pops.length - 1].dataValues.processId === outSouce.processId) {
                    if (!task.actualStartTime) {
                      await task.update({ actualStartTime: formattedDate, actualEndTime: formattedDate }, { transaction })
                      // await order.update({ status: '已结束', actualOutput: order.actualOutput + outSouce.goodCount, actualEndTime: formattedDate }, { transaction })
                      //更新生产工单下面的工序列表数量
                      const pop = await POP.findOne({ where: { processTaskId: outSouce.taskId }, transaction })
                      await POP.update(
                        {
                          goodCount: pop.goodCount + outSouce.goodCount,
                          badCount: pop.badCount + outSouce.badCount,
                          actualStartTime: formattedDate,
                          actualEndTime: formattedDate,
                          status: '已结束',
                        },
                        { where: { processTaskId: outSouce.taskId }, transaction }
                      )
                    } else if (task.actualStartTime) {
                      await task.update({ actualEndTime: formattedDate }, { transaction })
                      // await order.update({ status: '已结束', actualOutput: order.actualOutput + outSouce.goodCount, actualEndTime: formattedDate }, { transaction })
                      //更新生产工单下面的工序列表数量
                      const pop = await POP.findOne({ where: { processTaskId: outSouce.taskId }, transaction })
                      await POP.update(
                        {
                          goodCount: pop.goodCount + outSouce.goodCount,
                          badCount: pop.badCount + outSouce.badCount,
                          actualEndTime: formattedDate,
                          status: '已结束',
                        },
                        { where: { processTaskId: outSouce.taskId }, transaction }
                      )
                    }
                    //如果不是最后一道工序需要开启下一道工序
                  } else {
                    if (!task.actualStartTime) {
                      await ProcessTask.update({ actualStartTime: formattedDate, actualEndTime: formattedDate }, { where: { id: task.id }, transaction })
                      // await order.update({ status: '已结束', actualOutput: order.actualOutput + outSouce.goodCount, actualStartTime: formattedDate }, { transaction })
                      //更新生产工单下面的工序列表数量
                      const pop = await POP.findOne({ where: { processTaskId: outSouce.taskId }, transaction })
                      await POP.update(
                        {
                          goodCount: pop.goodCount + outSouce.goodCount,
                          badCount: pop.badCount + outSouce.badCount,
                          actualStartTime: formattedDate,
                          actualEndTime: formattedDate,
                          status: '已结束',
                        },
                        { where: { processTaskId: outSouce.taskId }, transaction }
                      )
                    } else if (task.actualStartTime) {
                      await ProcessTask.update({ actualEndTime: formattedDate }, { where: { id: task.id }, transaction })
                      // await order.update({ status: '已结束', actualOutput: order.actualOutput + outSouce.goodCount }, { transaction })
                      //更新生产工单下面的工序列表数量
                      const pop = await POP.findOne({ where: { processTaskId: outSouce.taskId }, transaction })
                      await POP.update(
                        {
                          goodCount: pop.goodCount + outSouce.goodCount,
                          badCount: pop.badCount + outSouce.badCount,
                          actualEndTime: formattedDate,
                          status: '已结束',
                        },
                        { where: { processTaskId: outSouce.taskId }, transaction }
                      )
                    }
                    //工序完成开启下一道工序
                    const pops = await POP.findAll({
                      where: { productionOrderTaskId: outSouce.productionOrderId },
                      order: [['id', 'ASC']],
                      transaction,
                    })
                    let temp = 0
                    for (let i = 0; i < pops.length; i++) {
                      if (pops[i].processId === outSouce.processId) {
                        temp = pops[i + 1].processId
                        break
                      }
                    }
                    let popTemp = await POP.findOne({
                      where: { id: temp },
                      order: [['id', 'ASC']],
                      include: [{ association: 'process', attributes: ['id', 'processName'] }],
                      transaction,
                    })
                    //如果存在下到工序就更新
                    if (popTemp) {
                      //更新状态
                      await popTemp.update({ status: '执行中' }, { transaction })
                      //更新当前工序
                      popTemp = await POP.findOne({
                        where: { productionOrderTaskId: outSouce.productionOrderId, status: '执行中' },
                        order: [['id', 'ASC']],
                        include: [{ association: 'process', attributes: ['id', 'processName'] }],
                        transaction,
                      })
                      // await ProductionOrder.update(
                      //   { currentProcess: popTemp.dataValues.process.processName },
                      //   {
                      //     where: { id: outSouce.productionOrderId },
                      //     transaction,
                      //   }
                      // )
                    }
                  }
                }
                await outSouce.update({ status: '已审核' })
                return this.find(id, loadModel)
              } catch (e) {}
            })
            .then(async id => {
              return this.find(Number(id), loadModel)
            })
            .catch(e => {
              throw e
            })
        }
      } else if (dto.status === '取消审核') {
        await ProductionOutsourcing.update({ status: '未审核', auditorId: user.id, auditedAt: formattedDate }, { where: { id } })
        if (outSouce.types === '委外发出') {
          //委外发出取消审核之后  更改工序单状态
          const task = await ProcessTask.findByPk(outSouce.taskId)
          if (task) await task.update({ status: '未开始' })
        } else if (outSouce.types === '委外接收') {
          //委外接收审核之后 变更工序单以及工单数量状态
          const sequelize = ProcessTask.sequelize
          //开启事务
          return sequelize.transaction(async transaction => {
            try {
              //取消审核
              const task = await ProcessTask.findByPk(outSouce.taskId, { transaction })
              await task.update(
                {
                  status: '执行中',
                  goodCount: Number(task.goodCount) - Number(outSouce.goodCount),
                  badCount: Number(task.badCount) - Number(outSouce.badCount),
                  actualEndTime: null,
                },
                { transaction }
              )
              const pop = await POP.findOne({ where: { productionOrderTaskId: outSouce.productionOrderId, processId: outSouce.processId }, transaction })
              await pop.update(
                {
                  status: '执行中',
                  goodCount: Number(pop.goodCount) - Number(outSouce.goodCount),
                  badCount: Number(pop.badCount) - Number(outSouce.badCount),
                  actualEndTime: null,
                },
                { transaction }
              )
              //如果是最后一道工序需要减去工单的产出数
              //是否为最后一道工序
              const pops = await POP.findAll({
                where: { productionOrderTaskId: outSouce.productionOrderId },
                order: [['id', 'ASC']],
                transaction,
              })
              if (pops[pops.length - 1].dataValues.processId === outSouce.processId) {
                // await order.update({ status: '执行中', actualOutput: Number(order.actualOutput) - Number(outSouce.goodCount), actualEndTime: null }, { transaction })
              } else {
                //工序完成开启下一道工序
                const pops = await POP.findAll({
                  where: { productionOrderTaskId: outSouce.productionOrderId },
                  order: [['id', 'ASC']],
                  transaction,
                })
                let temp = 0
                for (let i = 0; i < pops.length; i++) {
                  if (pops[i].processId === outSouce.processId) {
                    temp = pops[i + 1].processId
                    break
                  }
                }
                let popTemp = await POP.findOne({
                  where: { id: temp },
                  order: [['id', 'ASC']],
                  include: [{ association: 'process', attributes: ['id', 'processName'] }],
                  transaction,
                })
                //如果存在下到工序就更新
                if (popTemp) {
                  //更新状态
                  await popTemp.update({ status: '执行中' }, { transaction })
                  //更新当前工序
                  popTemp = await POP.findOne({
                    where: { productionOrderTaskId: outSouce.productionOrderId, status: '执行中' },
                    order: [['id', 'ASC']],
                    include: [{ association: 'process', attributes: ['id', 'processName'] }],
                    transaction,
                  })
                  // await ProductionOrder.update(
                  //   { currentProcess: popTemp.dataValues.process.processName },
                  //   {
                  //     where: { id: outSouce.productionOrderId },
                  //     transaction,
                  //   }
                  // )
                }
              }
              return this.find(id, loadModel)
            } catch (e) {}
          })
        }
      }
    }
  }
}
