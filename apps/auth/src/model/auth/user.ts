import { BelongsTo, Column, DataType, ForeignKey, HasMany, HasOne, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Role } from './role'
import { TokenInfo } from './tokenInfo'

@Table({ tableName: `auth_user`, freezeTableName: true, timestamps: true, comment: '用户员工表' })
export class User extends BaseDate<User> {
  // 工号：必填项
  @Column({
    comment: '工号',
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare userCode: string

  @Column({
    comment: '编号',
    type: DataType.STRING(50),
  })
  declare code: string

  // 手机号：必填项
  @Column({
    comment: '手机号',
    type: DataType.STRING(20),
    allowNull: true, // 必填项
  })
  declare phone: string

  // 员工姓名：必填项
  @Column({
    comment: '员工姓名',
    type: DataType.STRING(128),
    unique: true,
    allowNull: false, // 必填项
  })
  declare userName: string

  @Column({
    comment: '密码',
    type: DataType.STRING(128),
    defaultValue: '/XVlFEQy6v+9fMqrC/hhUw==',
  })
  declare password: string

  @Column({ type: DataType.STRING, comment: '员工岗位', allowNull: true })
  declare station: string

  // 邮箱
  @Column({
    comment: '邮箱',
    type: DataType.STRING(255),
    allowNull: true, // 可选
  })
  declare email: string

  // 默认部门
  // @ForeignKey(() => Organize) // 假设有部门表
  @Column({
    comment: '默认部门',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare departmentId: number

  // @BelongsTo(() => Organize)
  // declare department: Organize

  @Column({
    comment: '用户状态',
    type: DataType.STRING(20),
    allowNull: true,
  })
  declare state: string

  // 角色
  @ForeignKey(() => Role) // 假设有角色表
  @Column({
    comment: '角色ID',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare roleId: number

  @BelongsTo(() => Role)
  declare role: Role

  // 状态：是否启用
  @Column({
    comment: '状态 (启用/禁用)',
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare status: boolean

  @Column({
    comment: 'openId',
    type: DataType.STRING,
    allowNull: true,
  })
  declare openId: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注',
  })
  declare remark: string

  @HasMany(() => TokenInfo)
  declare tokenInfo: TokenInfo[]
}
