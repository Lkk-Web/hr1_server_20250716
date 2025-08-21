import { Pagination } from '@common/interface'
import { Injectable } from '@nestjs/common'
import { ProcessTask } from '@model/production/processTask.model'
import { FindPaginationDto } from './processTask.dto'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { User } from '@model/auth/user'
import { PerformanceConfig } from '@model/index'
import moment = require('moment')

@Injectable()
export class ProcessTaskService {
  constructor() {}

  public async find(id: number) {
    const options: FindOptions = {
      where: { id },
      include: [
        {
          association: 'order',
          attributes: ['id', 'code', 'plannedOutput', 'startTime', 'endTime', 'actualStartTime', 'actualEndTime'],
          include: [
            {
              association: 'bom',
              attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity', 'formData'],
              where: {},
              include: [
                {
                  association: 'parentMaterial',
                  attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                  where: {},
                },
              ],
            },
          ],
        },
        {
          association: 'process',
          attributes: ['id', 'processName'],
          include: [
            {
              association: 'processItem',
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          association: 'depts',
          attributes: ['id', 'name', 'code'],
        },
        {
          association: 'users',
          attributes: ['id', 'userName'],
        },
      ],
    }
    const result = await ProcessTask.findOne(options)

    const temp = await PerformanceConfig.findOne({
      where: {
        // materialId: result.order.bom.materialId,
        processId: result.processId,
      },
    })
    if (temp) {
      result.setDataValue('performanceConfig', temp)
    }
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, user) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      order: [['id', 'ASC']],
      include: [
        {
          association: 'order',
          attributes: ['id', 'code', 'plannedOutput', 'startTime', 'endTime', 'actualStartTime', 'actualEndTime'],
          where: {},
          include: [
            {
              association: 'bom',
              attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity', 'formData'],
              where: {},
              include: [
                {
                  association: 'parentMaterial',
                  attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                  where: {},
                },
              ],
            },
          ],
        },
        {
          association: 'process',
          attributes: ['id', 'processName'],
          where: {},
          include: [
            {
              association: 'processItem',
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          association: 'depts',
          attributes: ['id', 'name', 'code'],
          where: {},
          required: false,
        },
        {
          association: 'users',
          attributes: ['id', 'userName'],
          where: {},
          required: false,
        },
      ],
    }
    if (dto.orderCode) {
      options.include[0].where['code'] = {
        [Op.like]: `%${dto.orderCode}%`,
      }
    }
    if (dto.materialCode) {
      options.include[0].include[0].include[0].where['code'] = {
        [Op.like]: `%${dto.materialCode}%`,
      }
    }

    if (dto.materialName) {
      options.include[0].include[0].include[0].where['name'] = {
        [Op.like]: `%${dto.materialName}%`,
      }
    }
    if (dto.processName) {
      options.include[1].where['processName'] = {
        [Op.like]: `%${dto.processName}%`,
      }
    }

    if (dto.startTime) {
      options.where['startTime'] = {
        [Op.gte]: moment(dto.startTime).startOf('day').toISOString(),
        [Op.lte]: moment(dto.startTime).endOf('day').toISOString(),
      }
    }

    if (dto.endTime) {
      options.where['endTime'] = {
        [Op.gte]: moment(dto.endTime).startOf('day').toISOString(),
        [Op.lte]: moment(dto.endTime).endOf('day').toISOString(),
      }
    }

    if (dto.status) {
      if (dto.status === '未完成') {
        options.where['status'] = {
          [Op.in]: ['未开始', '执行中'],
        }
      } else {
        options.where['status'] = {
          [Op.eq]: dto.status,
        }
      }
    }

    if (dto.type === 'dept') {
      const user1 = await User.findByPk(user.id)
      console.log(user1.departmentId)
      if (user1.departmentId) {
        options.include[2].where['id'] = {
          [Op.eq]: user1.departmentId,
        }
        options.include[2].required = true
      }
    } else if (dto.type === 'self') {
      // const temp = await ProcessTaskUser.findAll({ where: { userId: user.id } })
      // let arr = []
      // for (const processTaskUser of temp) {
      //   arr.push(processTaskUser.taskId)
      // }
      // options.where['id'] = {
      //   [Op.in]: arr,
      // }
    }

    const result = await ProcessTask.findPagination<ProcessTask>(options)
    for (const datum of result.data) {
      const temp = await PerformanceConfig.findOne({
        where: {
          // materialId: datum.order.bom.materialId,
          processId: datum.dataValues.processId,
        },
      })
      if (temp) {
        datum.setDataValue('performanceConfig', temp)
      }
    }
    const options1: FindPaginationOptions = {
      where: { status: { [Op.in]: ['未开始', '执行中'] } },
      pagination,
      include: [
        {
          association: 'order',
          attributes: ['id', 'code', 'plannedOutput', 'startTime', 'endTime', 'actualStartTime', 'actualEndTime'],
          where: {},
          include: [
            {
              association: 'bom',
              attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity', 'formData'],
              where: {},
              include: [
                {
                  association: 'parentMaterial',
                  attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                  where: {},
                },
              ],
            },
          ],
        },
        {
          association: 'process',
          attributes: ['id', 'processName'],
          where: {},
          required: false,
        },
        {
          association: 'depts',
          attributes: ['id', 'name', 'code'],
          required: false,
          where: {},
        },
        {
          association: 'users',
          attributes: ['id', 'userName'],
          where: {},
          required: false,
        },
      ],
    }
    if (dto.orderCode) {
      options1.include[0].where['code'] = {
        [Op.like]: `%${dto.orderCode}%`,
      }
    }
    if (dto.materialCode) {
      options1.include[0].include[0].include[0].where['code'] = {
        [Op.like]: `%${dto.materialCode}%`,
      }
    }

    if (dto.materialName) {
      options1.include[0].include[0].include[0].where['name'] = {
        [Op.like]: `%${dto.materialName}%`,
      }
    }
    if (dto.processName) {
      options1.include[1].where['processName'] = {
        [Op.like]: `%${dto.processName}%`,
      }
    }

    if (dto.startTime) {
      options1.where['startTime'] = {
        [Op.gte]: moment(dto.startTime).startOf('day').toISOString(),
        [Op.lte]: moment(dto.startTime).endOf('day').toISOString(),
      }
    }

    if (dto.endTime) {
      options1.where['endTime'] = {
        [Op.gte]: moment(dto.endTime).startOf('day').toISOString(),
        [Op.lte]: moment(dto.endTime).endOf('day').toISOString(),
      }
    }

    if (dto.type === 'dept') {
      const user1 = await User.findByPk(user.id)
      console.log(user1.departmentId)
      if (user1.departmentId) {
        options1.include[2].where['id'] = {
          [Op.eq]: user1.departmentId,
        }
        options1.include[2].required = true
      }
    } else if (dto.type === 'self') {
      // const temp = await ProcessTaskUser.findAll({ where: { userId: user.id } })
      // let arr = []
      // for (const processTaskUser of temp) {
      //   arr.push(processTaskUser.dataValues.taskId)
      // }
      // options1.where['id'] = {
      //   [Op.in]: arr,
      // }
    }
    // @ts-ignore
    const notDo = await ProcessTask.findAll(options1)

    const options2: FindPaginationOptions = {
      where: { status: '已结束' },
      pagination,
      include: [
        {
          association: 'order',
          attributes: ['id', 'code', 'plannedOutput', 'startTime', 'endTime', 'actualStartTime', 'actualEndTime'],
          where: {},
          include: [
            {
              association: 'bom',
              attributes: ['id', 'materialId', 'parentId', 'remark', 'version', 'quantity', 'formData'],
              where: {},
              include: [
                {
                  association: 'parentMaterial',
                  attributes: ['id', 'name', 'code', 'spec', 'attr', 'unit', 'status'],
                  where: {},
                },
              ],
            },
          ],
        },
        {
          association: 'process',
          attributes: ['id', 'processName'],
          where: {},
          required: false,
        },
        {
          association: 'depts',
          attributes: ['id', 'name', 'code'],
          where: {},
          required: false,
        },
        {
          association: 'users',
          attributes: ['id', 'userName'],
          where: {},
          required: false,
        },
      ],
    }
    if (dto.orderCode) {
      options2.include[0].where['code'] = {
        [Op.like]: `%${dto.orderCode}%`,
      }
    }
    if (dto.materialCode) {
      options2.include[0].include[0].include[0].where['code'] = {
        [Op.like]: `%${dto.materialCode}%`,
      }
    }

    if (dto.materialName) {
      options2.include[0].include[0].include[0].where['name'] = {
        [Op.like]: `%${dto.materialName}%`,
      }
    }
    if (dto.processName) {
      options2.include[1].where['processName'] = {
        [Op.like]: `%${dto.processName}%`,
      }
    }

    if (dto.startTime) {
      options2.where['startTime'] = {
        [Op.gte]: moment(dto.startTime).startOf('day').toISOString(),
        [Op.lte]: moment(dto.startTime).endOf('day').toISOString(),
      }
    }

    if (dto.endTime) {
      options2.where['endTime'] = {
        [Op.gte]: moment(dto.endTime).startOf('day').toISOString(),
        [Op.lte]: moment(dto.endTime).endOf('day').toISOString(),
      }
    }

    if (dto.type === 'dept') {
      const user1 = await User.findByPk(user.id)
      console.log(user1.departmentId)
      if (user1.departmentId) {
        options2.include[2].where['id'] = {
          [Op.eq]: user1.departmentId,
        }
        options2.include[2].required = true
      }
    } else if (dto.type === 'self') {
      // const temp = await ProcessTaskUser.findAll({ where: { userId: user.id } })
      // let arr = []
      // for (const processTaskUser of temp) {
      //   arr.push(processTaskUser.dataValues.taskId)
      // }
      // options2.where['id'] = {
      //   [Op.in]: arr,
      // }
    }
    // @ts-ignore
    const done = await ProcessTask.findAll(options2)
    result['notDo'] = notDo.length
    result['done'] = done.length
    return result
  }
}
