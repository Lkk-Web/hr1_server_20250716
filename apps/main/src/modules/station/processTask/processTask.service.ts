import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { ProcessTask } from '@model/production/processTask.model'
import { BatchStartWorkDto, FindPaginationDto, MaterialUrgingOrderDto, StartWorkDto } from './processTask.dto'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Notify, PerformanceConfig, Process, ProcessRoute, ProcessTaskLog, SOP } from '@model/index'
import { Sequelize } from 'sequelize-typescript'
import { NOTIFY_SCENE, PROCESS_TASK_STATUS } from '@common/enum'
import { Aide } from '@library/utils/aide'

@Injectable()
export class ProcessTaskService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,
    @InjectModel(ProcessTask)
    private processTaskModel: typeof ProcessTask
  ) {}

  public async find(id: number) {
    const options: FindOptions = {
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
      where: { id },
      include: [
        {
          association: 'order',
          attributes: ['id', 'code', 'plannedOutput', 'startTime', 'endTime', 'actualStartTime', 'actualEndTime', 'topMaterialId', 'subMaterialId', 'kingdeeCode'],
          include: [
            {
              association: 'bom',
              attributes: ['id', 'remark', 'quantity', 'formData', 'materialId'],
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
              association: 'boms',
              attributes: ['id', 'materialId', 'count', 'unit'],
              include: [
                {
                  association: 'items',
                  attributes: ['id', 'item', 'materialId', 'ratio', 'type', 'numerator', 'denominator'],
                  include: [
                    {
                      association: 'material',
                      attributes: ['id', 'name', 'code'],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          association: 'process',
          attributes: ['id', 'processName'],
        },
      ],
    }
    const result = await ProcessTask.findOne(options)

    const sop = await SOP.findOne({
      where: { processId: result.processId },
      include: [
        {
          association: 'fileList',
          attributes: ['id', 'name', 'url'],
          where: {},
          through: { attributes: [] },
        },
        {
          association: 'materials',
          attributes: ['id', 'name', 'code', 'spec'],
          where: { id: result.dataValues.order.dataValues.bom.dataValues.parentMaterial.dataValues.id },
          through: { attributes: [] },
        },
      ],
    })

    if (sop) {
      result.setDataValue('sop', sop)
    } else {
      const processSop = await SOP.findOne({
        where: { processId: result.processId },
        include: [
          {
            association: 'fileList',
            attributes: ['id', 'name', 'url'],
            where: {},
            through: { attributes: [] },
          },
          {
            association: 'materials',
            attributes: ['id', 'name', 'code', 'spec'],
            through: { attributes: [] },
          },
        ],
      })
      if (processSop) {
        result.setDataValue('sop', processSop)
      } else {
        result.setDataValue('sop', null)
      }
    }

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

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, processId) {
    const options: FindPaginationOptions = {
      where: {
        processId: {
          [Op.eq]: processId,
        },
      },
      attributes: [
        'id',
        'updatedAt',
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
        'receptionCount',
        'reportQuantity',
      ],
      pagination,
      // order: [['id', 'ASC']],
      include: [
        {
          association: 'order',
          attributes: ['id', 'code', 'plannedOutput', 'startTime', 'endTime', 'actualStartTime', 'actualEndTime', 'kingdeeCode', 'salesOrderCode'],
          where: {},
          include: [
            {
              association: 'bom',
              attributes: ['id', 'materialId', 'remark', 'version', 'quantity', 'formData'],
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
          where: {},
        },
        { association: 'operateLogs', attributes: ['pauseTime', 'resumeTime'] },
      ],
    }
    if (dto.orderCode) {
      options.include[0].where['code'] = {
        [Op.like]: `%${dto.orderCode}%`,
      }
    }
    if (dto.filterStatus) {
      options.where['status'] = { [Op.not]: dto.filterStatus }
    }
    if (dto.status) {
      options.where['status'] = options.where['status'] || {}
      options.where['status'] = { [Op.eq]: dto.status }
    }

    if (dto.currentProcess) {
      const statusString = String(dto.currentProcess).toLowerCase().trim() // 确保字符串统一处理
      const statusBoolean = statusString === 'true' || statusString === '1' // 转换逻辑
      if (statusBoolean) {
        options.where = {
          ...options.where, // 保留已有的条件

          planCount: {
            [Op.gt]: Sequelize.col('goodCount'), // 比较两列值
          },
        }
      }
    }

    const result = await ProcessTask.findPagination(options)
    // @ts-ignore
    for (const datum of result.data) {
      // console.log(datum)
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

  public async startWork(dto: StartWorkDto) {
    const task = await ProcessTask.findByPk(dto.id, { attributes: ['id', 'receptionCount'] })
    if (!task) {
      throw new HttpException('任务不存在', 400)
    }
    if (task.receptionCount <= 0) {
      Aide.throwException(400011, '任务未接收，无法开始工作')
    }
    task.actualStartTime = new Date()
    task.status = PROCESS_TASK_STATUS.running
    await task.save()
    return task
  }

  public async batchStartWork(dto: BatchStartWorkDto) {
    const tasksCount = await ProcessTask.count({
      where: { id: dto.ids, status: PROCESS_TASK_STATUS.notStart },
    })
    if (tasksCount != dto.ids.length) Aide.throwException(400011)
    let tasks = await ProcessTask.update(
      {
        actualStartTime: new Date(),
        status: PROCESS_TASK_STATUS.running,
      },
      {
        where: {
          id: dto.ids,
          receptionCount: {
            [Op.gt]: 0,
          },
        },
      }
    )
    return tasks
  }

  //工序暂停
  public async batchBatchPauseWork(dto: BatchStartWorkDto) {
    const tasksCount = await ProcessTask.count({
      where: { id: dto.ids, status: PROCESS_TASK_STATUS.running },
    })

    if (tasksCount != dto.ids.length) Aide.throwException(400011)

    await ProcessTask.update(
      {
        status: PROCESS_TASK_STATUS.pause,
      },
      { where: { id: dto.ids } }
    )

    await ProcessTaskLog.bulkCreate(
      dto.ids.map(id => {
        return {
          processTaskID: id,
          pauseTime: new Date(),
        }
      })
    )

    return true
  }

  //恢复
  public async batchResumeWork(dto: BatchStartWorkDto) {
    const tasksCount = await ProcessTask.count({
      where: { id: dto.ids, status: PROCESS_TASK_STATUS.pause },
    })
    if (tasksCount != dto.ids.length) Aide.throwException(400011)

    await ProcessTaskLog.update(
      {
        resumeTime: new Date(),
      },
      { where: { processTaskID: dto.ids, resumeTime: null } }
    )

    await ProcessTask.update(
      {
        status: PROCESS_TASK_STATUS.running,
      },
      { where: { id: dto.ids } }
    )

    return true
  }

  //物料催单
  public async materialUrgingOrder(dto: MaterialUrgingOrderDto, req) {
    const task = await ProcessTask.findOne({
      where: { id: dto.id },
      attributes: ['id'],
      include: [{ association: 'order', attributes: ['kingdeeCode'] }],
    })
    if (!task) Aide.throwException(400011)
    await Notify.create({
      processTaskId: dto.id,
      content: dto.content,
      scene: dto.scene,
      teamId: dto.teamId,
      topic: `${task.order.kingdeeCode}生产工单${dto.scene == NOTIFY_SCENE.PAD_M_O ? '缺料' : '申请领料'}，请及时处理，谢谢！`,
      name: `${req.team.name}/${req.process.processName}`,
    })
    return true
  }

  public async processFind(id: number) {
    const options: FindOptions = {
      where: { id },
      include: [
        {
          association: 'processItem',
          attributes: ['id', 'name'],
        },
        {
          association: 'processDept',
          attributes: ['id', 'name'],
          where: {},
        },
      ],
    }
    const result = await Process.findOne(options)
    return result
  }

  //通过物料查询工艺路线
  public async getProcessRouteList(materialId: number) {
    const process = await ProcessRoute.findOne({
      include: [
        { association: 'material', attributes: [], where: { id: materialId } },
        { association: 'processRouteList', attributes: ['isOutsource', 'processId'], include: [{ association: 'process', attributes: ['id', 'processName'] }] },
      ],
    })
    return process ? process.processRouteList : []
  }
}
