import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/sys/user.model'
import { InspectionTemplate } from '@model/qm/inspectionTemplate.model'
import { InspectionItem } from '@model/qm/inspectionItem.model'
import { Material } from '@model/base/material.model'
/** 检验模板项次关联表 */
@Table({ tableName: `qm_inspection_template_mat`, freezeTableName: true, timestamps: true, comment: '检验模板项次关联表' })
export class InspectionTemplateMat extends BaseDate<InspectionTemplateMat> {
  @ForeignKey(() => InspectionTemplate)
  @Column({
    comment: '检验模板Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare inspectionTemplateId: number

  @ForeignKey(() => Material)
  @Column({
    comment: '物料Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare materialId: number
}
