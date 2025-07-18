import { Pagination } from '@common/interface'
import { Injectable } from '@nestjs/common'
import { ProductionOrder } from '@model/production/productionOrder.model'
import { FindPaginationDto } from './productionOrder.dto'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { User } from '@model/sys/user.model'
import { PerformanceConfig } from '@model/index'

@Injectable()
export class ProductionOrderService {
  constructor() {}

  public async find(id: number) {
    const options: FindOptions = {
      where: { id },
      include: [
        {
          association: 'bom',
          attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity', 'formData'],
          where: {},
          required: false,
          include: [
            {
              association: 'parentMaterial',
              attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
              required: false,
              include: [
                {
                  association: 'boms',
                  required: false,
                  attributes: ['id', 'code', 'version', 'materialId', 'parentId'],
                  where: { parentId: 0 },
                },
              ],
              where: {},
            },
          ],
        },
        {
          association: 'processes',
          attributes: [
            'id',
            'productionOrderId',
            'processId',
            'reportRatio',
            'reportRatio',
            'isOutsource',
            'sort',
            'planCount',
            'goodCount',
            'badCount',
            'startTime',
            'endTime',
            'actualStartTime',
            'actualEndTime',
            'processTaskId',
          ],
          required: false,
          include: [
            {
              association: 'process',
              attributes: ['id', 'processName'],
              required: false,
            },

            {
              association: 'depts',
              attributes: ['id', 'name'],
              through: {
                attributes: [], // 隐藏中间表的数据
              },
              where: {},
              required: false,
            },
            {
              association: 'items',
              attributes: ['id', 'name'],
              through: {
                attributes: [], // 隐藏中间表的数据
              },
              required: false,
            },
            {
              association: 'file',
              attributes: ['id', 'name', 'versionCode', 'url'],
              where: {},
              required: false,
            },
          ],
        },
        {
          association: 'boms',
          required: false,
          include: [
            {
              association: 'material',
              required: false,
              attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit'],
              where: {},
            },
          ],
          where: {},
        },
      ],
    }
    const result = await ProductionOrder.findOne(options)
    for (const process of result.processes) {
      const temp = await PerformanceConfig.findOne({
        where: {
          materialId: result.bom.materialId,
          processId: process.processId,
        },
      })
      if (temp) {
        process.setDataValue('performanceConfig', temp)
      }
    }

    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, user) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      order: [['processes', 'id', 'ASC']],
      include: [
        {
          association: 'bom',
          attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity', 'formData'],
          where: {},
          required: false,
          include: [
            {
              association: 'parentMaterial',
              attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
              required: false,
              include: [
                {
                  association: 'boms',
                  required: false,
                  attributes: ['id', 'code', 'version', 'materialId', 'parentId'],
                  where: { parentId: 0 },
                },
              ],
              where: {},
            },
          ],
        },
        {
          association: 'processes',
          required: false,
          where: {},
          attributes: [
            'id',
            'productionOrderId',
            'processId',
            'reportRatio',
            'reportRatio',
            'isOutsource',
            'sort',
            'planCount',
            'goodCount',
            'badCount',
            'startTime',
            'endTime',
            'actualStartTime',
            'actualEndTime',
            'processTaskId',
          ],
          include: [
            {
              association: 'process',
              attributes: ['id', 'processName'],
              where: {},
              required: false,
            },
            {
              association: 'depts',
              attributes: ['id', 'name'],
              through: {
                attributes: [], // 隐藏中间表的数据
              },
              required: false,
              where: {},
            },
            {
              association: 'items',
              attributes: ['id', 'name'],
              through: {
                attributes: [], // 隐藏中间表的数据
              },
              required: false,
            },
            {
              association: 'file',
              attributes: ['id', 'name', 'versionCode', 'url'],
              where: {},
              required: false,
            },
          ],
        },
        {
          association: 'boms',
          required: false,
          include: [
            {
              association: 'material',
              required: false,
              attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit'],
              where: {},
            },
          ],
          where: {},
        },
      ],
    }
    if (dto.selectAttr) {
      options.where[Op.or] = [
        { code: { [Op.like]: `%${dto.selectAttr}%` } },
        { '$bom.parentMaterial.name$': { [Op.like]: `%${dto.selectAttr}%` } },
        { '$bom.parentMaterial.code$': { [Op.like]: `%${dto.selectAttr}%` } },
      ]
      options.include[0].required = true
      options.include[0].include[0].required = true
      options.include[0].include[0].include[0].required = true
    }
    if (dto.status) {
      if (dto.status === '未完成') {
        options.where['status'] = {
          [Op.in]: ['未开始', '执行中'],
        }
      } else {
        options.where['status'] = dto.status
      }
    }

    if (dto.isDept) {
      const user1 = await User.findByPk(user.id)
      if (user1.departmentId) {
        options.include[1].include[1].where['id'] = {
          [Op.eq]: user1.departmentId,
        }
      }
    }

    if (dto.category) {
      options.include[0].include[0].where['category'] = {
        [Op.eq]: dto.category,
      }
    }

    const result = await ProductionOrder.findPagination<ProductionOrder>(options)
    for (const datum of result.data) {
      for (const process of datum.processes) {
        const temp = await PerformanceConfig.findOne({
          where: {
            materialId: datum.bom.materialId,
            processId: process.processId,
          },
        })
        if (temp) {
          process.setDataValue('performanceConfig', temp)
        }
      }
    }
    const options1: FindPaginationOptions = {
      where: { status: { [Op.in]: ['未开始', '执行中'] } },
      include: [
        {
          association: 'bom',
          attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity', 'formData'],
          where: {},
          required: false,
          include: [
            {
              association: 'parentMaterial',
              attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status', 'category'],
              where: {},
              required: false,
            },
          ],
        },
        {
          association: 'processes',
          required: false,
          include: [
            {
              association: 'depts',
              attributes: ['id', 'name'],
              through: {
                attributes: [], // 隐藏中间表的数据
              },
              where: {},
            },
          ],
        },
      ],
    }
    if (dto.selectAttr) {
      options1.where[Op.or] = [
        { code: { [Op.like]: `%${dto.selectAttr}%` } },
        { '$bom.parentMaterial.name$': { [Op.like]: `%${dto.selectAttr}%` } },
        { '$bom.parentMaterial.code$': { [Op.like]: `%${dto.selectAttr}%` } },
      ]
    }

    if (dto.isDept) {
      const user1 = await User.findByPk(user.id)
      if (user1.departmentId) {
        options1.include[1].include[0].where['id'] = {
          [Op.eq]: user1.departmentId,
        }
      }
    }

    if (dto.category) {
      options1.include[0].include[0].where['category'] = {
        [Op.eq]: dto.category,
      }
    }
    //未完成数量
    const notDo = await ProductionOrder.findAll(options1)

    const options2: FindPaginationOptions = {
      where: { status: '已结束' },
      include: [
        {
          association: 'bom',
          attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity', 'formData'],
          where: {},
          required: false,
          include: [
            {
              association: 'parentMaterial',
              attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status', 'category'],
              where: {},
              required: false,
            },
          ],
        },
        {
          association: 'processes',
          include: [
            {
              association: 'depts',
              attributes: ['id', 'name'],
              through: {
                attributes: [], // 隐藏中间表的数据
              },
              where: {},
            },
          ],
          required: false,
        },
      ],
    }
    if (dto.selectAttr) {
      options2.where[Op.or] = [
        { code: { [Op.like]: `%${dto.selectAttr}%` } },
        { '$bom.parentMaterial.name$': { [Op.like]: `%${dto.selectAttr}%` } },
        { '$bom.parentMaterial.code$': { [Op.like]: `%${dto.selectAttr}%` } },
      ]
    }

    if (dto.isDept) {
      const user1 = await User.findByPk(user.id)
      if (user1.departmentId) {
        options2.include[1].include[0].where['id'] = {
          [Op.eq]: user1.departmentId,
        }
      }
    }

    if (dto.category) {
      options2.include[0].include[0].where['category'] = {
        [Op.eq]: dto.category,
      }
    }
    //已完成数量
    const done = await ProductionOrder.findAll(options2)
    result['notDo'] = notDo.length
    result['done'] = done.length
    return result
  }
}
