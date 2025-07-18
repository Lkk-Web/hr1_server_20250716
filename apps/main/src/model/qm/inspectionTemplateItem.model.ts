import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { InspectionTemplate } from '@model/qm/inspectionTemplate.model'
import { InspectionItem } from '@model/qm/inspectionItem.model'

/** 检验模板项次关联表 */
@Table({ tableName: `qm_inspection_template_item`, freezeTableName: true, timestamps: true, comment: '检验模板项次关联表' })
export class InspectionTemplateItem extends BaseDate<InspectionTemplateItem> {
  @ForeignKey(() => InspectionTemplate)
  @Column({
    comment: '检验模板Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare inspectionTemplateId: number

  @ForeignKey(() => InspectionItem)
  @Column({
    comment: '检验项次',
    type: DataType.INTEGER,
    // allowNull: false,
  })
  declare inspectionItemId: number


  @Column({
    comment: '标准值',
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare standardValue: string

  @Column({
    comment: '单位',
    type: DataType.STRING(20),
    allowNull: true,
  })
  declare unit: string

  @Column({
    comment: '误差上限',
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare upperLimit: string

  @Column({
    comment: '误差下限',
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare lowerLimit: string

  @Column({
    comment: '名称',
    type: DataType.STRING(50),
  })
  declare name: string

  @Column({
    comment: 'JSON数据',
    type: DataType.TEXT,
  })
  declare data: string

  @BelongsTo(() => InspectionItem, { foreignKey: 'inspectionItemId', constraints: false, foreignKeyConstraint: false })
  inspectionItem: InspectionItem
}
