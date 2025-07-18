import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/sys/user.model'
import { InspectionTemplateItem } from '@model/quantity/inspectionTemplateItem.model'
import { Material } from '@model/base/material.model'
import { InspectionTemplateMat } from '@model/quantity/inspectionTemplateMat.model'

/** 检验模板 */
@Table({ tableName: `quantity_inspection_template`, freezeTableName: true, timestamps: true, comment: '检验模板表' })
export class InspectionTemplate extends BaseDate<InspectionTemplate> {
  @Column({
    comment: '检验模板编码',
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare code: string

  @Column({
    comment: '检验模板名称',
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare name: string

  // 检验方案类型：必填项
  @Column({
    comment: '检验方案类型',
    type: DataType.STRING(10),
    allowNull: false,
    defaultValue: '物料',
  })
  declare templateType: string

  // 检验项类型：必填项
  @Column({
    comment: '检验种类',
    type: DataType.STRING(20),
    allowNull: false,
  })
  declare type: string

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '检验种类Id（动态字段模版Id）',
  })
  declare ttId: number

  // 状态：必填项
  @Column({
    comment: '状态',
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare status: boolean

  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '创建人',
  })
  declare createdUserId: number

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '更新人',
  })
  declare updatedUserId: number

  @Column({
    comment: '其他数据',
    type: DataType.TEXT,
  })
  declare data: string

  @BelongsTo(() => User, 'createdUserId')
  createdUser: User

  @BelongsTo(() => User, 'updatedUserId')
  updatedUser: User

  @HasMany(() => InspectionTemplateItem)
  items: InspectionTemplateItem[]

  @BelongsToMany(() => Material, {
    through: () => InspectionTemplateMat,
    uniqueKey: 'InspectionTemplate_ITM_Material_id',
    foreignKey: 'inspectionTemplateId',
    otherKey: 'materialId',
  })
  materials: Material[]
}
