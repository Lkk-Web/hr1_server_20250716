import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { CApiConfigDto, FindPaginationDto, UApiConfigDto } from './apiConfig.dto'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'
import { ApiConfig } from '@model/index'

@Injectable()
export class ApiConfigService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(ApiConfig)
    private apiConfigModel: typeof ApiConfig,
    private sequelize: Sequelize
  ) { }

  public async create(dto: CApiConfigDto, loadModel) {
    const temp = await ApiConfig.findOne({ where: { name: dto.name } })
    if (temp) throw new HttpException('已有同名称配置存在', 400)
    const result = await ApiConfig.create(dto)
    return result
  }

  public async edit(dto: UApiConfigDto, id: number, loadModel) {
    let apiConfig = await ApiConfig.findOne({ where: { id } })
    if (!apiConfig) {
      throw new HttpException('数据不存在', 400006)
    }
    const temp = await ApiConfig.findOne({ where: { name: dto.name, id: { [Op.ne]: id } } })
    if (temp) throw new HttpException('已有同名称配置存在', 400)
    await apiConfig.update(dto)
    apiConfig = await ApiConfig.findOne({ where: { id } })
    return apiConfig
  }

  public async delete(id: number, loadModel) {
    const result = await ApiConfig.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = { where: { id }, include: [{ all: true }] }
    const result = await ApiConfig.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
    }
    // @ts-ignore
    const result = await Paging.diyPaging(ApiConfig, pagination, options);
    return result
  }
}
