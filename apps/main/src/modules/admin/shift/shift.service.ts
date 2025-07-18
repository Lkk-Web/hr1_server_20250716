import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { Shift } from '@model/schedule/shift.model'
import { CShiftDto, FindPaginationDto, UShiftDto } from './shift.dto'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { ShiftPeriod } from '@model/schedule/shiftPeriod.model'
import { Paging } from '@library/utils/paging'

@Injectable()
export class ShiftService {
  constructor(
    @InjectModel(Shift)
    private shiftModel: typeof Shift,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CShiftDto, loadModel) {
    const temp = await Shift.findOne({ where: { name: dto.name } })
    if (temp) throw new HttpException('已存在相同名称的班次', 400)

    const result = await Shift.create({
      name: dto.name,
      shortName: dto.shortName,
      color: dto.color,
      status: dto.status,
      remark: dto.remark,
    })
    if (dto.periods) {
      for (const period of dto.periods) {
        await ShiftPeriod.create({ shiftId: result.dataValues.id, ...period })
      }
    }
    return result
  }

  public async edit(dto: UShiftDto, id: number, loadModel) {
    let shift = await Shift.findOne({ where: { id } })
    if (!shift) {
      throw new HttpException('数据不存在', 400006)
    }
    const temp = await Shift.findOne({ where: { name: dto.name, id: { [Op.ne]: id } } })
    if (temp) throw new HttpException('已存在相同名称的班次', 400)

    await ShiftPeriod.destroy({ where: { shiftId: id } })
    await shift.update({
      name: dto.name,
      shortName: dto.shortName,
      color: dto.color,
      status: dto.status,
      remark: dto.remark,
    })
    if (dto.periods) {
      for (const period of dto.periods) {
        await ShiftPeriod.create({ shiftId: id, ...period })
      }
    }
    shift = await Shift.findOne({ where: { id } })
    return shift
  }

  public async delete(id: number, loadModel) {
    const result = await Shift.destroy({
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
          association: 'periods',
          attributes: ['id', 'shiftId', 'startTime', 'endTime', 'workHours'],
        },
      ],
      order: [['periods', 'id', 'ASC']],
    }
    const result = await Shift.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'periods',
          attributes: ['id', 'shiftId', 'startTime', 'endTime', 'workHours'],
        },
      ],
      order: [['periods', 'id', 'ASC']],
    }
    if (dto.name) {
      options.where['name'] = {
        [Op.like]: `%${dto.name}%`,
      }
    }

    if (dto.shortName) {
      options.where['shortName'] = {
        [Op.like]: `%${dto.shortName}%`,
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
    const result = await Paging.diyPaging(Shift, pagination, options)
    return result
  }
}
