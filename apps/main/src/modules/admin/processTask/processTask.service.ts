import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { ProcessTask } from '@model/production/processTask.model'
import { CProcessTaskDto, FindPaginationDto, priorityDto, UProcessTaskDto } from './processTask.dto'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { ProcessTaskDept } from '@model/production/processTaskDept.model'
import { deleteIdsDto } from '@common/dto'
import { PerformanceConfig } from '@model/index'
import { Paging } from '@library/utils/paging'
import moment = require('moment')

@Injectable()
export class ProcessTaskService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,
    @InjectModel(ProcessTask)
    private processTaskModel: typeof ProcessTask
  ) {}

  public async create(dto: CProcessTaskDto, loadModel) {
    const temp = await ProcessTask.findOne({ where: { productionOrderId: dto.productionOrderId, processId: dto.processId } })
    if (temp) {
      throw new HttpException('该工单下此条工序已有工序任务单', 400)
    }

    const result = await ProcessTask.create({
      productionOrderId: dto.productionOrderId,
      processId: dto.processId,
      reportRatio: dto.reportRatio,
      planCount: dto.planCount,
      startTime: dto.startTime,
      endTime: dto.endTime,
      priority: dto.priority,
      remark: dto.remark,
    })
    if (dto.depts) {
      for (const dept of dto.depts) {
        await ProcessTaskDept.create({ taskId: result.id, deptId: dept })
      }
    }
    return this.find(result.id, loadModel)
  }

  public async edit(dto: UProcessTaskDto, id: number, loadModel) {
    let processTask = await ProcessTask.findOne({ where: { id } })
    if (!processTask) {
      throw new HttpException('数据不存在', 400006)
    }
    if (dto.productionOrderId != processTask.dataValues.productionOrderId) {
      const temp = await ProcessTask.findOne({ where: { productionOrderId: dto.productionOrderId, processId: dto.processId } })
      if (temp) {
        throw new HttpException('该工单下此条工序已有工序任务单', 400)
      }
    }

    await processTask.update({
      productionOrderId: dto.productionOrderId,
      processId: dto.processId,
      reportRatio: dto.reportRatio,
      planCount: dto.planCount,
      startTime: dto.startTime,
      endTime: dto.endTime,
      priority: dto.priority,
      remark: dto.remark,
    })

    if (dto.depts) {
      await ProcessTaskDept.destroy({ where: { taskId: id } })
      for (const dept of dto.depts) {
        await ProcessTaskDept.create({ taskId: id, deptId: dept })
      }
    }
    processTask = await ProcessTask.findOne({ where: { id } })
    return processTask
  }

  public async delete(id: number, loadModel) {
    await ProcessTaskDept.destroy({ where: { taskId: id } })
    const result = await ProcessTask.destroy({
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
          association: 'order',
          attributes: ['id', 'code', 'plannedOutput', 'startTime', 'endTime', 'actualStartTime', 'actualEndTime'],
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
          include: [
            {
              association: 'processItem',
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          association: 'depts',
          attributes: ['id', 'name', 'code'],
        },
      ],
    }
    const result = await ProcessTask.findOne(options)
    const temp = await PerformanceConfig.findOne({
      where: {
        materialId: result.dataValues.order.dataValues.bom.dataValues.materialId,
        processId: result.processId,
      },
    })
    if (temp) {
      result.dataValues.process.setDataValue('performanceConfig', temp)
    }

    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      // order: [['id', 'ASC']],
      include: [
        {
          association: 'order',
          attributes: ['id', 'code', 'plannedOutput', 'startTime', 'endTime', 'actualStartTime', 'actualEndTime'],
          where: {},
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
            {
              association: 'processes',
              include: [
                {
                  association: 'process',
                  attributes: ['id', 'processName'],
                },
              ],
            },
          ],
        },
        {
          association: 'process',
          attributes: ['id', 'processName'],
          where: {},
          include: [
            {
              association: 'processItem',
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          association: 'depts',
          attributes: ['id', 'name', 'code'],
        },
      ],
    }
    if (dto.orderCode) {
      options.include[0].where['code'] = {
        [Op.like]: `%${dto.orderCode}%`,
      }
    }
    if (dto.materialCode) {
      options.include[0].include[0].include[0].where['code'] = {
        [Op.like]: `%${dto.materialCode}%`,
      }
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

    if (dto.timeType === '今天') {
      const start = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss')
      const end = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss')
      options.where['endTime'] = {
        [Op.between]: [start, end],
      }
    } else if (dto.timeType === '本周') {
      const start = moment().startOf('week').format('YYYY-MM-DD HH:mm:ss')
      const end = moment().endOf('week').format('YYYY-MM-DD HH:mm:ss')
      options.where['endTime'] = {
        [Op.between]: [start, end],
      }
    } else if (dto.timeType === '本月') {
      const start = moment().startOf('month').format('YYYY-MM-DD HH:mm:ss')
      const end = moment().endOf('month').format('YYYY-MM-DD HH:mm:ss')
      options.where['endTime'] = {
        [Op.between]: [start, end],
      }
    }

    const result = await Paging.diyPaging(ProcessTask, pagination, options)
    // @ts-ignore
    for (const datum of result.data) {
      console.log(datum)
      const temp = await PerformanceConfig.findOne({
        where: {
          materialId: datum.dataValues.order.dataValues.bom.dataValues.materialId,
          processId: datum.processId,
        },
      })
      if (temp) {
        datum.dataValues.process.setDataValue('performanceConfig', temp)
      }
    }
    return result
  }

  public async batDelete(dto: deleteIdsDto, loadModel) {
    for (const id of dto.ids) {
      await this.delete(id, loadModel)
    }
  }

  async changePriority(dto: priorityDto, id, loadModel) {
    const task = await ProcessTask.findByPk(id)
    if (task) {
      await task.update({ priority: dto.priority })
    }
    return this.find(id, loadModel)
  }
}
