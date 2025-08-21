import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { CreateProductPositionDto, FindPaginationDto, UpdateProductPositionDto } from './productPosition.dto'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Position, PositionDetail, Team, TeamEquipmentLedger, TeamProcess, TeamUser } from '@model/index'
import { Paging } from '@library/utils/paging'

@Injectable()
export class ProductPositionService {
  constructor(
    @InjectModel(Position)
    private positionModel: typeof Position,

    @InjectModel(PositionDetail)
    private positionDetailModel: typeof PositionDetail,

    private sequelize: Sequelize
  ) {}

  public async create(dto: CreateProductPositionDto) {
    // if (dto.name) {
    //   const result = await this.positionModel.findOne({
    //     where: {
    //       name: dto.name,
    //     },
    //   })
    //   if (result) {
    //     throw new HttpException('工位名称已存在', HttpStatus.BAD_REQUEST)
    //   }
    // }
    const result = await this.positionModel.create({
      name: dto.name,
      processId: dto.processId,
      teamId: dto.teamId,
      status: dto.status,
    })
    const positionDetail = dto.userIds.map(item => ({
      positionId: result.id,
      userId: item,
    }))
    await this.positionDetailModel.bulkCreate(positionDetail)
    return result
  }

  public async delete(id: number) {
    await this.positionDetailModel.destroy({ where: { positionId: id } })
    await this.positionModel.destroy({ where: { id } })
    return true
  }

  public async edit(dto: UpdateProductPositionDto, id: number) {
    const result = await this.positionModel.update(
      {
        name: dto.name,
        processId: dto.processId,
        teamId: dto.teamId,
        status: dto.status,
      },
      { where: { id } }
    )
    if (dto.userIds.length > 0) {
      await this.positionDetailModel.destroy({ where: { positionId: id } })
      const positionDetail = dto.userIds.map(item => ({
        positionId: id,
        userId: item,
      }))
      await this.positionDetailModel.bulkCreate(positionDetail)
    }
    return result
  }

  public async find(id: number) {
    const options: FindOptions = {
      where: { id },
      include: [
        {
          association: 'process', //子工序
          attributes: ['id', 'processName'],
        },
        {
          association: 'team', //班组
          attributes: ['id', 'name'],
        },
        {
          association: 'positionDetail', //人员
          attributes: ['id', 'userId'],
          include: [
            {
              association: 'user',
              attributes: ['id', 'userName'],
            },
          ],
        },
      ],
    }
    return await Position.findOne(options)
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination) {
    const options: FindOptions = {
      where: {},
      include: [
        {
          association: 'process', //子工序
          attributes: ['id', 'processName'],
          where: {},
        },
        {
          association: 'team', //班组
          attributes: ['id', 'name'],
          where: {},
        },
        {
          association: 'positionDetail', //人员
          attributes: ['id', 'userId'],
          include: [
            {
              association: 'user',
              attributes: ['id', 'userName'],
            },
          ],
          where: {},
        },
      ],
    }
    if (dto.name) {
      options.where['name'] = {
        [Op.eq]: dto.name,
      }
    }

    if (dto.processId) {
      options.include[0].where['id'] = {
        [Op.eq]: dto.processId,
      }
    }

    if (dto.teamId) {
      options.include[1].where['id'] = {
        [Op.eq]: dto.teamId,
      }
    }

    const result = await Paging.diyPaging(Position, pagination, options)
    return result
  }
}
