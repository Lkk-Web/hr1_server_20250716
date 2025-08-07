import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { CTeamDto, FindPaginationDto, UTeamDto } from './team.dto'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Team, TeamEquipmentLedger, TeamProcess, TeamUser } from '@model/index'
import { Paging } from '@library/utils/paging'

@Injectable()
export class TeamService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(Team)
    private teamModel: typeof Team,
    private sequelize: Sequelize
  ) {}

  public async create(dto: CTeamDto, loadModel) {
    const temp = await Team.findOne({ where: { name: dto.name, type: dto.type }, attributes: ['id'] })
    if (temp) throw new HttpException('已存在同名班组', 400)
    const result = await Team.create(dto)
    if (dto.userIds?.length) {
      await TeamUser.bulkCreate(dto.userIds.map(userId => ({ teamId: result.id, userId })))
    }
    if (dto.equipmentLedgerIds?.length) {
      await TeamEquipmentLedger.bulkCreate(dto.equipmentLedgerIds.map(equipmentLedgerId => ({ teamId: result.id, equipmentLedgerId })))
    }
    if (dto.processIds?.length) {
      await TeamProcess.bulkCreate(dto.processIds.map(processId => ({ teamId: result.id, processId })))
    }
    return result
  }

  public async edit(dto: UTeamDto, id: number, loadModel) {
    let team = await Team.findOne({ where: { id } })
    if (!team) {
      throw new HttpException('数据不存在', 400006)
    }
    if (dto.name && dto.name != team.name) {
      const temp = await Team.findOne({ where: { name: dto.name, type: team.type, id: { [Op.not]: id } }, attributes: ['id'] })
      if (temp) throw new HttpException('已存在同名班组', 400)
    }
    await team.update(dto)
    //去除依赖关系
    //创建新的班组员工关系
    if (dto.userIds) {
      await TeamUser.destroy({ where: { teamId: id } })
      await TeamUser.bulkCreate(dto.userIds.map(userId => ({ teamId: team.id, userId })))
    }
    // if (dto.equipmentLedgerIds) {
    //   await TeamEquipmentLedger.destroy({ where: { teamId: id } })
    //   await TeamEquipmentLedger.bulkCreate(dto.equipmentLedgerIds.map(equipmentLedgerId => ({ teamId: team.id, equipmentLedgerId })))
    // }
    if (dto.processIds) {
      await TeamProcess.destroy({ where: { teamId: id } })
      await TeamProcess.bulkCreate(dto.processIds.map(processId => ({ teamId: team.id, processId })))
    }
    team = await Team.findOne({ where: { id } })
    return team
  }

  public async delete(id: number, loadModel) {
    const result = await Team.destroy({
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
          association: 'charge', //负责人
          attributes: ['id', 'userName'],
        },
        {
          association: 'workShop', //车间
          attributes: ['id', 'name'],
        },
        {
          association: 'users',
          attributes: ['id', 'userName', 'userCode', 'phone', 'status'],
          through: { attributes: [] },
        },
      ],
    }
    let result = await Team.findOne(options)
    if (result) {
      result = result.toJSON()
      const [process] = await Promise.all([
        // TeamEquipmentLedger.findAll({
        //   where: { teamId: id },
        //   attributes: ['id'],
        //   include: [{ association: 'equipmentLedger', attributes: ['id', 'code', 'status'], include: [{ association: 'equipment', attributes: ['name'] }] }],
        // }),
        TeamProcess.findAll({
          where: { teamId: id },
          attributes: ['id'],
          include: [{ association: 'process', attributes: ['id', 'processName'] }],
        }),
      ])
      // result.equipmentLedgers = equipmentLedgers.map(item => item.equipmentLedger)
      result.process = process.map(item => item.process)
    }
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'charge', //负责人
          attributes: ['id', 'userName'],
          where: {},
          required: false,
        },
        {
          association: 'workShop', //车间
          attributes: ['id', 'name'],
          where: {},
          required: false,
        },
        {
          association: 'users',
          attributes: ['id', 'userName', 'userCode', 'phone', 'status'],
          through: { attributes: [] },
          required: false,
        },
      ],
    }
    if (dto.name) {
      options.where['name'] = {
        [Op.like]: `%${dto.name}%`,
      }
    }

    if (dto.chargeName) {
      options.include[1].where['userName'] = {
        [Op.like]: `%${dto.chargeName}%`,
      }
    }
    if (dto.workShopName) {
      options.include[2].where['name'] = {
        [Op.like]: `%${dto.workShopName}%`,
      }
    }
    if (dto.type) {
      options.where['type'] = dto.type
    }
    if (dto.isOut != null) {
      options.where['isOut'] = dto.isOut
    }
    // @ts-ignore
    const result = await Paging.diyPaging(Team, pagination, options)
    return result
  }
}
