import { Injectable, HttpException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ProductionOrderTask } from '@model/production/productionOrderTask.model'
import { Op } from 'sequelize'
import { FindProductionOrderTaskDto, UpdateProductionOrderTaskDto } from './productionOrderTask.dto'
import { Pagination } from '@common/interface'
import { FindPaginationOptions } from '@model/shared/interface'
import moment from 'moment'
import { Paging } from '@library/utils/paging'

@Injectable()
export class ProductionOrderTaskService {
  constructor(
    @InjectModel(ProductionOrderTask)
    private readonly productionOrderTaskModel: typeof ProductionOrderTask
  ) {}

  /**
   * 分页查询生产订单任务
   */
  async findPagination(dto: FindProductionOrderTaskDto, pagination: Pagination) {
    const { current, pageSize } = pagination
    const { orderCode, status, workShop, materialName, productionOrderDetailCode } = dto

    const options: FindPaginationOptions = {
      where: {},
      include: [
        {
          association: 'productionOrderDetail',
          required: false,
          where: {},
          attributes: { exclude: ['createdAt', 'updatedAt'] },
          include: [
            {
              association: 'material',
              required: false,
              where: {},
              attributes: { exclude: ['createdAt', 'updatedAt'] },
              include: [
                {
                  association: 'processRoute',
                  attributes: { exclude: ['createdAt', 'updatedAt'] },
                  required: false,
                  include: [
                    {
                      association: 'processRouteList',
                      attributes: { exclude: ['createdAt', 'updatedAt'] },
                      include: [
                        {
                          association: 'process',
                          attributes: { exclude: ['createdAt', 'updatedAt'] },
                          required: false,
                          include: [
                            {
                              association: 'children',
                              attributes: { exclude: ['createdAt', 'updatedAt'] },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              association: 'productionOrder',
              required: false,
              where: {},
              include: [
                {
                  association: 'salesOrder',
                  attributes: ['code'],
                },
              ],
            },
          ],
        },
        {
          association: 'productSerials',
          required: false,
          where: {},
          include: [
            {
              association: 'currentProcessTask',
              include: [{ association: 'process', attributes: ['id', 'processName'] }],
            },
            {
              association: 'ironSerial',
              required: false,
              attributes: ['id', 'ironSerial', 'serialId'],
            },
            // {
            //   association: 'processTasks',
            //   include: [
            //     {
            //       association: 'processPositionTasks',
            //       include: [{ association: 'process', attributes: ['id', 'processName'] }],
            //     },
            //   ],
            // },
          ],
        },
      ],
      attributes: { exclude: ['createdAt', 'updatedAt', 'productionOrderDetailId'] },
      order: [['id', 'DESC']],
      offset: (current - 1) * pageSize,
      limit: pageSize,
    }

    // 主表条件
    if (orderCode) {
      options.where['orderCode'] = { [Op.like]: `%${orderCode}%` }
    }

    if (status) {
      options.where['status'] = status
    }

    if (workShop) {
      options.include[0].where['workShop'] = { [Op.like]: `%${workShop}%` }
    }

    // 生产订单明细条件
    if (productionOrderDetailCode) {
      options.include[0].where['orderCode'] = { [Op.like]: `%${productionOrderDetailCode}%` }
    }

    // 物料条件
    if (materialName) {
      // 生产订单详情的物料中搜索
      options.include[0].include[1].where['materialName'] = { [Op.like]: `%${materialName}%` }
    }

    if (dto.startTime) {
      options.where['startTime'] = {
        [Op.gte]: moment(dto.startTime).startOf('day').toISOString(),
      }
    }

    if (dto.endTime) {
      options.where['endTime'] = {
        [Op.lte]: moment(dto.endTime).endOf('day').toISOString(),
      }
    }

    const result = await Paging.diyPaging(this.productionOrderTaskModel, pagination, options)

    return result
  }

  /**
   * 根据ID查询生产订单任务详情
   */
  async findOne(id: string): Promise<ProductionOrderTask> {
    const task = await this.productionOrderTaskModel.findByPk(id, {
      include: [
        {
          association: 'productionOrderDetail',
          required: false,
          where: {},
          include: [
            {
              association: 'material',
              required: false,
              where: {},
              include: [
                {
                  association: 'boms',
                  required: false,
                  where: {},
                  include: [
                    {
                      association: 'bomDetails',
                      required: false,
                      where: {},
                    },
                  ],
                },
              ],
            },
            {
              association: 'productionOrder',
              required: false,
              where: {},
              include: [
                {
                  association: 'salesOrder',
                  attributes: ['code'],
                },
              ],
            },
          ],
        },
        {
          association: 'productSerials',
          required: false,
          where: {},
        },
      ],
    })

    if (!task) {
      throw new HttpException('生产订单任务不存在', 404)
    }

    return task
  }

  /**
   * 更新生产订单任务
   */
  async update(id: string, dto: UpdateProductionOrderTaskDto): Promise<ProductionOrderTask> {
    const task = await this.productionOrderTaskModel.findByPk(id)

    if (!task) {
      throw new HttpException('生产订单任务不存在', 404)
    }

    // 自动状态转换逻辑
    const updateData = { ...dto }

    // // 如果设置了实际开始时间且当前状态为待开始，自动转为执行中
    // if (dto.actualStartTime && task.status === ProductionOrderTaskStatus.NOT_STARTED) {
    //   updateData.status = ProductionOrderTaskStatus.IN_PROGRESS
    // }

    // // 如果设置了实际结束时间且当前状态为执行中，自动转为已完成
    // if (dto.actualEndTime && task.status === ProductionOrderTaskStatus.IN_PROGRESS) {
    //   updateData.status = ProductionOrderTaskStatus.COMPLETED
    //   // 如果没有设置实际产出，默认为良品数
    //   if (!dto.actualOutput && dto.goodCount !== undefined) {
    //     updateData.actualOutput = dto.goodCount
    //   }
    // }

    await task.update(updateData)
    return await this.findOne(id)
  }

  /**
   * 生产订单任务操作（开始、暂停、恢复、取消、完成）
   */
  // async action(id: string, dto: ProductionOrderTaskActionDto): Promise<{ message: string }> {
  //   const task = await this.productionOrderTaskModel.findByPk(id)

  //   if (!task) {
  //     throw new HttpException('生产订单任务不存在', 404)
  //   }

  //   const { action, remark } = dto
  //   const updateData: any = { remark }

  //   switch (action) {
  //     case 'start':
  //       if (task.status !== ProductionOrderTaskStatus.NOT_STARTED) {
  //         throw new HttpException('只有待开始状态的任务可以开始', 400)
  //       }
  //       updateData.status = ProductionOrderTaskStatus.IN_PROGRESS
  //       updateData.actualStartTime = new Date()
  //       break

  //     case 'pause':
  //       if (task.status !== ProductionOrderTaskStatus.IN_PROGRESS) {
  //         throw new HttpException('只有执行中状态的任务可以暂停', 400)
  //       }
  //       updateData.status = ProductionOrderTaskStatus.PAUSED
  //       break

  //     case 'resume':
  //       if (task.status !== ProductionOrderTaskStatus.PAUSED) {
  //         throw new HttpException('只有暂停状态的任务可以恢复', 400)
  //       }
  //       updateData.status = ProductionOrderTaskStatus.IN_PROGRESS
  //       break

  //     case 'cancel':
  //       if (![ProductionOrderTaskStatus.NOT_STARTED, ProductionOrderTaskStatus.IN_PROGRESS, ProductionOrderTaskStatus.PAUSED].includes(task.status)) {
  //         throw new HttpException('该状态的任务无法取消', 400)
  //       }
  //       updateData.status = ProductionOrderTaskStatus.CANCELLED
  //       break

  //     case 'complete':
  //       if (task.status !== ProductionOrderTaskStatus.IN_PROGRESS) {
  //         throw new HttpException('只有执行中状态的任务可以完成', 400)
  //       }
  //       updateData.status = ProductionOrderTaskStatus.COMPLETED
  //       updateData.actualEndTime = new Date()
  //       // 如果没有设置实际产出，默认为计划数量
  //       if (!task.actualOutput) {
  //         updateData.actualOutput = task.splitQuantity
  //       }
  //       break

  //     default:
  //       throw new HttpException('无效的操作类型', 400)
  //   }

  //   await task.update(updateData)

  //   const actionNames = {
  //     start: '开始',
  //     pause: '暂停',
  //     resume: '恢复',
  //     cancel: '取消',
  //     complete: '完成',
  //   }

  //   return { message: `任务${actionNames[action]}成功` }
  // }

  /**
   * 删除生产订单任务
   */
  async delete(id: string): Promise<{ message: string }> {
    const task = await this.productionOrderTaskModel.findByPk(id)

    if (!task) {
      throw new HttpException('生产订单任务不存在', 404)
    }

    // // 只有待开始状态的任务可以删除
    // if (task.status !== ProductionOrderTaskStatus.NOT_STARTED) {
    //   throw new HttpException('只有待开始状态的任务可以删除', 400)
    // }

    await task.destroy()
    return { message: '删除成功' }
  }
}
