import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, HasMany, HasOne, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user'
import { TeamUser } from '@model/auth/teamUser'
import { TeamProcess } from '@model/auth/teamProcess'
import { TEAM_TYPE } from '@common/enum'
import { Process } from '@model/main-service/process'
import { Position } from '@model/main-service/position'
/** 班组 */
@Table({ tableName: `auth_team`, freezeTableName: true, timestamps: true, comment: '班组表' })
export class Team extends BaseDate<Team> {
  // 班组名称：必填
  @Column({
    comment: '班组名称',
    type: DataType.STRING(128),
    allowNull: false, // 必填
  })
  declare name: string

  @ForeignKey(() => User)
  // 负责人
  @Column({
    comment: '负责人',
    type: DataType.INTEGER,
    allowNull: true, // 可选
  })
  declare chargeId: number

  // 状态
  @Column({
    comment: '状态',
    type: DataType.BOOLEAN,
    allowNull: true, // 可选
  })
  declare status: boolean

  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string

  @Column({
    comment: '班组类型',
    type: DataType.STRING,
    allowNull: false,
    defaultValue: TEAM_TYPE.output,
  })
  declare type: TEAM_TYPE

  @Column({
    comment: '是否为外包工序',
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isOut: boolean

  @BelongsTo(() => User)
  declare charge: User

  @BelongsToMany(() => User, { through: () => TeamUser, uniqueKey: 'Team_tu_user_unique', foreignKey: 'teamId', otherKey: 'userId' })
  declare users: User[]

  @BelongsToMany(() => Process, () => TeamProcess)
  declare process: Process[]

  @HasMany(() => TeamProcess)
  declare teamProcessList: TeamProcess[]

  @HasOne(() => TeamProcess)
  declare teamProcess: TeamProcess

  @HasMany(() => TeamUser)
  declare teamUsers: TeamUser[]

  @HasOne(() => TeamUser)
  declare teamUser: TeamUser

  @HasMany(() => Position)
  declare positions: Position[]
}
