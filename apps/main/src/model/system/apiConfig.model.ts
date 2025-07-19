import { Table, Column, Model, DataType, ForeignKey, BelongsTo, BelongsToMany } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'

/** 外部api配置存储表 */
@Table({ tableName: `system_api_config`, freezeTableName: true, timestamps: true, comment: '外部api配置存储表' })
export class ApiConfig extends BaseDate<ApiConfig> {
  @Column({
    comment: '平台名称',
    type: DataType.STRING(128),
    allowNull: false, // 必填
  })
  declare name: string

  @Column({
    comment: '平台类型(金蝶)',
    type: DataType.STRING(128),
    allowNull: false, // 必填
  })
  declare types: string

  @Column({
    comment: '状态',
    type: DataType.BOOLEAN,
    allowNull: false, // 必填
  })
  declare status: boolean

  @Column({
    comment: 'appId',
    type: DataType.STRING(225),
    allowNull: false, // 必填
  })
  declare appId: string

  @Column({
    comment: 'appSecret',
    type: DataType.STRING(225),
    allowNull: false, // 必填
  })
  declare appSecret: string

  @Column({
    comment: 'acctId',
    type: DataType.STRING(225),
    allowNull: true,
  })
  declare acctId: string

  @Column({
    comment: 'acctSecret',
    type: DataType.STRING(225),
    allowNull: true,
  })
  declare acctSecret: string

  @Column({
    comment: '用户名',
    type: DataType.STRING(128),
    allowNull: true,
  })
  declare username: string

  @Column({
    comment: '密码',
    type: DataType.STRING(128),
    allowNull: true,
  })
  declare paasword: string
}
