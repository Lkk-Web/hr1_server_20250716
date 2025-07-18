import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Team } from '@model/schedule/team.model'
import { EquipmentLedger } from '@model/em/equipmentLedger.model'

@Table({ tableName: `schedule_team_equipment_ledger`, freezeTableName: true, timestamps: true, comment: '班组与设备台账' })
export class TeamEquipmentLedger extends BaseDate<TeamEquipmentLedger> {
  @ForeignKey(() => Team)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '班组id',
  })
  declare teamId: number

  @ForeignKey(() => EquipmentLedger)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '设备台账Id',
  })
  declare equipmentLedgerId: number

  @BelongsTo(() => EquipmentLedger)
  declare equipmentLedger: EquipmentLedger

  @BelongsTo(() => Team)
  declare team: Team
}
