import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user'
import { Shift } from '@model/schedule/shift.model'
/** 班次时间表 */
@Table({ tableName: `schedule_shift_period`, freezeTableName: true, timestamps: true, comment: '班次时间表' })
export class ShiftPeriod extends BaseDate<ShiftPeriod> {
  @ForeignKey(() => Shift)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '所属班次ID',
  })
  declare shiftId: number

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '开始时间',
  })
  declare startTime: string

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '结束时间',
  })
  declare endTime: string

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '工作小时数',
  })
  declare workHours: string
}
