import { Injectable, HttpException, Inject } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ProcessPositionTask } from '@model/production/processPositionTask.model'
import { ProcessTask } from '@model/production/processTask.model'
import { User } from '@model/auth/user'
import { Team } from '@model/auth/team'
import { ProductionOrderTask } from '@model/production/productionOrderTask.model'
import { ProductionOrderTaskTeam } from '@model/production/productionOrderTaskOfTeam.model'
import { ProductSerial } from '@model/production/productSerial.model'
import { ProcessLocate } from '@model/production/processLocate.model'
import { ProcessLocateDetail } from '@model/production/processLocateDetail.model'
import { Op, FindOptions, Sequelize, where } from 'sequelize'
import { Pagination } from '@common/interface'
import { FindPaginationOptions } from '@model/shared/interface'
import { AuditStatus, POSITION_TASK_STATUS, PROCESS_TASK_STATUS, ProductSerialStatus } from '@common/enum'
import {
  UpdateProcessPositionTaskDto,
  FindPaginationDto,
  BatchOperationDto,
  StartWorkDto,
  FindByTeamDto,
  CreateProcessLocateDto,
  FindByOrderDto,
  FindProcessLocatePaginationDto,
  AuditProcessLocateDto,
} from './processPositionTask.dto'
import { Paging } from '@library/utils/paging'
import { ProcessLocateItem } from '@model/index'
import moment from 'moment'

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

    await task.update({
      ...dto,
      status: dto.status as POSITION_TASK_STATUS,
    })
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
    if (task.status === POSITION_TASK_STATUS.IN_PROGRESS) {
      throw new HttpException('不能删除进行中的任务', 400)
    }

    await task.destroy()
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
          attributes: ['id', 'status', 'planCount'],
          where: {},
          required: false,
          include: [
            {
              association: 'process',
              attributes: ['id', 'processName'],
            },
            {
              association: 'serial',
              attributes: ['id', 'serialNumber'],
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
    const invalidTasks = tasks.filter(task => task.status !== POSITION_TASK_STATUS.NOT_STARTED)
    if (invalidTasks.length > 0) {
      throw new HttpException('只能开始未开始状态的任务', 400)
    }

    await ProcessPositionTask.update({ status: POSITION_TASK_STATUS.IN_PROGRESS }, { where: { id: { [Op.in]: dto.ids } } })

    return true
  }

  /**
   * 批量暂停任务
   */
  async batchPause(dto: BatchOperationDto): Promise<boolean> {
    const tasks = await ProcessPositionTask.findAll({
      where: { id: { [Op.in]: dto.ids } },
    })

    const invalidTasks = tasks.filter(task => task.status !== POSITION_TASK_STATUS.IN_PROGRESS)
    if (invalidTasks.length > 0) {
      throw new HttpException('只能暂停进行中的任务', 400)
    }

    await ProcessPositionTask.update({ status: POSITION_TASK_STATUS.PAUSED }, { where: { id: { [Op.in]: dto.ids } } })

    return true
  }

  /**
   * 批量恢复任务
   */
  async batchResume(dto: BatchOperationDto): Promise<boolean> {
    const tasks = await ProcessPositionTask.findAll({
      where: { id: { [Op.in]: dto.ids } },
    })

    const invalidTasks = tasks.filter(task => task.status !== POSITION_TASK_STATUS.PAUSED)
    if (invalidTasks.length > 0) {
      throw new HttpException('只能恢复暂停状态的任务', 400)
    }

    await ProcessPositionTask.update({ status: POSITION_TASK_STATUS.IN_PROGRESS }, { where: { id: { [Op.in]: dto.ids } } })

    return true
  }

  /**
   * 批量完成任务
   */
  async batchComplete(dto: BatchOperationDto): Promise<boolean> {
    const tasks = await ProcessPositionTask.findAll({
      where: { id: { [Op.in]: dto.ids } },
    })

    const invalidTasks = tasks.filter(task => task.status !== POSITION_TASK_STATUS.IN_PROGRESS && task.status !== POSITION_TASK_STATUS.PAUSED)
    if (invalidTasks.length > 0) {
      throw new HttpException('只能完成进行中或暂停状态的任务', 400)
    }

    await ProcessPositionTask.update({ status: POSITION_TASK_STATUS.COMPLETED }, { where: { id: { [Op.in]: dto.ids } } })

    return true
  }

  /**
   * 根据班组查询工单带出工序任务单和工位任务单
   */
  async findByTeam(dto: FindByTeamDto) {
    // 验证班组是否存在
    const team = await Team.findByPk(dto.teamId, {
      include: [
        {
          association: 'users',
          attributes: ['id', 'userName', 'userCode', 'departmentId'],
          through: { attributes: [] },
        },
      ],
    })
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
              include: [
                {
                  association: 'processRoute',
                  include: [
                    {
                      association: 'processRouteList',
                      attributes: ['processId'],
                      include: [
                        {
                          association: 'process',
                          attributes: ['id', 'processName'],
                          order: ['sort', 'DESC'],
                          required: true,
                          include: [
                            {
                              association: 'children',
                              attributes: [],
                              required: true,
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      attributes: ['id', 'orderCode', 'splitQuantity', 'startTime', 'endTime', 'priority', 'remark'],
    })

    return {
      team,
      productionOrderTasks: result,
    }
  }

  /**
   * 派工
   */
  async createProcessLocate(dto: CreateProcessLocateDto, assignerId: number) {
    const transaction = await ProcessLocate.sequelize.transaction()

    try {
      // 生成派工编号
      const locateCode = `PG${moment().format('YYYYMMDDHHmmss')}`

      // 创建派工主表
      const processLocate = await ProcessLocate.create(
        {
          locateCode,
          assignerId,
          productionOrderTaskId: dto.productionOrderTaskId,
          materialId: dto.materialId,
          assignTime: new Date(),
          status: AuditStatus.PENDING_REVIEW, // 待审核
          remark: dto.remark,
        },
        { transaction }
      )

      // 验证并创建派工详情
      for (const detail of dto.details) {
        // 验证用户是否存在
        const user = await User.findByPk(detail.userId)
        if (!user) {
          throw new HttpException(`用户ID ${detail.userId} 不存在`, 400)
        }

        // 创建派工详情
        const processLocateDetail = await ProcessLocateDetail.create(
          {
            processLocateId: processLocate.id,
            userId: detail.userId,
            processId: detail.processId,
            assignCount: detail.processPositionTaskIds.length,
            status: ProductSerialStatus.NOT_STARTED, // 未开始
            remark: detail.remark,
          },
          { transaction }
        )

        let processLocateItems = []
        if (detail.processPositionTaskIds?.length > 0) {
          processLocateItems = detail.processPositionTaskIds.map(v => {
            return {
              processPositionTaskId: v,
              processLocateDetailId: processLocateDetail.id,
            }
          })
        } else {
          // 全选
          processLocateItems = await ProcessPositionTask.findAll({
            where: {
              processId: detail.processId,
              productionOrderTaskId: dto.productionOrderTaskId,
              status: POSITION_TASK_STATUS.TO_ASSIGN,
            },
          })
          processLocateItems.map(v => {
            return {
              processPositionTaskId: v.id,
              processLocateDetailId: processLocateDetail.id,
            }
          })
        }

        await ProcessLocateItem.bulkCreate(processLocateItems, { transaction })
      }

      await transaction.commit()

      // 返回创建的派工单详情
      return await ProcessLocate.findByPk(processLocate.id, {
        include: [
          {
            association: 'processLocateDetails',
            include: [
              {
                association: 'process',
                attributes: ['id', 'processName'],
              },
              {
                association: 'processLocateItems',
              },
            ],
          },
        ],
      })
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  /**
   * 查询派工单列表
   */
  async findProcessLocateList(dto: FindProcessLocatePaginationDto, pagination: Pagination) {
    const options = {
      attributes: ['id', 'status', 'locateCode', 'createdAt', 'auditTime', 'auditRemark'],
      where: {},
      include: [
        {
          association: 'assigner',
          attributes: ['id', 'userName', 'userCode'],
        },
        {
          association: 'auditor',
          attributes: ['id', 'userName', 'userCode'],
          required: false,
        },
        {
          association: 'material',
          attributes: ['id', 'code', 'materialName'],
        },
        {
          association: 'productionOrderTask',
          attributes: ['id', 'orderCode', 'startTime', 'endTime'],
        },
        {
          association: 'processLocateDetails',
          include: [
            {
              association: 'process',
              attributes: ['id', 'processName'],
            },
          ],
        },
      ],
      order: [['id', 'DESC']],
    }

    if (dto.status) {
      options.where = {
        status: dto.status,
      }
    }

    const result = await Paging.diyPaging(ProcessLocate, pagination, options)

    return result
  }

  /**
   * 获取派工单详情
   */
  async findProcessLocateDetail(id: number) {
    const result = await ProcessLocate.findByPk(id, {
      include: [
        {
          association: 'assigner',
          attributes: ['id', 'userName', 'userCode'],
        },
        {
          association: 'auditor',
          attributes: ['id', 'userName', 'userCode'],
          required: false,
        },
        {
          association: 'processLocateDetails',
          include: [
            {
              association: 'process',
              attributes: ['id', 'processName'],
            },
            {
              association: 'user',
              attributes: ['id', 'userName', 'userCode'],
            },
            {
              association: 'processLocateItems',
              include: [
                {
                  association: 'processPositionTask',
                  include: [
                    {
                      association: 'serial',
                      attributes: ['id', 'serialNumber'],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })

    if (!result) {
      throw new HttpException('派工单不存在', 400)
    }

    return result
  }

  /**
   * 根据工单和工序查找可派工的序列号
   */
  async findByOrder(dto: FindByOrderDto) {
    const { productionOrderTaskId, processId } = dto

    // 查找工单下的所有工位任务单
    const processPositionTasks = await ProcessPositionTask.findAll({
      where: { productionOrderTaskId, processId },
      include: [
        {
          association: 'serial',
          attributes: ['id', 'serialNumber'],
          include: [
            {
              association: 'material',
              attributes: ['id', 'code', 'materialName'],
            },
          ],
        },
        {
          association: 'locate',
          required: false,
          where: {
            id: null, // 筛选出没有派工记录的数据
          },
        },
      ],
    })

    return processPositionTasks
  }

  /**
   * 批量审核派工单
   */
  async auditProcessLocate(ids: number[], dto: AuditProcessLocateDto, auditorId: number) {
    const transaction = await ProcessLocate.sequelize.transaction()

    try {
      // 查找所有需要审核的派工单
      const processLocates = await ProcessLocate.findAll({
        where: {
          id: ids,
          status: AuditStatus.PENDING_REVIEW, // 只能审核待审核状态的派工单
        },
        transaction,
      })

      if (processLocates.length === 0) {
        throw new HttpException('没有找到可审核的派工单', 400)
      }

      if (processLocates.length !== ids.length) {
        throw new HttpException('部分派工单不存在或状态不正确', 400)
      }

      // 批量更新派工单状态
      await ProcessLocate.update(
        {
          status: dto.status,
          auditRemark: dto.auditRemark,
          auditorId,
          auditTime: new Date(),
        },
        { where: { id: ids }, transaction }
      )

      // 批量更新工位任务单状态
      if (dto.status === AuditStatus.APPROVED) {
        // 如果审核通过，需要通过关联关系更新ProcessPositionTask状态
        await ProcessPositionTask.update(
          {
            status: POSITION_TASK_STATUS.NOT_STARTED,
          },
          {
            where: {
              id: {
                [Op.in]: Sequelize.literal(`(
                  SELECT pli.processPositionTaskId 
                  FROM process_locate_item pli
                  INNER JOIN process_locate_detail pld ON pli.processLocateDetailId = pld.id
                  WHERE pld.processLocateId IN (${ids.join(',')})
                )`),
              },
            },
            transaction,
          }
        )
      }

      await transaction.commit()

      return {
        message: `成功审核 ${processLocates.length} 个派工单`,
        auditedCount: processLocates.length,
        status: dto.status,
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }
}
