import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Team } from '@model/sm/team.model'
import { Process } from '@model/process/process.model'

@Table({ tableName: `sm_team_process`, freezeTableName: true, timestamps: true, comment: '班组与工序' })
export class TeamProcess extends BaseDate<TeamProcess> {
  @ForeignKey(() => Team)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '班组id',
  })
  declare teamId: number

  @ForeignKey(() => Process)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '工序id',
  })
  declare processId: number

  @BelongsTo(() => Process)
  declare process: Process

  @BelongsTo(() => Team)
  declare team: Team
}
