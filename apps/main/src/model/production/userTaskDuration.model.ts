import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseModel } from '@model/shared/base.model'
import { ProcessPositionTask, ProcessTask, ProductionReport, User } from '..'

@Table({ tableName: `production_user_task_duration`, timestamps: false, comment: '生产任务与员工时长' })
export class UserTaskDuration extends BaseModel<UserTaskDuration> {
  @ForeignKey(() => User)
  @Column({
    comment: '用户id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare userId: number

  @ForeignKey(() => ProductionReport)
  @Column({
    comment: '生产报工表id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare productionReportId: number

  @ForeignKey(() => ProcessPositionTask)
  @Column({
    comment: '工位任务id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare processPositionTaskId: number

  @ForeignKey(() => ProcessTask)
  @Column({
    comment: '工序任务id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare processTaskId: number

  @Column({
    comment: '所用时长 单位/s',
    type: DataType.INTEGER,
  })
  declare duration: number

  @BelongsTo(() => User)
  declare user: User

  @BelongsTo(() => ProcessPositionTask)
  declare processPositionTask: ProcessPositionTask

  @BelongsTo(() => ProcessTask)
  declare processTask: ProcessTask
}
