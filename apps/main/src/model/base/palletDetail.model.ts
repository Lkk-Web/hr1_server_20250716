import { Table, Column, Model, DataType, Default, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Pallet } from './pallet.model'
import { Team } from '@model/auth/team'

@Table({ tableName: `base_pallet_detail`, freezeTableName: true, timestamps: true, comment: '托盘明细表' })
export class PalletDetail extends BaseDate<PalletDetail> {
  @ForeignKey(() => Pallet)
  @Column({
    comment: '托盘ID',
    type: DataType.INTEGER,
  })
  declare palletId: number

  @BelongsTo(() => Pallet)
  declare pallet: Pallet

  @ForeignKey(() => Team)
  @Column({
    comment: '班组ID',
    type: DataType.INTEGER,
  })
  declare teamId: number

  @BelongsTo(() => Team)
  declare team: Team
}
