import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { CEquipmentDTO, FindPaginationDto } from './equipment.dto'
import { Equipment } from '@model/equipment/equipment.model'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'
import { AdjustOrder } from '@model/warehouse/adjustOrder.model'
import { UEquipmentTypeDTO } from '../equipmentType/equipmentType.dto'

@Injectable()
export class EquipmentService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(Equipment)
    private equipmentModel: typeof Equipment,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CEquipmentDTO, user, loadModel) {
    const temp = await Equipment.findOne({ where: { name: dto.name } })
    if (temp) throw new HttpException('同名称设备已存在', 400)
    const result = await Equipment.create({ ...dto, createdUserId: user.id, updatedUserId: user.id })
    return result
  }

  public async edit(dto: UEquipmentTypeDTO, id: number, user, loadModel) {
    let equipment = await Equipment.findOne({ where: { id } })
    if (!equipment) {
      throw new HttpException('数据不存在', 400006)
    }
    const temp = await Equipment.findOne({ where: { name: dto.name, id: { [Op.ne]: id } } })
    if (temp) throw new HttpException('同名称设备已存在', 400)
    await equipment.update({ ...dto, updatedUserId: user.id })
    equipment = await Equipment.findOne({ where: { id } })
    return equipment
  }

  public async delete(id: number, loadModel) {
    const result = await Equipment.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = { where: { id }, include: [{ all: true }] }
    const result = await Equipment.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'equipmentType',
          attributes: ['id', 'name'],
          where: {},
        },
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
      ],
    }
    if (dto.name) {
      options.where['name'] = {
        [Op.like]: `%${dto.name}%`,
      }
    }

    if (dto.equipmentType) {
      options.include[0].where['name'] = {
        [Op.like]: `%${dto.equipmentType}%`,
      }
    }

    if (dto.equipmentTypeId) {
      options.where['equipmentTypeId'] = {
        [Op.eq]: dto.equipmentTypeId,
      }
    }
    const result = await Paging.diyPaging(Equipment, pagination, options)
    return result
  }
}
