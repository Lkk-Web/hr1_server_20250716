import { Table, Column, Model, DataType, ForeignKey, BelongsTo, BelongsToMany } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { PlanShiftTeam, SchedulePlan, Shift, Team } from '..'
/** 排班计划班次关联表 */
@Table({ tableName: `sm_schedule_plan_shift`, freezeTableName: true, timestamps: true, comment: '排班计划班次关联表' })
export class SchedulePlanShift extends BaseDate<SchedulePlanShift> {
  @ForeignKey(() => SchedulePlan)
  @Column({
    comment: '排班计划ID',
    type: DataType.INTEGER,
    allowNull: false, // 必填
  })
  declare planId: number

  @ForeignKey(() => Shift)
  @Column({
    comment: '班次ID',
    type: DataType.INTEGER,
    allowNull: false, // 必填
  })
  declare shiftId: number

  @BelongsToMany(() => Team, { through: () => PlanShiftTeam, uniqueKey: 'Paln_shift_team_unique', foreignKey: 'planShiftId', otherKey: 'teamId' })
  teams: Team[]

  @BelongsTo(() => Shift)
  shift: Shift
}
