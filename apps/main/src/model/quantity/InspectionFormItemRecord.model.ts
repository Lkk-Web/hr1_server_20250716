import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user.model'
import { ProductionOrder } from '@model/production/productionOrder.model'
import { Process } from '@model/process/process.model'
import { InspectionForm } from '@model/quantity/inspectionForm.model'
import { InspectionItem } from '@model/quantity/inspectionItem.model'
import { InspectionFormItem } from '@model/quantity/InspectionFormItem.model'
import { DefectiveItem } from '@model/quantity/defectiveItem.model'
/** 报工检验单检验项目缺陷记录 */
@Table({ tableName: `quantity_inspection_form_itequipment_record`, freezeTableName: true, timestamps: true, comment: '报工检验单检验项目缺陷记录' })
export class InspectionFormItemRecord extends BaseDate<InspectionFormItemRecord> {
  @ForeignKey(() => InspectionFormItem)
  @Column({
    comment: '检验单检验项目Id',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare inspectionFormItemId: number

  @ForeignKey(() => DefectiveItem)
  @Column({
    comment: '不良品项ID',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare defectiveItemId: number

  @Column({
    comment: '类型',
    type: DataType.STRING(20),
    allowNull: false, // 必填项
  })
  declare type: string

  @Column({
    comment: '不良品项数量',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare count: number

  @BelongsTo(() => DefectiveItem, { foreignKey: 'defectiveItemId', constraints: false, foreignKeyConstraint: false })
  defectiveItem: DefectiveItem
}
