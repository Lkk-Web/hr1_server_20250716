import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, BelongsToMany } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user'
import { Team, ShiftPeriod } from '..'
/** 班次 */
@Table({ tableName: `schedule_shift`, freezeTableName: true, timestamps: true, comment: '班次表' })
export class Shift extends BaseDate<Shift> {
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '班次名称',
  })
  declare name: string

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '班次简称',
  })
  declare shortName: string

  @Column({
    type: DataType.STRING(50),
    comment: '班次颜色代码',
  })
  declare color: string

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    comment: '班次状态（启用/禁用）',
  })
  declare status: boolean

  @Column({
    type: DataType.TEXT,
    comment: '备注',
  })
  declare remark: string

  @HasMany(() => ShiftPeriod)
  declare periods: ShiftPeriod[]
}
