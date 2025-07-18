import { Redis } from 'ioredis'
import { Pagination } from '@common/interface'
import { RedisProvider } from '@library/redis'
import { InjectModel } from '@nestjs/sequelize'
import { BadRequestException, HttpException, Inject, Injectable } from '@nestjs/common'
import _ = require('lodash')
import { Calendar } from '@model/sm/calendar.model'
import { CalendarDetailDto, CCalendarDto, DetailList, FindPaginationDto, UCalendarDto } from './calendar.dto'
import { Sequelize } from 'sequelize-typescript'
import { FindOptions, Op } from 'sequelize'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'
import { Shift } from '@model/sm/shift.model'
import { CalendarDetail, PlanShiftTeam } from '@model/index'
import { goToWork, redLetter } from '@library/utils/redLetter'
import dayjs = require('dayjs')

@Injectable()
export class CalendarService {
  constructor(
    @Inject(RedisProvider.local)
    private readonly redis: Redis,

    @InjectModel(Calendar)
    private calendarModel: typeof Calendar,
    private sequelize: Sequelize
  ) { }

  public async create(dto: CCalendarDto, loadModel) {
    const temp = await Calendar.findOne({ where: { name: dto.name } })
    if (temp) throw new HttpException('已存在相同名称排班日历', 400)
    let details = dto.calendarDetails
    delete dto.calendarDetails
    const result = await this.calendarModel.create(dto)
    if (details) {
      for (const detail of details) {
        await CalendarDetail.create({ dayDate: detail.dayDate, state: detail.state, scId: result.dataValues.id })
      }
    }
    return result
  }

  public async edit(dto: UCalendarDto, id: number) {
    let calendar = await this.find(id)
    if (!calendar) {
      throw new HttpException('数据不存在', 400006)
    }
    const temp = await Calendar.findOne({ where: { name: dto.name, id: { [Op.ne]: id } } })
    if (temp) throw new HttpException('已存在相同名称排班计划', 400)
    let details = dto.calendarDetails
    delete dto.calendarDetails
    await calendar.update(dto)
    await CalendarDetail.destroy({ where: { scId: id } })
    if (details) {
      for (const detail of details) {
        await CalendarDetail.create({ dayDate: detail.dayDate, state: detail.state, scId: id })
      }
    }
    calendar = await Calendar.findOne({ where: { id } })
    return calendar
  }

  public async delete(id: number, loadModel) {
    let calendar = await this.find(id)
    if (!calendar) {
      throw new HttpException('数据不存在', 400006)
    }
    await CalendarDetail.destroy({ where: { scId: id } })
    const result = await Calendar.destroy({
      where: {
        id: id,
      },
    })
    return result
  }

  public async find(id: number) {
    const options: FindOptions = {
      where: { id },
      include: [
        {
          association: 'calendarDetails',
          attributes: ['id', 'dayDate', 'state', 'scId']
        }
      ]
    }
    const result = await Calendar.findOne(options)
    return result
  }

  public async findPagination(dto: FindPaginationDto, pagination: Pagination, loadModel) {
    const options: FindPaginationOptions = {
      where: {},
      pagination,
      include: [
        {
          association: 'calendarDetails',
          attributes: ['id', 'dayDate', 'state', 'scId']
        }
      ]
    }
    if (dto.name) {
      options.where['name'] = {
        [Op.like]: `%${dto.name}%`,
      }
    }
    if (dto.status) {
      options.where['status'] = dto.status
    }
    const result = await Paging.diyPaging(Calendar, pagination, options)
    return result
  }
  /** 生成日历明细*/
  async getWorkSchedule(dto: CalendarDetailDto) {
    let holidays = redLetter
    let specialWorkDays = goToWork
    const start = dayjs(dto.effectiveDate);
    const end = dayjs(dto.expireDate);
    const holidayDates = holidays.map(holiday => dayjs(holiday));
    const specialWorkDates = specialWorkDays.map(day => dayjs(day));
    const workSchedule = [];
    let currentDate = start;
    while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
      const dayOfWeek = currentDate.day();
      let isWorkingDay = false;
      if (dto.state == '是') {
        const isHoliday = holidayDates.some(holiday => holiday.isSame(currentDate, 'day'));
        const isSpecialWorkDay = specialWorkDates.some(day => day.isSame(currentDate, 'day'));
        isWorkingDay = (dto.workDays.includes(dayOfWeek.toString()) && !isHoliday) || isSpecialWorkDay;
      } else {
        isWorkingDay = dto.workDays.includes(dayOfWeek.toString());
      }
      workSchedule.push({
        dayDate: currentDate.add(8, 'hour').format('YYYY-MM-DD'),
        state: isWorkingDay,
      });
      currentDate = currentDate.add(1, 'day');
    }
    return workSchedule;
  }
}
