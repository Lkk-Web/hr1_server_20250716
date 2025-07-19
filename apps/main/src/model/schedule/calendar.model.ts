import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, BelongsToMany } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user.model'
import { Team, ShiftPeriod, CalendarDetail } from '..'
/** 工作日历 */
@Table({ tableName: `schedule_calendar`, freezeTableName: true, timestamps: true, comment: '工作日历' })
export class Calendar extends BaseDate<Calendar> {
  @Column({
    type: DataType.STRING,
    comment: '日历名称',
  })
  declare name: string

  @Column({
    type: DataType.DATE,
    comment: '生效时间',
  })
  declare effectiveDate: Date

  @Column({
    type: DataType.DATE,
    comment: '失效时间',
  })
  declare expireDate: Date

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    comment: '是否按法定节假日排休',
  })
  declare state: boolean

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    comment: '状态（启用/禁用）',
  })
  declare status: boolean

  @HasMany(() => CalendarDetail)
  calendarDetails: CalendarDetail[]
}
