import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { CEquipmentTypeDTO, FindPaginationDto, UEquipmentTypeDTO } from './equipmentType.dto'
import { EquipmentType } from '@model/equipment/equipmentType.model'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'
import { AdjustOrder } from '@model/warehouse/adjustOrder.model'

@Injectable()
export class EquipmentTypeService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(EquipmentType)
    private equipmentTypeModel: typeof EquipmentType,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CEquipmentTypeDTO, user, loadModel) {
    const temp = await EquipmentType.findOne({ where: { name: dto.name } })
    if (temp) throw new HttpException('已存在相同名称的设备类型', 400)
    const result = await EquipmentType.create({ ...dto, createdUserId: user.id, updatedUserId: user.id })
    return result
  }

  public async edit(dto: UEquipmentTypeDTO, id: number, user, loadModel) {
    let equipmentType = await EquipmentType.findOne({ where: { id } })
    if (!equipmentType) {
      throw new HttpException('数据不存在', 400006)
    }
    const temp = await EquipmentType.findOne({ where: { name: dto.name, id: { [Op.ne]: id } } })
    if (temp) throw new HttpException('已存在相同名称的设备类型', 400)
    await equipmentType.update({ ...dto, updatedUserId: user.id })
    equipmentType = await EquipmentType.findOne({ where: { id } })
    return equipmentType
  }

  public async delete(id: number, loadModel) {
    const result = await EquipmentType.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = { where: { id }, include: [{ all: true }] }
    const result = await EquipmentType.findOne(options)
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
      ],
    }
    if (dto.name) {
      options.where['name'] = {
        [Op.like]: `%${dto.name}%`,
      }
    }
    const result = await Paging.diyPaging(EquipmentType, pagination, options)
    return result
  }
}
