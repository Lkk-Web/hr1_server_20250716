import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/sys/user.model'
/** 检验项次 */
@Table({ tableName: `qm_inspection_item`, freezeTableName: true, timestamps: true, comment: '检验项次表' })
export class InspectionItem extends BaseDate<InspectionItem> {
  @Column({
    comment: '检验项次名称',
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare name: string

  // 检验项类型：必填项
  @Column({
    comment: '检验项类型',
    type: DataType.STRING(128),
    allowNull: false,
  })
  declare type: string

  // 检验工具：必填项
  @Column({
    comment: '检验工具',
    type: DataType.STRING(128),
    allowNull: false,
  })
  declare tool: string

  // 检验要求：非必填
  @Column({
    comment: '检验要求',
    type: DataType.STRING(128),
    allowNull: true,
  })
  declare requirement: string

  // 状态：必填项
  @Column({
    comment: '状态',
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare status: boolean

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
