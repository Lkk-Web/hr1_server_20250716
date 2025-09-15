import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { HttpException, Inject, Injectable } from '@nestjs/common'
import { Pallet } from '@model/base/pallet.model'
import { PalletDetail } from '@model/base/palletDetail.model'
import { CPalletDto, FindPaginationDto, UPalletDto } from './pallet.dto'
import { FindOptions, Op, Sequelize } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { deleteIdsDto } from '@common/dto'
import { Paging } from '@library/utils/paging'
import { Team } from '@model/auth/team'

@Injectable()
export class PalletService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(Pallet)
    private palletModel: typeof Pallet,

    @InjectModel(PalletDetail)
    private palletDetailModel: typeof PalletDetail
  ) {}

  public async create(dto: CPalletDto, loadModel) {
    const { pallet_code, teamId } = dto

    // 检查班组是否存在
    if (teamId) {
      const team = await Team.findOne({ where: { id: teamId } })
      if (!team) {
        throw new HttpException('班组不存在', 400)
      }
    }

    // 检查是否存在相同编号的托盘
    const existingPallet = await Pallet.findOne({
      where: { pallet_code },
    })
    if (existingPallet) {
      throw new HttpException('已存在相同编号的托盘', 400)
    }

    const sequelize = Pallet.sequelize
    return sequelize.transaction(async transaction => {
      // 创建托盘
      const pallet = await Pallet.create(
        {
          pallet_code: dto.pallet_code,
          pallet_spec: dto.pallet_spec,
          status: true,
        },
        { transaction }
      )

      // 如果指定了班组，创建托盘明细记录
      if (teamId) {
        await PalletDetail.create(
          {
            palletId: pallet.id,
            teamId: teamId,
          },
          { transaction }
        )
      }

      return pallet
    })
  }

  public async edit(dto: UPalletDto, id: number, loadModel) {
    const pallet = await Pallet.findOne({ where: { id } })
    if (!pallet) {
      throw new HttpException('托盘数据不存在', 400006)
    }

    // 如果要修改班组，检查班组是否存在
    if (dto.teamId !== undefined) {
      if (dto.teamId) {
        const team = await Team.findOne({ where: { id: dto.teamId } })
        if (!team) {
          throw new HttpException('班组不存在', 400)
        }
      }
    }

    // 如果要修改托盘编号，检查是否重复
    if (dto.pallet_code && dto.pallet_code !== pallet.pallet_code) {
      const existingPallet = await Pallet.findOne({
        where: {
          pallet_code: dto.pallet_code,
          id: { [Op.ne]: id },
        },
      })
      if (existingPallet) {
        throw new HttpException('已存在相同编号的托盘', 400)
      }
    }

    const sequelize = Pallet.sequelize
    return sequelize.transaction(async transaction => {
      // 更新托盘基本信息
      await pallet.update(
        {
          pallet_code: dto.pallet_code || pallet.pallet_code,
          pallet_spec: dto.pallet_spec || pallet.pallet_spec,
          status: dto.status !== undefined ? dto.status : pallet.status,
        },
        { transaction }
      )

      // 如果指定了班组变更
      if (dto.teamId !== undefined) {
        // 先删除原有的托盘明细记录
        await PalletDetail.destroy({
          where: { palletId: id },
          transaction,
        })

        // 如果新班组不为空，创建新的托盘明细记录
        if (dto.teamId) {
          await PalletDetail.create(
            {
              palletId: id,
              teamId: dto.teamId,
            },
            { transaction }
          )
        }
      }

      // 返回更新后的托盘信息，包含关联的班组信息
      const updatedPallet = await Pallet.findOne({
        where: { id },
        include: [
          {
            association: 'palletDetail',
            include: [
              {
                model: Team,
                as: 'team',
                attributes: ['id', 'name'],
                required: false,
              },
            ],
            required: false,
          },
        ],
        transaction,
      })

      return updatedPallet
    })
  }

  public async delete(id: number, loadModel) {
    const pallet = await Pallet.findOne({ where: { id } })
    if (!pallet) {
      throw new HttpException('托盘数据不存在', 400)
    }

    const sequelize = Pallet.sequelize
    return sequelize.transaction(async transaction => {
      // 先删除托盘明细记录
      await PalletDetail.destroy({
        where: { palletId: id },
        transaction,
      })

      // 再删除托盘主记录
      const result = await Pallet.destroy({
        where: { id },
        transaction,
      })

      return result
    })
  }

  public async find(id: number, loadModel) {
    const options: FindOptions = {
      where: { id },
      include: [
        {
          association: 'palletDetail',
          include: [
            {
              model: Team,
              as: 'team',
              attributes: ['id', 'name'],
              required: false,
            },
          ],
          required: false,
        },
      ],
    }

    const result = await Pallet.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'palletDetail',
          include: [
            {
              association: 'team',
              attributes: ['id', 'name'],
              required: false,
            },
          ],
          required: false,
        },
      ],
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
    }

    // 托盘编号模糊查询
    if (dto.pallet_code) {
      options.where['pallet_code'] = {
        [Op.like]: `%${dto.pallet_code}%`,
      }
    }

    // 托盘规格模糊查询
    if (dto.pallet_spec) {
      options.where['pallet_spec'] = {
        [Op.like]: `%${dto.pallet_spec}%`,
      }
    }

    // 状态筛选
    if (dto.status) {
      options.where['status'] = dto.status
    }

    // 班组筛选 - 通过PalletDetail关联查询
    if (dto.teamId) {
      options.include[0]['where'] = { teamId: dto.teamId }
      options.include[0].required = true
    }

    const result = await Paging.diyPaging(Pallet, pagination, options)
    return result
  }

  public async batDelete(dto: deleteIdsDto, loadModel) {
    let success = 0
    let failed = 0
    let errors: Array<string> = []

    const sequelize = Pallet.sequelize
    return sequelize.transaction(async transaction => {
      for (const id of dto.ids) {
        try {
          const pallet = await Pallet.findOne({ where: { id }, transaction })
          if (!pallet) {
            errors.push(`托盘 ID ${id} 不存在`)
            failed++
            continue
          }

          // 先删除托盘明细记录
          await PalletDetail.destroy({
            where: { palletId: id },
            transaction,
          })

          // 再删除托盘主记录
          const deleteNum = await Pallet.destroy({
            where: { id },
            transaction,
          })

          if (deleteNum) {
            success++
          } else {
            failed++
          }
        } catch (e) {
          errors.push(`删除托盘 ID ${id} 时出错: ${e.message}`)
          failed++
        }
      }
      return { success, failed, errors }
    })
  }
}
