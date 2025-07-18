import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { Warehouse } from '@model/warehouse/warehouse.model'
import { CWarehouseDto, FindPaginationDto, UWarehouseDto } from './warehouse.dto'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'
import { Supplier } from '@model/base/supplier.model'

@Injectable()
export class WarehouseService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(Warehouse)
    private warehouseModel: typeof Warehouse,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CWarehouseDto, loadModel) {
    const temp = await Warehouse.findOne({ where: { name: dto.name } })
    if (temp) throw new HttpException('已存在相同名称的仓库', 400)
    const result = await Warehouse.create(dto)
    return result
  }

  public async edit(dto: UWarehouseDto, id: number, loadModel) {
    let warehouse = await Warehouse.findOne({ where: { id } })
    if (!warehouse) {
      throw new HttpException('数据不存在', 400006)
    }
    const temp = await Warehouse.findOne({ where: { name: dto.name, id: { [Op.ne]: id } } })
    if (temp) throw new HttpException('已存在相同名称的仓库', 400)
    await warehouse.update(dto)
    warehouse = await Warehouse.findOne({ where: { id } })
    return warehouse
  }

  public async delete(id: number, loadModel) {
    const result = await Warehouse.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = { where: { id }, include: [{ all: true }] }
    const result = await Warehouse.findOne(options)
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

    if (dto.type) {
      options.where['type'] = {
        [Op.eq]: dto.type,
      }
    }

    if (dto.status) {
      const statusString = String(dto.status).toLowerCase().trim() // 确保字符串统一处理
      const statusBoolean = statusString === 'true' || statusString === '1' // 转换逻辑
      options.where['status'] = {
        [Op.eq]: statusBoolean,
      }
    }

    if (dto.ids) {
      options.where['id'] = {
        [Op.notIn]: dto.ids,
      }
    }
    // @ts-ignore
    const result = await Paging.diyPaging(Warehouse, pagination, options)
    return result
  }
}
