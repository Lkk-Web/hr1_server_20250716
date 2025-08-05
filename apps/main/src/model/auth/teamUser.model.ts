import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user'
import { WorkShop } from '@model/base/workShop.model'
import { Team } from '@model/auth/team'
/** 班组员工表 */
@Table({ tableName: `auth_team_user`, freezeTableName: true, timestamps: true, comment: '班组员工表' })
export class TeamUser extends BaseDate<TeamUser> {
  // 班组名称：必填
  @ForeignKey(() => Team)
  @Column({
    comment: '班组ID',
    type: DataType.INTEGER,
    allowNull: false, // 必填
  })
  declare teamId: number

  // 班组名称：必填
  @ForeignKey(() => User)
  @Column({
    comment: '员工ID',
    type: DataType.INTEGER,
    allowNull: false, // 必填
  })
  declare userId: number
}
