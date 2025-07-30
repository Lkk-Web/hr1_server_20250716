import { Inject, Injectable } from '@nestjs/common'
import { RedisProvider } from '@library/redis'
import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { FindPaginationOptions } from '@model/shared/interface'
import { Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { ProcessTask } from '@model/production/processTask.model'
import { PerformanceConfig } from '@model/performance/performanceConfig.model'
import { ProductionOrderPageDto } from './productionOrder.dto'
import { ProductionOrder } from '@model/production/productionOrder.model'

@Injectable()
export class ProductionOrderService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis
  ) {}

  public async findPagination(dto: ProductionOrderPageDto, pagination: Pagination, processId: number) {
    const options: FindPaginationOptions = {
      pagination,
      order: [['id', 'ASC']],
      include: [
        { association: 'tasks', attributes: [], where: { processId } },
        {
          association: 'bom',
          attributes: ['id', 'materialId', 'remark', 'version', 'quantity', 'formData'],
          required: true,
          include: [
            {
              association: 'parentMaterial',
              attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
              where: {},
            },
          ],
        },
      ],
      attributes: ['id', 'code', 'plannedOutput', 'startTime', 'endTime', 'actualStartTime', 'actualEndTime', 'kingdeeCode', 'status', 'salesOrderCode'],
    }
    if (dto.orderCode) {
      options.where = {
        code: {
          [Op.like]: `%${dto.orderCode}%`,
        },
      }
    }

    if (dto.currentProcess == 1) {
      options.include['where']['planCount'] = {
        [Op.gt]: Sequelize.col('goodCount'), // 比较两列值
      }
    }

    const result = await ProductionOrder.findPagination<ProductionOrder>(options)

    if (result.data.length) {
      const [perList, tasks] = await Promise.all([
        PerformanceConfig.findAll({
          where: {
            // materialId: result.data.map(item => item.bom.materialId),
            processId,
          },
        }),
        ProcessTask.findAll({
          where: {
            productionOrderId: result.data.map(item => item.id),
            processId,
            ...(dto.currentProcess == 1
              ? {
                  planCount: {
                    [Op.gt]: Sequelize.col('goodCount'), // 比较两列值
                  },
                }
              : {}),
          },
          attributes: [
            'id',
            'productionOrderId',
            'processId',
            'reportRatio',
            'planCount',
            'goodCount',
            'badCount',
            'unit',
            'status',
            'isOutsource',
            'isInspection',
            'priority',
            'startTime',
            'endTime',
            'actualStartTime',
            'actualStartTime',
          ],
          include: [
            { association: 'process', attributes: ['id', 'processName'], where: {} },
            { association: 'operateLogs', attributes: ['pauseTime', 'resumeTime'] },
          ],
        }),
      ])

      result.data = result.data.map(item => {
        item = item.toJSON()

        item.tasks = tasks.filter(task => task.productionOrderId == item.id)
        item.tasks = item.tasks.map(task => {
          task = task.toJSON()
          task.process.performanceConfig = perList.find(per => per.processId == task.processId)
          return task
        })
        return item
      })
    }
    return result
  }
}
