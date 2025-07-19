import { Table, Column, Model, DataType, ForeignKey, BelongsTo, BelongsToMany } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user.model'
import { WorkShop } from '@model/base/workShop.model'
import { TeamUser } from '@model/schedule/teamUser.model'
/** 班组类型 */
@Table({ tableName: `schedule_team_type`, freezeTableName: true, timestamps: true, comment: '班组类型表' })
export class TeamType extends BaseDate<TeamType> {
  // 类型名称：必填
  @Column({
    comment: '类型名称',
    type: DataType.STRING(128),
    allowNull: false, // 必填
  })
  declare name: string

  // 类型名称：必填
  @Column({
    comment: '状态',
    type: DataType.BOOLEAN,
    allowNull: true, // 必填
  })
  declare status: boolean

  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string
}
