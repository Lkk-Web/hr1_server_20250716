import { Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript'
import { Role, User } from '..'

@Table({ tableName: `sys_user_role`, timestamps: false, freezeTableName: true, paranoid: true })
export class SYSUserRole extends Model<SYSUserRole> {
  @ForeignKey(() => Role)
  @Column({ type: DataType.INTEGER, comment: '角色id' })
  declare roleId: number

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, comment: '用户id' })
  declare userId: number
}
