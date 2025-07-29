import { Column, Model, Table, DataType, ForeignKey, BelongsTo, Index } from 'sequelize-typescript'
import { User } from './user'
import { PLATFORM } from '@common/enum'

@Table({ tableName: 'auth_token_info', timestamps: true, paranoid: true, comment: '用户Token信息表' }) // 软删除
export class TokenInfo extends Model {
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '用户ID',
  })
  declare userId: number

  @BelongsTo(() => User)
  declare user: User

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    comment: 'JWT Token',
  })
  declare token: string

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '平台类型',
  })
  declare platform: PLATFORM

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    comment: '设备标识/客户端标识',
  })
  declare deviceId: string

  @Column({
    type: DataType.STRING(45),
    allowNull: true,
    comment: '客户端IP地址',
  })
  declare ipAddress: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '用户代理信息',
  })
  declare userAgent: string

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: 'Token过期时间',
  })
  declare expiresAt: Date

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '最后使用时间',
  })
  declare lastUsedAt: Date

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    comment: '是否激活',
  })
  declare isActive: boolean

  @Column({
    type: DataType.STRING(200),
    allowNull: true,
    comment: '刷新Token',
  })
  declare refreshToken: string //用于换取新的 JWT token，避免频繁登录

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '刷新Token过期时间',
  })
  declare refreshExpiresAt: Date
}
