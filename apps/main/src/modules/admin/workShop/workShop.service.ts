import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { WorkShop } from '@model/base/workShop.model'
import { CWorkShopDto, FindPaginationDto, FindPaginationScheduleDto, ScheduleDto, ScheduleList, UWorkShopDto } from './workShop.dto'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'
import { ProductionOrderTask, POPSchedule } from '@model/index'
import { SchedulingStatus } from '@common/enum'

@Injectable()
export class WorkShopService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(WorkShop)
    private workShopModel: typeof WorkShop,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CWorkShopDto, loadModel) {
    const temp = await WorkShop.findOne({ where: { name: dto.name } })
    if (temp) throw new HttpException('已存在相同名称车间', 400)
    const result = await WorkShop.create(dto)
    return result
  }

  public async edit(dto: UWorkShopDto, id: number, loadModel) {
    let workShop = await WorkShop.findOne({ where: { id } })
    if (!workShop) {
      throw new HttpException('数据不存在', 400006)
    }
    const temp = await WorkShop.findOne({ where: { name: dto.name, id: { [Op.ne]: id } } })
    if (temp) throw new HttpException('已存在相同名称车间', 400)
    await workShop.update(dto)
    workShop = await WorkShop.findOne({ where: { id } })
    return workShop
  }

  public async delete(id: number, loadModel) {
    const result = await WorkShop.destroy({
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
          association: 'charge',
          attributes: ['id', 'userName'],
        },
      ],
    }
    const result = await WorkShop.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'charge',
          attributes: ['id', 'userName'],
        },
      ],
    }
    if (dto.name) {
      options.where['name'] = {
        [Op.like]: `%${dto.name}%`,
      }
    }

    if (dto.status) {
      const statusString = String(dto.status).toLowerCase().trim() // 确保字符串统一处理
      const statusBoolean = statusString === 'true' || statusString === '1' // 转换逻辑
      options.where['status'] = {
        [Op.eq]: statusBoolean,
      }
    }
    // @ts-ignore
    const result = await Paging.diyPaging(WorkShop, pagination, options)
    return result
  }

  public async schedule(dto: ScheduleDto, loadModel) {
    const { scheduleList, productionOrderTaskId } = dto
    const transaction = await this.sequelize.transaction()

    try {
      const processTask = await ProductionOrderTask.findOne({
        where: { id: productionOrderTaskId },
        include: [
          {
            association: 'material',
            include: [
              {
                association: 'processRoute',
                include: [
                  {
                    association: 'processRouteList',
                    include: [
                      {
                        association: 'process',
                        attributes: ['id', 'processName'],
                      },
                    ],
                    order: [['sort', 'ASC']],
                  },
                ],
              },
            ],
          },
        ],
        transaction,
      })

      if (!processTask) throw new HttpException('生产订单任务不存在', 400)

      if (!processTask.material?.processRoute?.processRouteList) throw new HttpException('该物料未配置工艺路线', 400)

      const processRouteList = processTask.material.processRoute.processRouteList

      if (scheduleList.length !== processRouteList.length) throw new HttpException(`排程数据数量不匹配，工艺路线包含${processRouteList.length}个工序`, 400)

      let scheduleListData = scheduleList as ScheduleList[]
      if (processTask.schedulingStatus == SchedulingStatus.SCHEDULED) {
        // map 为并发的异步操作，会导致事务失效
        const editSchedule = async (data: ScheduleList[]) => {
          for (const v of data) {
            if (v.startTime > v.endTime) throw new HttpException('排程开始时间不能大于结束时间', 400)
            const temp = await POPSchedule.findOne({ where: { processId: v.processId, productionOrderTaskId } })
            if (!temp) throw new HttpException('排程不存在,无法修改', 400)
            v['id'] = temp.dataValues.id
            v['productionOrderTaskId'] = productionOrderTaskId
            if (v.subProcessList?.length > 0) await editSchedule(v.subProcessList) //递归
          }
        }
        await editSchedule(scheduleListData)
      } else {
        // 未排程
        const createSchedule = async (data: ScheduleList[]) => {
          for (const v of data) {
            if (v.startTime > v.endTime) throw new HttpException('排程开始时间不能大于结束时间', 400)
            v['productionOrderTaskId'] = productionOrderTaskId
            if (v.subProcessList?.length > 0) await createSchedule(v.subProcessList) //递归
          }
        }
        await createSchedule(scheduleListData)
      }

      const createScheduleSql = async (data: ScheduleList[]) => {
        await POPSchedule.bulkCreate(data, {
          updateOnDuplicate: ['id', 'startTime', 'endTime', 'processId', 'productionOrderTaskId'],
          transaction,
        })
        for (const v of data) {
          if (v?.subProcessList?.length > 0) await createScheduleSql(v.subProcessList)
        }
      }

      await createScheduleSql(scheduleListData)

      await ProductionOrderTask.update({ schedulingStatus: SchedulingStatus.SCHEDULED }, { where: { id: productionOrderTaskId }, transaction })

      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw new HttpException(error.message || '排程失败', 400)
    }

    return {
      code: 200,
      message: '排程成功',
    }
  }

  public async findPaginationSchedule(dto: FindPaginationScheduleDto, pagination: Pagination) {
    const options: FindPaginationOptions = {
      where: {},
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      pagination,
      // order: [
      //   ['pop', 'id', 'DESC'],
      //   ['id', 'DESC'],
      // ],
      include: [
        {
          association: 'productionOrderTask',
          // attributes: ['id', 'orderCode', 'splitQuantity'],
          where: {},
        },
        {
          association: 'process',
          // attributes: ['id', 'processName'],
        },
      ],
    }

    // 添加时间范围筛选：筛选在指定开始时间和结束时间范围内的记录
    if (dto.startTime && dto.endTime) {
      // 筛选startTime >= dto.startTime 且 endTime <= dto.endTime 的记录
      options.where['startTime'] = { [Op.lte]: new Date(dto.endTime).toISOString() }
      options.where['endTime'] = { [Op.gte]: new Date(dto.startTime).toISOString() }
    } else if (dto.startTime) {
      // 只有开始时间，筛选startTime >= dto.startTime的记录
      options.where['startTime'] = { [Op.gte]: new Date(dto.startTime).toISOString() }
    } else if (dto.endTime) {
      // 只有结束时间，筛选endTime <= dto.endTime的记录
      options.where['endTime'] = { [Op.lte]: new Date(dto.endTime).toISOString() }
    }

    const result = await Paging.diyPaging(POPSchedule, pagination, options)

    return result
  }

  public async getScheduleDetail(productionOrderTaskId: number) {
    const productionOrderTask = await ProductionOrderTask.findOne({
      where: { id: productionOrderTaskId },
      attributes: ['id', 'orderCode', 'splitQuantity', 'schedulingStatus'],
      include: [
        {
          association: 'material',
          attributes: ['id', 'code', 'materialName'],
          include: [
            {
              association: 'processRoute',
              attributes: ['id', 'name'],
              include: [
                {
                  association: 'processRouteList',
                  attributes: ['id', 'processRouteId', 'processId', 'sort', 'reportRatio', 'isReport', 'isOutsource', 'isInspection'],
                  include: [
                    {
                      association: 'process',
                      attributes: ['id', 'processName'],
                      include: [{ association: 'children' }],
                    },
                  ],
                  order: [['sort', 'ASC']],
                },
              ],
            },
          ],
        },
      ],
    })

    if (!productionOrderTask) {
      throw new HttpException('生产订单任务不存在', 400)
    }

    // 查询该任务的所有排程信息
    const scheduleList = await POPSchedule.findAll({
      where: { productionOrderTaskId },
      attributes: ['id', 'processId', 'startTime', 'endTime', 'createdAt', 'updatedAt'],
      include: [
        {
          association: 'process',
          attributes: ['id', 'processName'],
        },
      ],
      order: [['id', 'ASC']],
    })

    const processRouteList = productionOrderTask.material?.processRoute?.processRouteList || []

    // 将排程信息与工艺路线工序进行匹配
    const scheduleDetail = processRouteList.map(routeProcess => {
      const schedule = scheduleList.find(s => s.processId === routeProcess.processId)
      let subProcesses
      if (routeProcess.process?.children?.length > 0) {
        subProcesses = routeProcess.process.children.map(child => {
          const schedule = scheduleList.find(s => s.processId === child.id)
          return {
            id: child.id,
            processName: child.processName,
            sort: child.sort,
            startTime: schedule?.startTime || null,
            endTime: schedule?.endTime || null,
          }
        })
      }
      return {
        processId: routeProcess.processId,
        processName: routeProcess.process?.processName,
        sort: routeProcess.sort,
        startTime: schedule?.startTime || null,
        endTime: schedule?.endTime || null,
        subProcesses: subProcesses || null,
      }
    })

    return {
      productionOrderTask: {
        id: productionOrderTask.id,
        orderCode: productionOrderTask.orderCode,
        splitQuantity: productionOrderTask.splitQuantity,
        schedulingStatus: productionOrderTask.schedulingStatus,
        material: {
          id: productionOrderTask.material?.id,
          materialCode: productionOrderTask.material?.code,
          materialName: productionOrderTask.material?.materialName,
          processRoute: {
            id: productionOrderTask.material?.processRoute?.id,
            processRouteName: productionOrderTask.material?.processRoute?.name,
          },
        },
      },
      scheduleDetail,
    }
  }
}
