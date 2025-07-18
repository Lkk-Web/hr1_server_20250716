import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { CInstallLocationDTO, FindPaginationDto, UInstallLocationDTO } from './installLocation.dto'
import { InstallLocation } from '@model/equipment/installLocation.model'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'
import { FileList } from '@model/document/FileList.model'

@Injectable()
export class InstallLocationService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(InstallLocation)
    private installLocationModel: typeof InstallLocation,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CInstallLocationDTO, user, loadModel) {
    const temp = await InstallLocation.findOne({ where: { locate: dto.locate } })
    if (temp) throw new HttpException('已存在相同安装地点', 400)
    const result = await InstallLocation.create({ ...dto, createdUserId: user.id, updatedUserId: user.id })
    return result
  }

  public async edit(dto: UInstallLocationDTO, id: number, user, loadModel) {
    let installLocation = await InstallLocation.findOne({ where: { id } })
    if (!installLocation) {
      throw new HttpException('数据不存在', 400006)
    }
    const temp = await InstallLocation.findOne({ where: { locate: dto.locate, id: { [Op.ne]: id } } })
    if (temp) throw new HttpException('已存在相同安装地点', 400)
    await installLocation.update({ ...dto, updatedUserId: user.id })
    installLocation = await InstallLocation.findOne({ where: { id } })
    return installLocation
  }

  public async delete(id: number, loadModel) {
    const result = await InstallLocation.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = { where: { id }, include: [{ all: true }] }
    const result = await InstallLocation.findOne(options)
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
    if (dto.locate) {
      options.where['locate'] = {
        [Op.like]: `%${dto.locate}%`,
      }
    }

    const result = await Paging.diyPaging(InstallLocation, pagination, options)
    return result
  }
}
