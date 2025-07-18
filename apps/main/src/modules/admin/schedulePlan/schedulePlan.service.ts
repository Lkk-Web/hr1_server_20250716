import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { BadRequestException, HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { SchedulePlan } from '@model/sm/schedulePlan.model'
import { CSchedulePlanDto, FindPaginationDto, USchedulePlanDto } from './schedulePlan.dto'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { SchedulePlanShift } from '@model/sm/schedulePlanShift.model'
import { Paging } from '@library/utils/paging'
import { Shift } from '@model/sm/shift.model'
import { PlanShiftTeam } from '@model/index'

@Injectable()
export class SchedulePlanService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(SchedulePlan)
    private schedulePlanModel: typeof SchedulePlan,
    private sequelize: Sequelize
  ) { }

  public async create(dto: CSchedulePlanDto, loadModel) {
    const temp = await SchedulePlan.findOne({ where: { name: dto.name } })
    if (temp) throw new HttpException('已存在相同名称排班计划', 400)
    const result = await SchedulePlan.create(dto)
    if (dto.shiftLists) {
      for (const shift of dto.shiftLists) {
        let sps = await SchedulePlanShift.create({ planId: result.dataValues.id, shiftId: shift.shiftId })
        for (const team of shift.TeamList) {
          await PlanShiftTeam.create({ planShiftId: sps.dataValues.id, teamId: team.teamId })
        }
      }
    }
    return result
  }

  public async edit(dto: USchedulePlanDto, id: number, loadModel) {
    let schedulePlan = await this.find(id, loadModel)
    if (!schedulePlan) {
      throw new HttpException('数据不存在', 400006)
    }
    const temp = await SchedulePlan.findOne({ where: { name: dto.name, id: { [Op.ne]: id } } })
    if (temp) throw new HttpException('已存在相同名称排班计划', 400)
    await schedulePlan.update(dto)
    for (let sps of schedulePlan.spsList) {
      await PlanShiftTeam.destroy({ where: { planShiftId: sps.id } })
    }
    await SchedulePlanShift.destroy({ where: { planId: id } })
    if (dto.shiftLists) {
      for (const shift of dto.shiftLists) {
        let sps = await SchedulePlanShift.create({ planId: id, shiftId: shift.shiftId })
        for (const team of shift.TeamList) {
          await PlanShiftTeam.create({ planShiftId: sps.dataValues.id, teamId: team.teamId })
        }
      }
    }
    schedulePlan = await SchedulePlan.findOne({ where: { id } })
    return schedulePlan
  }

  public async delete(id: number, loadModel) {
    let schedulePlan = await this.find(id, loadModel)
    if (!schedulePlan) {
      throw new HttpException('数据不存在', 400006)
    }
    for (let sps of schedulePlan.spsList) {
      await PlanShiftTeam.destroy({ where: { planShiftId: sps.id } })
    }
    await SchedulePlanShift.destroy({ where: { planId: id } })
    const result = await SchedulePlan.destroy({
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
          association: 'spsList',
          attributes: ['id', 'planId', 'shiftId'],
          include: [
            {
              association: 'shift',
              attributes: ['id', 'name', 'shortName', 'color', 'remark'],
              include: [{
                association: 'periods',
                attributes: ['id', 'startTime', 'endTime', 'workHours'],
              }]
            }, {
              association: 'teams',
              attributes: ['id', 'name', 'remark'],
              include: [
                {
                  association: 'users',
                  attributes: ['id', 'userName', 'userCode', 'phone'],
                },
              ],
            }
          ]
        }, {
          association: 'calendar',
          attributes: ['id', 'name'],
        }
      ],
    }
    const result = await SchedulePlan.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'spsList',
          attributes: ['id', 'planId', 'shiftId'],
          include: [
            {
              association: 'shift',
              attributes: ['id', 'name', 'shortName', 'color', 'remark'],
              include: [{
                association: 'periods',
                attributes: ['id', 'startTime', 'endTime', 'workHours'],
              }]
            }, {
              association: 'teams',
              attributes: ['id', 'name', 'remark'],
              include: [
                {
                  association: 'users',
                  attributes: ['id', 'userName', 'userCode', 'phone'],
                },
              ],
            }
          ]
        }, {
          association: 'calendar',
          attributes: ['id', 'name'],
        }
      ],
    }
    if (dto.name) {
      options.where['name'] = {
        [Op.like]: `%${dto.name}%`,
      }
    }
    if (dto.shiftType) {
      options.where['shiftType'] = dto.shiftType
    }
    if (dto.changeType) {
      options.where['changeType'] = dto.changeType
    }
    if (dto.status) {
      options.where['status'] = dto.status
    }
    const result = await Paging.diyPaging(SchedulePlan, pagination, options)
    return result
  }

  // async generateSchedule(planId: number): Promise<any> {
  //   // 获取排班计划
  //   const schedulePlan = await this.schedulePlanModel.findByPk(planId, {
  //     include: [Shift],
  //   });

  //   if (!schedulePlan) {
  //     throw new BadRequestException('未找到对应的排班计划');
  //   }

  //   const { startTime, endTime, shifts, shiftType, changeType } = schedulePlan;

  //   if (!shifts || shifts.length === 0) {
  //     throw new BadRequestException('排班计划未设置任何班次');
  //   }

  //   // 时间范围
  //   const startDate = new Date(startTime);
  //   const endDate = new Date(endTime);

  //   if (startDate > endDate) {
  //     throw new BadRequestException('开始时间不能晚于结束时间');
  //   }

  //   const scheduleResult = [];
  //   let currentDate = startDate;
  //   let shiftIndex = 0;

  //   while (currentDate <= endDate) {
  //     // 获取当前班次
  //     const currentShift = shifts[shiftIndex];

  //     // 生成当前日期的排班数据
  //     scheduleResult.push({
  //       date: currentDate.toISOString().split('T')[0],
  //       shiftName: currentShift.name,
  //       shiftColor: currentShift.color,
  //       shiftTime: `${currentShift.periods[0].startTime}~${currentShift.periods[0].endTime}`,
  //     });

  //     // 更新班次索引
  //     if (shiftType === '两班制' || shiftType === '三班制') {
  //       shiftIndex = (shiftIndex + 1) % shifts.length;
  //     }

  //     // 根据倒班方式调整日期
  //     currentDate.setDate(
  //       currentDate.getDate() + (changeType === '按周' ? 7 : 1),
  //     );
  //   }
  //   return scheduleResult;
  // }
}
