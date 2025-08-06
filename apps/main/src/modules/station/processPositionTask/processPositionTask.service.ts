import { Injectable, HttpException, Inject } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ProcessPositionTask } from '@model/production/processPositionTask.model'
import { ProcessTask } from '@model/production/processTask.model'
import { User } from '@model/auth/user'
import { Team } from '@model/auth/team'
import { ProductionOrderTask } from '@model/production/productionOrderTask.model'
import { ProductionOrderTaskTeam } from '@model/production/productionOrderTaskOfTeam.model'
import { ProductSerial } from '@model/production/productSerial.model'
import { Op, FindOptions, Sequelize } from 'sequelize'
import { Pagination } from '@common/interface'
import { FindPaginationOptions } from '@model/shared/interface'
import { PROCESS_TASK_STATUS } from '@common/enum'
import { UpdateProcessPositionTaskDto, FindPaginationDto, BatchOperationDto, StartWorkDto, FindByTeamDto } from './processPositionTask.dto'
import { Paging } from '@library/utils/paging'

@Injectable()
export class ProcessPositionTaskService {
  constructor(
    @InjectModel(ProcessPositionTask)
    private sequelize: Sequelize
  ) {}

  /**
   * 更新工位任务单
   */
  async update(id: number, dto: UpdateProcessPositionTaskDto): Promise<ProcessPositionTask> {
    const task = await ProcessPositionTask.findByPk(id)
    if (!task) {
      throw new HttpException('工位任务单不存在', 400)
    }

    // 如果更新用户，验证用户是否存在
    if (dto.userId) {
      const user = await User.findByPk(dto.userId)
      if (!user) {
        throw new HttpException('指定的用户不存在', 400)
      }
    }

    await task.update(dto)
    return task
  }

  /**
   * 删除工位任务单
   */
  async delete(id: number): Promise<boolean> {
    throw new HttpException('暂未开放', 400)
    const task = await ProcessPositionTask.findByPk(id)
    if (!task) {
      throw new HttpException('工位任务单不存在', 400)
    }

    // 检查任务状态，不允许删除进行中的任务
    if (task.status === PROCESS_TASK_STATUS.running) {
      throw new HttpException('不能删除进行中的任务', 400)
    }

    await task.destroy()
    return true
  }

  /**
   * 批量删除工位任务单
   */
  async batchDelete(dto: BatchOperationDto): Promise<boolean> {
    throw new HttpException('暂未开放', 400)
    // 检查所有任务的状态
    const tasks = await ProcessPositionTask.findAll({
      where: { id: { [Op.in]: dto.ids } },
    })

    const runningTasks = tasks.filter(task => task.status === PROCESS_TASK_STATUS.running)
    if (runningTasks.length > 0) {
      throw new HttpException('存在进行中的任务，无法删除', 400)
    }

    await ProcessPositionTask.destroy({
      where: { id: { [Op.in]: dto.ids } },
    })

    return true
  }

  /**
   * 获取工位任务单详情
   */
  async findOne(id: number): Promise<ProcessPositionTask> {
    const options: FindOptions = {
      where: { id },
      include: [
        {
          association: 'processTask',
          attributes: ['id', 'processName', 'status', 'planCount'],
          include: [
            {
              association: 'order',
              attributes: ['id', 'code'],
            },
          ],
        },
        {
          association: 'user',
          attributes: ['id', 'userName', 'userCode'],
        },
      ],
    }

    const result = await ProcessPositionTask.findOne(options)
    if (!result) {
      throw new HttpException('工位任务单不存在', 400)
    }

    return result
  }

  /**
   * 分页查询工位任务单列表
   */
  async findPagination(dto: FindPaginationDto, pagination: Pagination) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'processTask',
          attributes: ['id', 'processName', 'status', 'planCount'],
          where: {},
          required: false,
          include: [
            {
              association: 'order',
              attributes: ['id', 'code'],
              where: {},
              required: false,
            },
          ],
        },
        {
          association: 'user',
          attributes: ['id', 'userName', 'userCode'],
          where: {},
          required: false,
        },
      ],
    }

    // 添加查询条件
    if (dto.processTaskId) {
      options.where['processTaskId'] = dto.processTaskId
    }

    if (dto.userId) {
      options.where['userId'] = dto.userId
    }

    if (dto.status) {
      options.where['status'] = dto.status
    }

    if (dto.isOutsource !== undefined) {
      options.where['isOutsource'] = dto.isOutsource
    }

    if (dto.isInspection !== undefined) {
      options.where['isInspection'] = dto.isInspection
    }

    if (dto.startTime && dto.endTime) {
      options.where['createdAt'] = {
        [Op.between]: [dto.startTime, dto.endTime],
      }
    }

    const result = await Paging.diyPaging(ProcessPositionTask, pagination, options)
    return result
  }

  /**
   * 开始工作
   */
  async startWork(dto: StartWorkDto): Promise<boolean> {
    const tasks = await ProcessPositionTask.findAll({
      where: { id: { [Op.in]: dto.ids } },
    })

    if (tasks.length === 0) {
      throw new HttpException('未找到指定的任务', 400)
    }

    // 检查任务状态
    const invalidTasks = tasks.filter(task => task.status !== PROCESS_TASK_STATUS.notStart)
    if (invalidTasks.length > 0) {
      throw new HttpException('只能开始未开始状态的任务', 400)
    }

    await ProcessPositionTask.update({ status: PROCESS_TASK_STATUS.running }, { where: { id: { [Op.in]: dto.ids } } })

    return true
  }

  /**
   * 批量暂停任务
   */
  async batchPause(dto: BatchOperationDto): Promise<boolean> {
    const tasks = await ProcessPositionTask.findAll({
      where: { id: { [Op.in]: dto.ids } },
    })

    const invalidTasks = tasks.filter(task => task.status !== PROCESS_TASK_STATUS.running)
    if (invalidTasks.length > 0) {
      throw new HttpException('只能暂停进行中的任务', 400)
    }

    await ProcessPositionTask.update({ status: PROCESS_TASK_STATUS.pause }, { where: { id: { [Op.in]: dto.ids } } })

    return true
  }

  /**
   * 批量恢复任务
   */
  async batchResume(dto: BatchOperationDto): Promise<boolean> {
    const tasks = await ProcessPositionTask.findAll({
      where: { id: { [Op.in]: dto.ids } },
    })

    const invalidTasks = tasks.filter(task => task.status !== PROCESS_TASK_STATUS.pause)
    if (invalidTasks.length > 0) {
      throw new HttpException('只能恢复暂停状态的任务', 400)
    }

    await ProcessPositionTask.update({ status: PROCESS_TASK_STATUS.running }, { where: { id: { [Op.in]: dto.ids } } })

    return true
  }

  /**
   * 批量完成任务
   */
  async batchComplete(dto: BatchOperationDto): Promise<boolean> {
    const tasks = await ProcessPositionTask.findAll({
      where: { id: { [Op.in]: dto.ids } },
    })

    const invalidTasks = tasks.filter(task => task.status !== PROCESS_TASK_STATUS.running && task.status !== PROCESS_TASK_STATUS.pause)
    if (invalidTasks.length > 0) {
      throw new HttpException('只能完成进行中或暂停状态的任务', 400)
    }

    await ProcessPositionTask.update({ status: PROCESS_TASK_STATUS.finish }, { where: { id: { [Op.in]: dto.ids } } })

    return true
  }

  /**
   * 根据班组查询工单带出工序任务单和工位任务单
   */
  async findByTeam(dto: FindByTeamDto) {
    // 验证班组是否存在
    const team = await Team.findByPk(dto.teamId)
    if (!team) {
      throw new HttpException('班组不存在', 400)
    }

    // 构建查询条件
    const productionOrderTaskWhere: any = {}
    if (dto.orderStatus) {
      productionOrderTaskWhere.status = dto.orderStatus
    }

    const processTaskWhere: any = {}
    if (dto.processTaskStatus) {
      processTaskWhere.status = dto.processTaskStatus
    }

    const positionTaskWhere: any = {}
    if (dto.positionTaskStatus) {
      positionTaskWhere.status = dto.positionTaskStatus
    }

    // 查询班组关联的生产工单任务
    const result = await ProductionOrderTask.findAll({
      where: productionOrderTaskWhere,
      include: [
        {
          association: 'teams',
          where: { id: dto.teamId },
          through: {},
          required: true,
          attributes: [],
        },
        {
          association: 'productionOrderDetail',
          attributes: ['id', 'orderCode', 'materialId', 'plannedOutput'],
          include: [
            {
              association: 'material',
              attributes: ['id', 'code', 'materialName'],
            },
          ],
        },
        {
          association: 'productSerials',
          attributes: ['id', 'serialNumber', 'status'],
          include: [
            {
              association: 'processTasks',
              where: processTaskWhere,
              required: false,
              attributes: ['id', 'status', 'planCount', 'goodCount', 'badCount'],
              include: [
                {
                  association: 'process',
                  attributes: ['id', 'processName'],
                },
                {
                  association: 'processPositionTasks',
                  where: positionTaskWhere,
                  required: false,
                  attributes: ['id', 'reportRatio', 'planCount', 'goodCount', 'badCount', 'status', 'isOutsource', 'isInspection'],
                  include: [
                    {
                      association: 'user',
                      attributes: ['id', 'userName', 'userCode'],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      order: [
        ['id', 'DESC'],
        // ['productSerials', 'id', 'ASC'],
        // ['productSerials', 'processTasks', 'id', 'ASC'],
        // ['productSerials', 'processTasks', 'processPositionTasks', 'id', 'ASC'],
      ],
    })

    return {
      team: {
        id: team.id,
        name: team.name,
        workShopId: team.workShopId,
        status: team.status,
      },
      productionOrderTasks: result,
    }
  }
}
