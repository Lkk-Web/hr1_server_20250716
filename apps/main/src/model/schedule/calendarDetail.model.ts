import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, BelongsToMany } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Calendar } from '..'
/** 日历明细 */
@Table({ tableName: `schedule_calendar_detail`, freezeTableName: true, timestamps: false, comment: '日历明细' })
export class CalendarDetail extends BaseDate<CalendarDetail> {
  @Column({
    type: DataType.DATE,
    comment: '日期',
  })
  declare dayDate: Date

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    comment: '是否上班',
  })
  declare state: boolean

  @ForeignKey(() => Calendar)
  @Column({
    comment: '日历ID',
    type: DataType.INTEGER,
    allowNull: false, // 必填
  })
  declare scId: number
}
