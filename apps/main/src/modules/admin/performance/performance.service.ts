import { HttpException, Injectable } from '@nestjs/common'
import { PerformancePrice, PerformancePriceDetail, Material, Process, PerformancePriceTotal } from '@model/index'
import { Op, Transaction, where } from 'sequelize'
import { Includeable } from 'sequelize/types/model'
import { Aide, getTime } from '@library/utils/aide'
import { Pagination } from '@common/interface'
import { FindPaginationOptions, PaginationResult } from '@model/shared/interface'
import { findProductSpecDto, performanceCreateDto, performanceUpdateDto, FindPaginationDto, FindPaginationTotalDto } from './performance.dto'
import { Sequelize } from 'sequelize-typescript'
import { Paging } from '@library/utils/paging'

@Injectable()
export class PerformanceService {
  constructor(private readonly sequelize: Sequelize) {}

  // 创建绩效工价
  public async create(dto: performanceCreateDto) {
    const transaction = await this.sequelize.transaction()

    try {
      // 检查工序是否存在
      const process = await Process.findByPk(dto.processId)
      if (!process) {
        throw new HttpException('工序不存在！', 400)
      }

      // 创建绩效工价记录
      const performancePrice = await PerformancePrice.create(
        {
          processId: dto.processId,
          productSpec: dto.productSpec,
          price: dto.price,
        },
        { transaction }
      )

      // 创建物料关联记录
      if (dto.materialId && dto.materialId.length > 0) {
        const detailRecords = dto.materialId.map(materialId => ({
          materialId,
          performancePriceId: performancePrice.id,
        }))

        await PerformancePriceDetail.bulkCreate(detailRecords, { transaction })
      }

      await transaction.commit()
      return { message: '创建成功', data: performancePrice }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  // 修改绩效工价
  public async edit(dto: performanceUpdateDto, id: number) {
    const transaction = await this.sequelize.transaction()

    try {
      const performancePrice = await PerformancePrice.findByPk(id)
      if (!performancePrice) {
        throw new HttpException('绩效工价记录不存在！', 400)
      }

      await performancePrice.update(
        {
          productSpec: dto.productSpec,
          processId: dto.processId,
          price: dto.price,
          status: dto.status,
        },
        { transaction }
      )

      if (dto.materialId) {
        await PerformancePriceDetail.destroy({
          where: { performancePriceId: id },
          transaction,
        })

        if (dto.materialId.length > 0) {
          const detailRecords = dto.materialId.map(materialId => ({
            materialId,
            performancePriceId: id,
          }))

          await PerformancePriceDetail.bulkCreate(detailRecords, { transaction })
        }
      }

      await transaction.commit()
      return { message: '修改成功', data: performancePrice }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  // 删除绩效工价
  public async delete(id: number) {
    const transaction = await this.sequelize.transaction()

    try {
      const performancePrice = await PerformancePrice.findByPk(id)
      if (!performancePrice) {
        throw new HttpException('绩效工价记录不存在！', 400)
      }

      // 删除物料关联记录
      await PerformancePriceDetail.destroy({
        where: { performancePriceId: id },
        transaction,
      })

      // 删除绩效工价记录
      await performancePrice.destroy({ transaction })

      await transaction.commit()
      return { message: '删除成功' }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  // 查询详情
  public async find(id: number) {
    const performancePrice = await PerformancePrice.findByPk(id, {
      include: [
        {
          association: 'process',
          attributes: ['id', 'processName'],
        },
        {
          association: 'performancePriceDetails',
          include: [
            {
              association: 'material',
              attributes: ['id', 'materialName'],
            },
          ],
        },
      ],
    })

    if (!performancePrice) {
      throw new HttpException('绩效工价记录不存在！', 400)
    }

    return performancePrice
  }

  public async findTotal(id: number) {
    const performancePriceTotal = await PerformancePriceTotal.findByPk(id, {
      include: [
        {
          association: 'team',
          attributes: ['id', 'name'],
        },
        {
          association: 'updatedUser',
          attributes: ['id', 'userName', 'userCode'],
        },
        {
          association: 'position',
          attributes: ['id', 'name'],
        },
        {
          association: 'material',
          attributes: ['id', 'materialName', 'spec', 'unit'],
        },
        {
          association: 'performancePrice',
          attributes: ['id', 'price'],
          include: [
            {
              association: 'process',
              attributes: ['id', 'processName'],
            },
          ],
        },
      ],
      order: [['id', 'DESC']],
    })

    if (!performancePriceTotal) {
      throw new HttpException('计件统计记录不存在！', 400)
    }

    return performancePriceTotal
  }

  // 分页查询
  public async findPagination(dto: FindPaginationDto, pagination: Pagination) {
    const options: FindPaginationOptions = {
      where: {},
      include: [
        {
          association: 'process',
          attributes: ['id', 'processName'],
        },
        {
          association: 'performanceDetailed',
          include: [
            {
              association: 'material',
              attributes: ['id', 'materialName'],
            },
          ],
        },
      ],
      order: [['id', 'DESC']],
    }
    if (dto.productSpec) {
      options.where['productSpec'] = {
        [Op.eq]: dto.productSpec,
      }
    }
    if (dto.status) {
      options.where['status'] = {
        [Op.eq]: dto.status,
      }
    }

    if (dto.price) {
      options.where['price'] = {
        [Op.eq]: dto.price,
      }
    }

    const result = await Paging.diyPaging(PerformancePrice, pagination, options)
    return result
  }

  // 根据物料名称查询产品规格
  public async findProductSpec(dto: findProductSpecDto) {
    const materialName = await Material.findOne({
      where: {
        materialName: dto.materialName,
      },
    })

    if (!materialName) {
      throw new HttpException('物料名称不存在！', 400)
    }

    const spec = await Material.findAll({
      where: {
        materialName: dto.materialName,
      },
      attributes: ['id', 'spec', 'materialName'],
    })
    return spec
  }

  // 计件统计分页查询
  public async FindPaginationTotal(dto: FindPaginationTotalDto, pagination: Pagination) {
    const options: FindPaginationOptions = {
      where: {},
      include: [
        {
          association: 'team',
          attributes: ['id', 'name'],
        },
        {
          association: 'updatedUser',
          attributes: ['id', 'userName', 'userCode'],
        },
        {
          association: 'position',
          attributes: ['id', 'name'],
        },
        {
          association: 'material',
          attributes: ['id', 'materialName', 'spec', 'unit'],
        },
        {
          association: 'performancePrice',
          attributes: ['id', 'price'],
          include: [
            {
              association: 'process',
              attributes: ['id', 'processName'],
            },
          ],
        },
      ],
      order: [['id', 'DESC']],
    }

    if (dto.teamId) {
      options.where['teamId'] = { [Op.eq]: dto.teamId }
    }
    if (dto.updatedUserId) {
      options.where['updatedUserId'] = { [Op.eq]: dto.updatedUserId }
    }
    if (dto.positionId) {
      options.where['positionId'] = { [Op.eq]: dto.positionId }
    }
    if (dto.materialId) {
      options.where['materialId'] = { [Op.eq]: dto.materialId }
    }
    if (dto.productSpec) {
      options.where['productSpec'] = { [Op.eq]: dto.productSpec }
    }
    if (dto.startTime && dto.endTime) {
      options.where['createdAt'] = { [Op.between]: [dto.startTime, dto.endTime] }
    }

    const result = await Paging.diyPaging(PerformancePriceTotal, pagination, options)
    return result
  }
}
