import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { WorkShop } from '@model/base/workShop.model'
import { CWorkShopDto, FindPaginationDto, UWorkShopDto } from './workShop.dto'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'
import { Supplier } from '@model/base/supplier.model'

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
}
