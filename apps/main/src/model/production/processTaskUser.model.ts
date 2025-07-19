import { Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { ProcessTask } from '@model/production/processTask.model'
import { Organize } from '@model/auth/organize'
import { User } from '@model/auth/user.model'

@Table({ tableName: `production_process_task_user`, timestamps: true, freezeTableName: true, comment: '工序任务单关联用户表' })
export class ProcessTaskUser extends BaseDate<ProcessTaskUser> {
  @ForeignKey(() => ProcessTask)
  // 工单编号
  @Column({
    comment: '工序任务单ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  taskId: number

  // 工单编号
  @ForeignKey(() => User)
  @Column({
    comment: '员工ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number
}
