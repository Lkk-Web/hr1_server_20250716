import { Table, Column, DataType, ForeignKey } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Organize } from '@model/auth/organize'
import { ProcessTask } from '@model/production/processTask.model'

@Table({ tableName: `production_POD`, freezeTableName: true, timestamps: true, comment: '生产工单工序关联部门表' })
export class POD extends BaseDate<POD> {
  //工单ID
  @ForeignKey(() => ProcessTask)
  @Column({
    comment: '工序任务Id',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare productionProcessTaskId: number

  @ForeignKey(() => Organize)
  @Column({
    comment: '部门ID',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare deptId: number
}
