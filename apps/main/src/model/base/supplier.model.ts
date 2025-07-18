import { Table, Column, Model, DataType, Default } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
/** 供应商 */
@Table({ tableName: `base_supplier`, freezeTableName: true, timestamps: true, comment: '供应商表' })
export class Supplier extends BaseDate<Supplier> {
  @Column({
    comment: '编码',
    type: DataType.STRING(50),
    allowNull: true, // 忽略时自动生成
  })
  declare code: string

  // 供应商简称：必填
  @Column({
    comment: '供应商简称',
    type: DataType.STRING(128),
    allowNull: true, // 必填
  })
  declare shortName: string

  // 供应商全称
  @Column({
    comment: '供应商全称',
    type: DataType.STRING(255),
    allowNull: true, // 可选
  })
  declare fullName: string

  // 联系人
  @Column({
    comment: '联系人',
    type: DataType.STRING(128),
    allowNull: true, // 可选
  })
  declare contactPerson: string

  // 联系电话
  @Column({
    comment: '联系电话',
    type: DataType.STRING(50),
    allowNull: true, // 可选
  })
  declare contactPhone: string

  // 联系地址
  @Column({
    comment: '联系地址',
    type: DataType.STRING(255),
    allowNull: true, // 可选
  })
  declare address: string

  @Default(true)
  @Column({
    comment: '状态（启用/禁用）',
    type: DataType.BOOLEAN,
  })
  declare status: boolean

  @Column({
    comment: '自定义字段的数据（JSON格式）',
    type: DataType.TEXT,
  })
  declare formData: string
}
