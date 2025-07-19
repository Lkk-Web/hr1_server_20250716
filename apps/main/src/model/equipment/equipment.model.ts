import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user.model'
import { EquipmentType } from '@model/equipment/equipmentType.model'

@Table({ tableName: `equipment`, freezeTableName: true, timestamps: true, comment: '设备表' })
export class Equipment extends BaseDate<Equipment> {
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '设备名称',
  })
  declare name: string

  @ForeignKey(() => EquipmentType)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '设备类型Id',
  })
  declare equipmentTypeId: number

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

  @BelongsTo(() => EquipmentType)
  declare equipmentType: EquipmentType

  @BelongsTo(() => User, 'createdUserId')
  declare createdUser: User

  @BelongsTo(() => User, 'updatedUserId')
  declare updatedUser: User
}
