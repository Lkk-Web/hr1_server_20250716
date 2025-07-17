import { ApiProperty } from '@nestjs/swagger'
import { Table, Column, DataType, ForeignKey, BelongsTo, HasMany, BelongsToMany } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Role } from './role'
import { TokenInfo } from './tokenInfo'

@Table({ tableName: 'auth_user', freezeTableName: true, timestamps: true })
export class User extends BaseDate<User> {
  @ApiProperty({ name: 'name', type: String, description: '姓名', required: false })
  @Column({
    comment: '姓名',
    type: DataType.STRING(50),
  })
  declare name: string

  @ApiProperty({ name: 'phone', type: String, description: '手机号', required: true })
  @Column({
    comment: '手机号',
    type: DataType.STRING(11),
    unique: true,
    allowNull: false,
  })
  declare phone: string

  @ApiProperty({ name: 'password', type: String, description: '密码', required: true })
  @Column({
    comment: '密码',
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare password: string

  @HasMany(() => TokenInfo)
  declare tokenInfo: TokenInfo
}
