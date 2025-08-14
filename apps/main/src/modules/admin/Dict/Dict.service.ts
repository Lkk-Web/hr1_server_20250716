import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { CApiDictDto, FindPaginationDto, UApiDictDto } from './Dict.dto'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'
import { Dict } from '@model/system/Dict.model'

@Injectable()
export class DictService {
  constructor() {}

  public async create(dto: CApiDictDto) {
    const result = await Dict.create(dto)
    return result
  }

  public async edit(dto: UApiDictDto, id: number) {
    let apiDict = await Dict.findOne({ where: { id } })
    if (!apiDict) {
      throw new HttpException('数据不存在', 400006)
    }
    await apiDict.update(dto)
    apiDict = await Dict.findOne({ where: { id } })
    return apiDict
  }

  public async delete(id: number) {
    const result = await Dict.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number) {
    const options: FindOptions = { where: { id }, include: [{ all: true }] }
    const result = await Dict.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
    }

    if (dto.code) {
      options.where['code'] = {
        [Op.eq]: dto.code,
      }
    }

    if (dto.content) {
      options.where['content'] = {
        [Op.eq]: dto.content,
      }
    }
    if (dto.type) {
      options.where['type'] = {
        [Op.eq]: dto.type,
      }
    }
    const result = await Paging.diyPaging(Dict, pagination, options)
    return result
  }
}
