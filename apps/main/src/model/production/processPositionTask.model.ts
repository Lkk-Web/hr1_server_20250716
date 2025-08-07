import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user'
import { PROCESS_TASK_STATUS } from '@common/enum'
import { ProcessTaskLog } from '@model/production/processTaskLog.model'
import { ProcessTask } from './processTask.model'
import { Process } from '@model/process/process.model'

//工位任务单
@Table({ tableName: `process_position_task`, timestamps: true, freezeTableName: true, comment: '工位任务单' })
export class ProcessPositionTask extends BaseDate<ProcessPositionTask> {
  //工序任务单id
  @ForeignKey(() => ProcessTask)
  @Column({
    comment: '工序任务单id',
    type: DataType.INTEGER,
    allowNull: true, // 必填项
  })
  declare processTaskId: number

  //操作工id
  @ForeignKey(() => User)
  @Column({
    comment: '操作工id',
    type: DataType.INTEGER,
  })
  declare userId: number

  @ForeignKey(() => Process)
  @Column({
    comment: '工序ID',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare processId: number

  // 报工数比例
  @Column({
    comment: '报工数比例',
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 1,
  })
  declare reportRatio: number

  // 计划数
  @Column({
    comment: '计划数',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare planCount: number

  // 良品数
  @Column({
    comment: '良品数',
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  declare goodCount: number

  // 不良品数
  @Column({
    comment: '不良品数',
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  declare badCount: number

  // 单位
  @Column({
    comment: '单位',
    type: DataType.STRING(10),
    allowNull: true,
  })
  declare unit: string

  // 任务状态
  @Column({
    comment: '任务状态 (审核中, 待分配, 待报工, 已完成)',
    type: DataType.STRING(10),
    allowNull: true,
  })
  declare status: PROCESS_TASK_STATUS | string

  @Column({
    comment: '是否委外',
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isOutsource: boolean

  @Column({
    comment: '是否进行质检',
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  })
  declare isInspection: boolean

  @BelongsTo(() => ProcessTask)
  declare processTask: ProcessTask

  @BelongsTo(() => User)
  declare user: User

  @BelongsTo(() => Process)
  declare process: Process

  @HasMany(() => ProcessTaskLog)
  declare operateLogs: ProcessTaskLog[]
}
