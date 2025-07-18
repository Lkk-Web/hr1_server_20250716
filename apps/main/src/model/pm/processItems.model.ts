import { BaseDate } from '@model/shared/baseDate'
import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { Process } from '@model/pm/process.model'
import { DefectiveItem } from '@model/quantity/defectiveItem.model'
/** 工序不良品项关联表 */
@Table({ tableName: `pm_process_items`, freezeTableName: true, timestamps: true, comment: '工序不良品项关联表' })
export class ProcessItems extends BaseDate<ProcessItems> {
  @ForeignKey(() => Process)
  @Column({
    comment: '工序Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processId: number

  @ForeignKey(() => DefectiveItem)
  @Column({
    comment: '不良品项Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare defectiveItemId: number

  @BelongsTo(() => DefectiveItem)
  declare defectiveItem: DefectiveItem
}
