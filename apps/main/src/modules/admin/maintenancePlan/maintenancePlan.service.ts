import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { CMaintenancePlanDto, FindPaginationDto, UMaintenancePlanDto } from './maintenancePlan.dto'
import { MaintenancePlan } from '@model/equipment/maintenancePlan.model'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { InspectionPlanDetail } from '@model/equipment/inspectionPlanDetail.model'
import { MaintenancePlanDetail } from '@model/equipment/maintenancePlanDetail.model'
import { Paging } from '@library/utils/paging'

@Injectable()
export class MaintenancePlanService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(MaintenancePlan)
    private maintenancePlanModel: typeof MaintenancePlan,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CMaintenancePlanDto, user, loadModel) {
    const temp = await MaintenancePlan.findOne({ where: { name: dto.name } })
    if (temp) throw new HttpException('同名称巡检计划已经存在', 400)
    if (dto.code) {
      const temp = await MaintenancePlan.findOne({ where: { code: dto.code } })
      if (temp) throw new HttpException('已存在相同编号的点击标准', 400)
    } else {
      const date = new Date()
      const year = date.getFullYear().toString().substring(2)
      const temp = await MaintenancePlan.findOne({
        order: [['id', 'DESC']],
        where: { code: { [Op.like]: `BYFA${year}%` } },
      })
      if (temp) {
        const oldNO = temp.code
        const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
        let num = parseInt(lastFourChars)
        num++
        let newNO = num.toString().padStart(4, '0')

        dto.code = 'BYFA' + year + newNO
      } else {
        dto.code = 'BYFA' + year + '0001'
      }
    }
    const result = await MaintenancePlan.create({
      code: dto.code,
      name: dto.name,
      frequency: dto.frequency,
      status: dto.status,
      remark: dto.remark,
      createdUserId: user.id,
      updatedUserId: user.id,
    })
    if (dto.details) {
      for (const detail of dto.details) {
        await MaintenancePlanDetail.create({
          maintenancePlanId: result.id,
          name: detail.name,
          method: detail.method,
          type: detail.type,
        })
      }
    }
    return result
  }

  public async edit(dto: UMaintenancePlanDto, id: number, user, loadModel) {
    let maintenancePlan = await MaintenancePlan.findOne({ where: { id } })
    if (!maintenancePlan) {
      throw new HttpException('数据不存在', 400006)
    }
    const temp = await MaintenancePlan.findOne({ where: { name: dto.name, id: { [Op.ne]: id } } })
    if (temp) throw new HttpException('同名称巡检计划已经存在', 400)
    await MaintenancePlanDetail.destroy({ where: { maintenancePlanId: id } })
    await maintenancePlan.update({
      name: dto.name,
      frequency: dto.frequency,
      status: dto.status,
      remark: dto.remark,
      updatedUserId: user.id,
    })
    if (dto.details) {
      for (const detail of dto.details) {
        await MaintenancePlanDetail.create({
          maintenancePlanId: id,
          name: detail.name,
          method: detail.method,
          type: detail.type,
        })
      }
    }
    maintenancePlan = await MaintenancePlan.findOne({ where: { id } })
    return maintenancePlan
  }

  public async delete(id: number, loadModel) {
    await MaintenancePlanDetail.destroy({ where: { maintenancePlanId: id } })
    const result = await this.maintenancePlanModel.destroy({
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
    const result = await MaintenancePlan.findOne(options)
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

    if (dto.code) {
      options.where['code'] = {
        [Op.like]: `%${dto.code}%`,
      }
    }

    if (dto.name) {
      options.where['name'] = {
        [Op.like]: `%${dto.name}%`,
      }
    }

    if (dto.frequency) {
      options.where['frequency'] = {
        [Op.like]: `%${dto.frequency}%`,
      }
    }
    const result = await Paging.diyPaging(MaintenancePlan, pagination, options)
    return result
  }
}
