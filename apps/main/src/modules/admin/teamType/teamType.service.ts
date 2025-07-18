import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { TeamType } from '@model/sm/teamType.model'
import { CTeamTypeDto, FindPaginationDto, UTeamTypeDto } from './teamType.dto'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { ProcessRoute } from '@model/pm/processRoute.model'
import { Paging } from '@library/utils/paging'
import { Supplier } from '@model/base/supplier.model'

@Injectable()
export class TeamTypeService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(TeamType)
    private teamTypeModel: typeof TeamType,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CTeamTypeDto, loadModel) {
    const temp = await TeamType.findOne({ where: { name: dto.name } })
    if (temp) throw new HttpException('已有同名称类型存在', 400)
    const result = await TeamType.create(dto)
    return result
  }

  public async edit(dto: UTeamTypeDto, id: number, loadModel) {
    let teamType = await TeamType.findOne({ where: { id } })
    if (!teamType) {
      throw new HttpException('数据不存在', 400006)
    }
    const temp = await TeamType.findOne({ where: { name: dto.name, id: { [Op.ne]: id } } })
    if (temp) throw new HttpException('已有同名称类型存在', 400)
    await teamType.update(dto)
    teamType = await TeamType.findOne({ where: { id } })
    return teamType
  }

  public async delete(id: number, loadModel) {
    const result = await TeamType.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = { where: { id }, include: [{ all: true }] }
    const result = await TeamType.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
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
    const result = await Paging.diyPaging(TeamType, pagination, options)
    return result
  }
}
