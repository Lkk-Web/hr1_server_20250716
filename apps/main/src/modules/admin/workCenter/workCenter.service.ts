import { RedisProvider } from '@library/redis'
import { WorkCenter } from '@model/base/workCenter.model'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Redis } from '@sophons/redis'
import { Sequelize } from 'sequelize-typescript'
import { CreateWorkCenterDto, FindPaginationDto, FindPaginationScheduleDto, ScheduleDto, UpdateWorkCenterDto } from './workCenter.dto'
import { Op } from 'sequelize'
import { Pagination } from '@common/interface'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'
import { POP, Process, ProcessTask, ProductionOrder, ProductionOutsourcing, WorkCenterOfPOP, WorkShop } from '@model/index'
import _ = require('lodash')

@Injectable()
export class WorkCenterService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(WorkCenter)
    private workCenterModel: typeof WorkCenter,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CreateWorkCenterDto, loadModel) {
    const value = await WorkCenter.findOne({
      where: {
        name: dto.name,
      },
    })
    if (value) throw new HttpException('已存在相同名称工作中心', 400)
    if (!dto.code) {
      const date = new Date()
      const year = date.getFullYear().toString().substring(2)
      const month = date.getMonth().toString().padStart(2, '0')
      const temp = await WorkCenter.findOne({
        order: [['id', 'DESC']],
        where: { code: { [Op.like]: `WC${year}${month}%` } },
      })
      if (temp) {
        const oldNO = temp.code
        const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
        let num = parseInt(lastFourChars)
        num++
        let newNO = num.toString().padStart(4, '0')

        dto.code = 'WC' + year + month + newNO
      } else {
        dto.code = 'WC' + year + month + '0001'
      }
    }
    console.log('输出一下Code', dto.code)
    const workCenter = await WorkCenter.findOne({
      where: {
        code: dto.code,
      },
    })
    if (workCenter) {
      throw new HttpException('已存在相同编号工作中心', 400)
    }
    const result = await WorkCenter.create(dto)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'workShop',
          attributes: ['id', 'name'],
        },
        {
          association: 'process',
          attributes: ['id', 'processName'],
        },
      ],
    }
    if (dto.name) {
      options.where['name'] = {
        [Op.like]: `%${dto.name}%`,
      }
    }

    if (dto.code) {
      options.where['code'] = {
        [Op.like]: `%${dto.code}%`,
      }
    }

    if (dto.workShopName) {
      const workShop = await WorkShop.findOne({
        where: {
          name: {
            [Op.like]: `%${dto.workShopName}%`,
          },
        },
      })
      if (!workShop) {
        return null
      }
      options.where['workShopId'] = {
        [Op.like]: `%${workShop.id}%`,
      }
    }

    if (dto.processName) {
      const process = await Process.findOne({
        where: {
          processName: {
            [Op.like]: `%${dto.processName}%`,
          },
        },
      })
      if (!process) {
        return null
      }
      options.where['processId'] = {
        [Op.like]: `%${process.id}%`,
      }
    }

    // @ts-ignore
    const result = await Paging.diyPaging(WorkCenter, pagination, options)
    return result
  }

  public async delete(id: number, loadModel) {
    const result = await WorkCenter.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async update(id: number, dto: UpdateWorkCenterDto, loadModel) {
    const workCenter = await WorkCenter.findByPk(id)
    if (!workCenter) {
      throw new HttpException('工作中心不存在', 400)
    }
    const result = await WorkCenter.findOne({ where: { name: dto.name, id: { [Op.ne]: id } } })
    if (result) {
      throw new HttpException('已存在相同名称工作中心', 400)
    }
    await workCenter.update(dto)
    return this.detail(id, loadModel)
  }

  public async detail(id: number, loadModel) {
    const workCenter = await WorkCenter.findByPk(id)
    if (!workCenter) {
      throw new HttpException('工作中心不存在', 400)
    }
    return workCenter
  }

  public async schedule(dto: ScheduleDto, loadModel) {
    const { ScheduleList, productionOrderId } = dto

    const productionOrder = await POP.findAll({ where: { productionOrderId } })
    if (ScheduleList.length != productionOrder.length) throw new HttpException('请填写完整排产数据', 400)

    ScheduleList.map(async (i, v) => {
      const { startTime, endTime, POPId } = i
      if (startTime > endTime) throw new HttpException('开始时间不能大于结束时间', 400)
      // 工单工序

      const pop = await POP.findOne({ where: { id: POPId } })
      await pop.update({ startTime, endTime })
      // 有工序任务单需要更改执行时间
      if (pop.dataValues.processTaskId) await ProcessTask.update({ startTime, endTime }, { where: { id: pop.dataValues.processTaskId } })
    })

    //批量创建、更新
    await WorkCenterOfPOP.bulkCreate(ScheduleList, { updateOnDuplicate: ['id', 'POPId', 'workCenterId'] })

    await ProductionOrder.update({ schedulingStatus: '已排产' }, { where: { id: productionOrderId } })

    return {
      message: '排产成功',
    }
  }

  public async findPaginationSchedule(dto: FindPaginationScheduleDto, pagination: Pagination) {
    const options: FindPaginationOptions = {
      where: {},
      attributes: ['id', 'workCenterId'],
      pagination,
      order: [
        ['pop', 'id', 'DESC'],
        ['id', 'DESC'],
      ],
      include: [
        {
          association: 'workCenter',
          attributes: ['id', 'name'],
        },
        {
          association: 'pop',
          attributes: ['id', 'productionOrderId', 'startTime', 'endTime', 'planCount'],
          where: {},
          include: [
            {
              association: 'productionOrder',
              attributes: ['code', 'kingdeeCode'],
              include: [
                {
                  association: 'bom',
                  attributes: ['code'],
                  include: [
                    {
                      association: 'parentMaterial',
                      attributes: ['materialName', 'code'],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    // 添加时间范围筛选：筛选在指定开始时间和结束时间范围内的记录
    if (dto.startTime && dto.endTime) {
      // 筛选startTime >= dto.startTime 且 endTime <= dto.endTime 的记录
      options.include[1].where['startTime'] = { [Op.lte]: new Date(dto.endTime).toISOString() }
      options.include[1].where['endTime'] = { [Op.gte]: new Date(dto.startTime).toISOString() }
    } else if (dto.startTime) {
      // 只有开始时间，筛选startTime >= dto.startTime的记录
      options.include[1].where['startTime'] = { [Op.gte]: new Date(dto.startTime).toISOString() }
    } else if (dto.endTime) {
      // 只有结束时间，筛选endTime <= dto.endTime的记录
      options.include[1].where['endTime'] = { [Op.lte]: new Date(dto.endTime).toISOString() }
    }

    const result = await Paging.diyPaging(WorkCenterOfPOP, pagination, options)

    // const grouped = _.chain(JSON.parse(JSON.stringify(result.data))).groupBy(item => item.workCenter.name) // 以 workCenter.id 分组

    return result
  }
}
