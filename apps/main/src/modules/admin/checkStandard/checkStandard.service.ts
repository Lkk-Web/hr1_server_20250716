import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { CCheckStandardDto, FindPaginationDto, UCheckStandardDto } from './checkStandard.dto'
import { CheckStandard } from '@model/em/checkStandard.model'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { InboundOrder } from '@model/warehouse/inboundOrder.model'
import { CheckStandardDetail } from '@model/em/checkStandardDetail.model'
import { Paging } from '@library/utils/paging'
import { AdjustOrder } from '@model/warehouse/adjustOrder.model'

@Injectable()
export class CheckStandardService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(CheckStandard)
    private checkStandardModel: typeof CheckStandard,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CCheckStandardDto, user, loadModel) {
    const temp = await CheckStandard.findOne({ where: { name: dto.name } })
    if (temp) throw new HttpException('同名称点检标准已存在', 400)
    if (dto.code) {
      const temp = await CheckStandard.findOne({ where: { code: dto.code } })
      if (temp) throw new HttpException('已存在相同编号的点击标准', 400)
    } else {
      const date = new Date()
      const year = date.getFullYear().toString().substring(2)
      const temp = await CheckStandard.findOne({
        order: [['id', 'DESC']],
        where: { code: { [Op.like]: `DJBZ${year}%` } },
      })
      if (temp) {
        const oldNO = temp.code
        const lastFourChars = oldNO.length >= 4 ? oldNO.slice(-4) : '0'.repeat(4 - oldNO.length) + oldNO
        let num = parseInt(lastFourChars)
        num++
        let newNO = num.toString().padStart(4, '0')

        dto.code = 'DJBZ' + year + newNO
      } else {
        dto.code = 'DJBZ' + year + '0001'
      }
    }
    const result = await CheckStandard.create({
      code: dto.code,
      name: dto.name,
      status: dto.status,
      remark: dto.remark,
      createdUserId: user.id,
      updatedUserId: user.id,
    })
    if (dto.details) {
      for (const detail of dto.details) {
        await CheckStandardDetail.create({
          checkStandardId: result.id,
          name: detail.name,
          method: detail.method,
          min: detail.min,
          max: detail.max,
          status: detail.status,
          remark: detail.remark,
        })
      }
    }
    return result
  }

  public async edit(dto: UCheckStandardDto, id: number, user, loadModel) {
    let checkStandard = await CheckStandard.findOne({ where: { id } })
    if (!checkStandard) {
      throw new HttpException('数据不存在', 400006)
    }
    const temp = await CheckStandard.findOne({ where: { name: dto.name, id: { [Op.ne]: id } } })
    if (temp) throw new HttpException('同名称点检标准已存在', 400)
    await CheckStandardDetail.destroy({ where: { checkStandardId: id } })
    await checkStandard.update({
      name: dto.name,
      status: dto.status,
      remark: dto.remark,
      updatedUserId: user.id,
    })
    if (dto.details) {
      for (const detail of dto.details) {
        await CheckStandardDetail.create({
          checkStandardId: id,
          name: detail.name,
          method: detail.method,
          min: detail.min,
          max: detail.max,
          status: detail.status,
          remark: detail.remark,
        })
      }
    }
    checkStandard = await CheckStandard.findOne({ where: { id } })
    return checkStandard
  }

  public async delete(id: number, loadModel) {
    await CheckStandardDetail.destroy({ where: { checkStandardId: id } })
    const result = await CheckStandard.destroy({
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
    const result = await CheckStandard.findOne(options)
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

    if (dto.itemName) {
      options.include[2].where['name'] = {
        [Op.like]: `%${dto.itemName}%`,
      }
    }

    // @ts-ignore
    const result = await Paging.diyPaging(CheckStandard, pagination, options)
    return result
  }
}
