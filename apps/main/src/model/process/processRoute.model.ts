import { Table, Column, Model, DataType, HasMany, ForeignKey, BelongsTo, HasOne } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Material } from '@model/base/material.model'
import { User } from '@model/auth/user'
import { ProcessRouteList } from '@model/process/processRouteList.model'
/** 工艺路线 */
@Table({ tableName: `process_route`, freezeTableName: true, timestamps: true, comment: '工艺路线表' })
export class ProcessRoute extends BaseDate<ProcessRoute> {
  // 工艺路线名称
  @Column({
    comment: '工艺路线名称',
    type: DataType.STRING(50),
    allowNull: false, // 必填项
  })
  declare name: string

  // @ForeignKey(() => Material)
  // // 关联产品（物料编码）
  // @Column({
  //   comment: '关联产品',
  //   type: DataType.INTEGER,
  //   allowNull: false,
  // })
  // declare materialId: number

  // 备注
  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true, // 可选项
  })
  declare remark: string

  @Column({
    comment: 'Bom分组编码',
    type: DataType.STRING,
  })
  declare groupCode: string

  @Column({
    comment: 'Bom分组名称',
    type: DataType.STRING,
  })
  declare groupName: string

  // 状态
  @Column({
    comment: '状态（启用/禁用）',
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true, // 默认启用
  })
  declare status: boolean

  @ForeignKey(() => User)
  // 创建人
  @Column({
    comment: '创建人',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare createdUserId: number

  @ForeignKey(() => User)
  // 更新人
  @Column({
    comment: '更新人',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare updatedUserId: number

  @HasMany(() => Material)
  declare material: Material[]

  @BelongsTo(() => User)
  declare createdUser: User

  @BelongsTo(() => User)
  declare updatedUser: User

  @HasMany(() => ProcessRouteList)
  declare processRouteList: ProcessRouteList[]
}
