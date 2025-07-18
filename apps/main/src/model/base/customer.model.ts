import { Table, Column, Model, DataType, Default } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'

@Table({ tableName: `base_customer`, freezeTableName: true, timestamps: true, comment: '客户表' })
export class Customer extends BaseDate<Customer> {
  @Column({
    comment: '编码',
    type: DataType.STRING(50),
    allowNull: true, // 忽略时自动生成
  })
  declare code: string

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: '客户分类',
  })
  declare types: string

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    comment: '客户全称',
  })
  declare fullName: string

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: '联系人',
  })
  declare contactPerson: string

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: '联系电话',
  })
  declare contactPhone: string

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '联系地址',
  })
  declare contactAddress: string

  @Default(true)
  @Column({
    comment: '状态（启用/禁用）',
    type: DataType.BOOLEAN,
  })
  declare status: boolean
}
