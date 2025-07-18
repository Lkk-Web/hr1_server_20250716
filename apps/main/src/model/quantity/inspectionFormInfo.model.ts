import { BelongsTo, Column, DataType, ForeignKey, HasMany, HasOne, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { InspectionFormItem } from '@model/quantity/InspectionFormItem.model'
import { InspectionForm } from '@model/quantity/inspectionForm.model'
import { InspectionTemplate } from '@model/quantity/inspectionTemplate.model'
import { InspectionFormResult } from '@model/quantity/inspectionFormResult.model'
import { Material } from '@model/base/material.model'

/** 报工检验单 */
@Table({ tableName: `quantity_inspection_form_info`, freezeTableName: true, timestamps: true, comment: '报工检验物料信息表' })
export class InspectionFormInfo extends BaseDate<InspectionFormInfo> {
  @ForeignKey(() => InspectionForm)
  @Column({
    comment: '检验单Id',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare inspectionFormId: number

  @Column({
    comment: '检验数量',
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  declare count: number

  @Column({
    comment: '检验结果(0:不合格,1:合格)',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare result: number

  @Column({
    comment: '质检状态(0:计划,1:质检完成)',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare status: number

  @Column({
    comment: '合格数量',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare goodCount: number

  @Column({
    comment: '不合格数量',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare badCount: number

  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string

  @ForeignKey(() => InspectionTemplate)
  @Column({
    comment: '检验模板Id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare templateId: number

  @ForeignKey(() => Material)
  @Column({
    comment: '物料Id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare materialId: number

  @Column({
    comment: '检验种类Id（动态字段模版Id）',
    type: DataType.INTEGER,
  })
  declare ttId: number

  @BelongsTo(() => Material)
  declare material: Material

  @BelongsTo(() => InspectionTemplate)
  declare template: InspectionTemplate

  @HasOne(() => InspectionFormItem)
  declare item: InspectionFormItem

  @HasMany(() => InspectionFormResult)
  declare results: InspectionFormResult[]
}
