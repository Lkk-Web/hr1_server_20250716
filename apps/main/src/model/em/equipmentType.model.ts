import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Supplier } from '@model/base/supplier.model'
import { Customer } from '@model/base/customer.model'
import { Warehouse } from '@model/warehouse/warehouse.model'
import { User } from '@model/sys/user.model'
import { InboundOrderDetail } from '@model/warehouse/inboundOrderDetail.model'

@Table({ tableName: `em_equipment_type`, freezeTableName: true, timestamps: true, comment: '设备类型表' })
export class EquipmentType extends BaseDate<EquipmentType> {
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '设备类型名称',
  })
  declare name: string

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    comment: '状态',
    defaultValue: true,
  })
  declare status: boolean

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注',
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

  @BelongsTo(() => User, 'createdUserId')
  createdUser: User

  @BelongsTo(() => User, 'updatedUserId')
  updatedUser: User
}
