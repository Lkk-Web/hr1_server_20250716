import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, BelongsToMany } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/sys/user.model'
import { TeamType } from '@model/schedule/teamType.model'
import { Shift } from '@model/schedule/shift.model'
import { SchedulePlanShift } from '@model/schedule/schedulePlanShift.model'
import { Calendar } from '..'
/** 排班计划 */
@Table({ tableName: `schedule_plan`, freezeTableName: true, timestamps: true, comment: '排班计划表' })
export class SchedulePlan extends BaseDate<SchedulePlan> {
  // 车间名称：必填
  @Column({
    comment: '计划名称',
    type: DataType.STRING(128),
    allowNull: false, // 必填
  })
  declare name: string
  //排班日期(开始)
  @Column({
    comment: '排班日期(开始)',
    type: DataType.DATE,
    allowNull: false, // 必填
  })
  declare startTime: Date
  //排班日期(结束)
  @Column({
    comment: '排班日期(结束)',
    type: DataType.DATE,
    allowNull: false, // 必填
  })
  declare endTime: Date

  // 日历id
  @ForeignKey(() => Calendar)
  @Column({
    comment: '日历id',
    type: DataType.INTEGER,
    allowNull: false, // 必填
  })
  declare calendarId: number

  // 轮班方式
  @Column({
    comment: '轮班方式(白班/两班制/三班制)',
    type: DataType.STRING(10),
    allowNull: false, // 必填
  })
  declare shiftType: string

  // 倒班方式
  @Column({
    comment: '倒班方式(按周,按月)',
    type: DataType.STRING(10),
    allowNull: false, // 可选
  })
  declare changeType: string

  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    comment: '状态（启用/禁用）',
  })
  declare status: boolean

  @HasMany(() => SchedulePlanShift)
  spsList: SchedulePlanShift[]

  @BelongsTo(() => Calendar)
  declare calendar: Calendar
}
