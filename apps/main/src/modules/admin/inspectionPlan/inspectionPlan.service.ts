import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { CInspectionPlanDTO, FindPaginationDto, UInspectionPlanDTO } from './inspectionPlan.dto'
import { InspectionPlan } from '@model/em/inspectionPlan.model'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { InspectionPlanDetail } from '@model/em/inspectionPlanDetail.model'
import { Paging } from '@library/utils/paging'
import { FileList } from '@model/document/FileList.model'

@Injectable()
export class InspectionPlanService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(InspectionPlan)
    private inspectionPlanModel: typeof InspectionPlan,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CInspectionPlanDTO, user, loadModel) {
    const temp = await InspectionPlan.findOne({ where: { name: dto.name } })
    if (temp) throw new HttpException('同名称巡检计划已经存在', 400)
    if (dto.code) {
      const temp = await InspectionPlan.findOne({ where: { code: dto.code } })
      if (temp) throw new HttpException('已存在相同编号的点击标准', 400)
    } else {
      const date = new Date()
      const year = date.getFullYear().toString().substring(2)
      const temp = await InspectionPlan.findOne({
        order: [['id', 'DESC']],
        where: { code: { [Op.like]: `XJFA${year}%` } },
      })
      if (temp) {
        const oldNO = temp.code
        const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
        let num = parseInt(lastFourChars)
        num++
        let newNO = num.toString().padStart(4, '0')

        dto.code = 'XJFA' + year + newNO
      } else {
        dto.code = 'XJFA' + year + '0001'
      }
    }
    const result = await InspectionPlan.create({
      code: dto.code,
      name: dto.name,
      frequency: dto.frequency,
      times: dto.times,
      status: dto.status,
      remark: dto.remark,
      createdUserId: user.id,
      updatedUserId: user.id,
    })
    if (dto.details) {
      for (const detail of dto.details) {
        await InspectionPlanDetail.create({
          inspectionPlanId: result.id,
          name: detail.name,
          method: detail.method,
          min: detail.min,
          max: detail.max,
          status: detail.status,
        })
      }
    }
    return result
  }

  public async edit(dto: UInspectionPlanDTO, id: number, user, loadModel) {
    let inspectionPlan = await InspectionPlan.findOne({ where: { id } })
    if (!inspectionPlan) {
      throw new HttpException('数据不存在', 400006)
    }
    const temp = await InspectionPlan.findOne({ where: { name: dto.name, id: { [Op.ne]: id } } })
    if (temp) throw new HttpException('同名称巡检计划已经存在', 400)
    await InspectionPlanDetail.destroy({ where: { inspectionPlanId: id } })
    await inspectionPlan.update({
      name: dto.name,
      frequency: dto.frequency,
      times: dto.times,
      status: dto.status,
      remark: dto.remark,
      updatedUserId: user.id,
    })
    if (dto.details) {
      for (const detail of dto.details) {
        await InspectionPlanDetail.create({
          inspectionPlanId: id,
          name: detail.name,
          method: detail.method,
          min: detail.min,
          max: detail.max,
          status: detail.status,
        })
      }
    }
    inspectionPlan = await InspectionPlan.findOne({ where: { id } })
    return inspectionPlan
  }

  public async delete(id: number, loadModel) {
    await InspectionPlanDetail.destroy({ where: { inspectionPlanId: id } })
    const result = await InspectionPlan.destroy({
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
          association: 'createdUser',
          attributes: ['id', 'userName'],
          required: false,
        },
        {
          association: 'updatedUser',
          attributes: ['id', 'userName'],
          required: false,
        },
        {
          association: 'details',
          where: {},
        },
      ],
    }
    const result = await InspectionPlan.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'createdUser',
          attributes: ['id', 'userName'],
          required: false,
        },
        {
          association: 'updatedUser',
          attributes: ['id', 'userName'],
          required: false,
        },
        {
          association: 'details',
          where: {},
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

    if (dto.frequency) {
      options.where['frequency'] = {
        [Op.like]: `%${dto.frequency}%`,
      }
    }
    const result = await Paging.diyPaging(InspectionPlan, pagination, options)
    return result
  }
}
