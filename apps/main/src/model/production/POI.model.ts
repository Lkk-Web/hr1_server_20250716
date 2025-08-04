import { Table, Column, DataType, ForeignKey } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { DefectiveItem } from '@model/quantity/defectiveItem.model'
import { ProductionProcessTask } from '@model/production/productionProcessTask.model'

@Table({ tableName: `production_POI`, freezeTableName: true, timestamps: true, comment: '生产工单工序关联不良品项表' })
export class POI extends BaseDate<POI> {
  //工单ID
  @ForeignKey(() => ProductionProcessTask)
  @Column({
    comment: '工序任务Id',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare productionProcessTaskId: number

  @ForeignKey(() => DefectiveItem)
  @Column({
    comment: '不良品项ID',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare defectiveItemId: number
}
