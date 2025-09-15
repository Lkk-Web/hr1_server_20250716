import { Table, Column, Model, DataType, Default, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Pallet, ProductSerial, Team } from '..'
import { PalletSerial } from './palletSerial.model'

@Table({ tableName: `production_pallet_task_order`, freezeTableName: true, timestamps: true, comment: '托盘任务单表' })
export class PalletTaskOrder extends BaseDate<PalletTaskOrder> {
  @ForeignKey(() => Pallet)
  @Column({
    comment: '托盘ID',
    type: DataType.INTEGER,
  })
  declare palletId: number

  @BelongsTo(() => Pallet)
  declare pallet: Pallet

  @HasMany(() => PalletSerial)
  declare palletSerials: PalletSerial[]
}
