import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { FindProductionOrderTaskDto, OrderFindPagination } from './dashboard.dto'
import { Equipment } from '@model/equipment/equipment.model'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'
import { AdjustOrder } from '@model/warehouse/adjustOrder.model'
import { UEquipmentTypeDTO } from '../equipmentType/equipmentType.dto'
import { ProductionOrder, ProductionOrderDetail, ProductionOrderTask } from '@model/index'
import { ProductSerial } from '@model/production/productSerial.model'
import { SalesOrder } from '@model/plan/salesOrder.model'
import { scheduled } from 'rxjs'

@Injectable()
export class DashboardService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,
    private readonly sequelize: Sequelize
  ) {}

  /**
   * 工单进度展示
   */
  async findPagination(dto: FindProductionOrderTaskDto, pagination: Pagination) {
    const { current, pageSize } = pagination

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

    if (dto) {
      if (dto.startTime && dto.endTime) {
        options.where['endTime'] = { [Op.between]: [dto.startTime, dto.endTime] }
      }
    }

    const result = await Paging.diyPaging(ProductionOrderTask, pagination, options)

    return result
  }

  /**
   * 订单数据展示
   */
  async OrderFindPagination(dto: OrderFindPagination) {
    const options = {
      where: {},
      include: [
        {
          association: 'details',
        },
      ],
    }
    const productionOrderOptions = {
      where: {},
      include: [
        {
          association: 'productionOrderDetail',
          include: [
            {
              association: 'productionOrderTasks',
              required: false,
              include: [
                {
                  association: 'productSerials',
                  required: false,
                  where: {
                    status: '已完工',
                  },
                },
              ],
            },
          ],
        },
      ],
    }

    if (dto) {
      if (dto.startTime && dto.endTime) {
        options.where['orderDate'] = { [Op.between]: [dto.startTime, dto.endTime] }
        productionOrderOptions.where['orderDate'] = { [Op.between]: [dto.startTime, dto.endTime] }
      }
    }

    const productionOrder = await ProductionOrder.findAll(productionOrderOptions)
    const productionOrderCout = productionOrder.length

    let plannedOutputSum = 0
    let finishedProductSerialCount = 0

    for (const po of productionOrder) {
      const details = (po as any)?.productionOrderDetail || []
      for (const detail of details) {
        const planned = Number(detail?.plannedOutput || 0)
        plannedOutputSum += isNaN(planned) ? 0 : planned

        const tasks = detail?.productionOrderTasks || []
        for (const task of tasks) {
          const serials = task?.productSerials || []
          finishedProductSerialCount += Array.isArray(serials) ? serials.length : 0
        }
      }
    }

    return {
      productionOrderCout: productionOrderCout,
      plannedOutputSum: plannedOutputSum,
      finishedProductSerialCount: finishedProductSerialCount,
      scheduleRate: (finishedProductSerialCount / plannedOutputSum) * 100,
    }
  }
}
