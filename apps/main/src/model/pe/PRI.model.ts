import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { DefectiveItem } from '@model/quantity/defectiveItem.model'
import { POP } from '@model/pe/POP.model'
import { ProductionReport } from '@model/pe/productionReport.model'

@Table({ tableName: `pe_PRI`, freezeTableName: true, timestamps: true, comment: '生产报工不良品项关联表' })
export class PRI extends BaseDate<PRI> {
  //工单ID
  @ForeignKey(() => ProductionReport)
  @Column({
    comment: '生产报工ID',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare productionReportId: number

  @ForeignKey(() => DefectiveItem)
  @Column({
    comment: '不良品项ID',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare defectiveItemId: number

  @Column({
    comment: '不良品项数量',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare count: number

  @BelongsTo(() => ProductionReport, { foreignKey: 'productionReportId', constraints: false, foreignKeyConstraint: false })
  productionReport: ProductionReport

  @BelongsTo(() => DefectiveItem, { foreignKey: 'defectiveItemId', constraints: false, foreignKeyConstraint: false })
  defectiveItem: DefectiveItem
}
