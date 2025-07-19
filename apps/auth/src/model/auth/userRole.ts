import { Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript'
import { Role, User } from '..'

@Table({ tableName: `auth_user_role`, timestamps: false, freezeTableName: true, paranoid: true })
export class UserRole extends Model<UserRole> {
  @ForeignKey(() => Role)
  @Column({ type: DataType.INTEGER, comment: '角色id' })
  declare roleId: number

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, comment: '用户id' })
  declare userId: number
}
