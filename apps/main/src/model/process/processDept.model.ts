import { BaseDate } from '@model/shared/baseDate'
import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { Process } from '@model/process/process.model'
import { DefectiveItem } from '@model/quantity/defectiveItem.model'
import { Organize } from '@model/auth/organize'
import { ProcessRoute } from '@model/process/processRoute.model'
/** 工序部门关联表 */
@Table({ tableName: `process_dept`, freezeTableName: true, timestamps: true, comment: '工序部门关联表' })
export class ProcessDept extends BaseDate<ProcessDept> {
  @ForeignKey(() => Process)
  @Column({
    comment: '工序Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processId: number

  @ForeignKey(() => Organize)
  @Column({
    comment: '部门Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare deptId: number

  @BelongsTo(() => Process)
  declare process: Process

  @BelongsTo(() => Organize)
  declare dept: Organize
}
