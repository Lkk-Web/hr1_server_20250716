import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Process } from '@model/process/process.model'
import { ProcessTask } from '@model/pe/processTask.model'
import { SYSOrg } from '@model/sys/SYSOrg.model'

@Table({ tableName: `pe_process_task_dept`, timestamps: true, freezeTableName: true, comment: '工序任务单关联部门表' })
export class ProcessTaskDept extends BaseDate<ProcessTaskDept> {
  @ForeignKey(() => ProcessTask)
  // 工单编号
  @Column({
    comment: '工序任务单ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  taskId: number

  // 工单编号
  @ForeignKey(() => SYSOrg)
  @Column({
    comment: '部门ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  deptId: number
}
