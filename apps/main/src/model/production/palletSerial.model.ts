import { Table, Column, Model, DataType, Default, ForeignKey, BelongsTo, AllowNull } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Pallet, ProductSerial, Team } from '..'
import { PalletTaskOrder } from './palletTaskOrder.model'

@Table({ tableName: `production_pallet_serial`, freezeTableName: true, timestamps: true, comment: '托盘序列号表' })
export class PalletSerial extends BaseDate<PalletSerial> {
  @ForeignKey(() => Pallet)
  @Column({
    comment: '托盘ID',
    type: DataType.INTEGER,
  })
  declare palletId: number

  @BelongsTo(() => Pallet, 'palletId')
  declare pallet: Pallet

  @ForeignKey(() => PalletTaskOrder)
  @Column({
    comment: '托盘任务单ID',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare palletTaskOrderId: number

  @BelongsTo(() => PalletTaskOrder, 'palletTaskOrderId')
  declare palletTaskOrder: PalletTaskOrder

  @ForeignKey(() => ProductSerial)
  @Column({
    comment: '产品序列号ID',
    type: DataType.INTEGER,
  })
  declare productSerialId: number

  @BelongsTo(() => ProductSerial, 'productSerialId')
  declare productSerial: ProductSerial
}
