import { Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { ProcessTask } from './processTask.model'
import { BaseModel } from '@model/shared/base.model'
import { ProcessPositionTask } from './processPositionTask.model'

@Table({ tableName: `process_task_log`, timestamps: false, freezeTableName: true, comment: '工序任务单日志' })
export class ProcessTaskLog extends BaseModel<ProcessTaskLog> {
  @ForeignKey(() => ProcessTask)
  @Column({
    comment: '工序任务单id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processTaskID: number

  @ForeignKey(() => ProcessPositionTask)
  @Column({
    comment: '工位任务单id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare processPositionTaskID: number

  @Column({
    comment: '暂停的时间',
    type: DataType.DATE,
    allowNull: false,
  })
  declare pauseTime: number | Date

  @Column({
    comment: '恢复的时间',
    type: DataType.DATE,
  })
  declare resumeTime: number | Date
}
