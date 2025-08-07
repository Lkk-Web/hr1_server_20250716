import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user'
import { ProcessTask } from './processTask.model'
import { ProcessPositionTask } from './processPositionTask.model'
import { ProcessLocate } from './processLocate.model'

/** 派工详情表 */
@Table({ tableName: `process_locate_detail`, freezeTableName: true, timestamps: true, comment: '派工详情表' })
export class ProcessLocateDetail extends BaseDate<ProcessLocateDetail> {
  // 派工主表ID
  @ForeignKey(() => ProcessLocate)
  @Column({
    comment: '派工主表ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processLocateId: number

  // 指定人员ID
  @ForeignKey(() => User)
  @Column({
    comment: '指定人员ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare userId: number

  // 工序任务单ID
  @ForeignKey(() => ProcessTask)
  @Column({
    comment: '工序任务单ID',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare processTaskId: number

  // 工位任务单ID
  @ForeignKey(() => ProcessPositionTask)
  @Column({
    comment: '工位任务单ID',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare processPositionTaskId: number

  // 分配数量
  @Column({
    comment: '分配数量',
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  declare assignCount: number

  // 状态 (0: 待执行, 1: 执行中, 2: 已完成, 3: 已取消)
  @Column({
    comment: '状态',
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
  })
  declare status: number

  // 开始时间
  @Column({
    comment: '开始时间',
    type: DataType.DATE,
    allowNull: true,
  })
  declare startTime: Date

  // 完成时间
  @Column({
    comment: '完成时间',
    type: DataType.DATE,
    allowNull: true,
  })
  declare finishTime: Date

  // 备注
  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string

  // 关联派工主表
  @BelongsTo(() => ProcessLocate, 'processLocateId')
  declare processLocate: ProcessLocate

  // 关联指定人员
  @BelongsTo(() => User, 'userId')
  declare user: User

  // 关联工序任务单
  @BelongsTo(() => ProcessTask, 'processTaskId')
  declare processTask: ProcessTask

  // 关联工位任务单
  @BelongsTo(() => ProcessPositionTask, 'processPositionTaskId')
  declare processPositionTask: ProcessPositionTask
}