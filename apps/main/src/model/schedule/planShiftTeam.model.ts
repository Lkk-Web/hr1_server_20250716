import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { SchedulePlanShift, Team } from '..'
/** 排班计划班次班组关联表 */
@Table({ tableName: `schedule_plan_shift_team`, freezeTableName: true, timestamps: true, comment: '排班计划班次班组关联表' })
export class PlanShiftTeam extends BaseDate<PlanShiftTeam> {
  @ForeignKey(() => SchedulePlanShift)
  @Column({
    comment: '排版计划排次ID',
    type: DataType.INTEGER,
    allowNull: false, // 必填
  })
  declare planShiftId: number

  @ForeignKey(() => Team)
  @Column({
    comment: '班组Id',
    type: DataType.INTEGER,
    allowNull: false, // 必填
  })
  declare teamId: number
}
