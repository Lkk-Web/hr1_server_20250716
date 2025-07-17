import { ApiProperty } from '@nestjs/swagger'
import { Table, Column, DataType } from 'sequelize-typescript'
import { BaseDate } from "@model/shared/baseDate";

@Table({ tableName: 'auth_role', freezeTableName: true, timestamps: true })
export class Role extends BaseDate<Role> {
  @ApiProperty({ name: 'name', type: String, description: '角色名称', required: true })
  @Column({
    comment: '角色名称',
    type: DataType.STRING(50),
    allowNull: false,
    unique: true
  })
  declare name: string;

  @ApiProperty({ name: 'description', type: String, description: '角色描述', required: false })
  @Column({
    comment: '角色描述',
    type: DataType.STRING(255)
  })
  declare description: string;
}