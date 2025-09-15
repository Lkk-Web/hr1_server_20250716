import { Table, Column, Model, DataType, Default, HasMany, HasOne } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { PalletDetail } from './palletDetail.model'

@Table({ tableName: `base_pallet`, freezeTableName: true, timestamps: true, comment: '托盘表' })
export class Pallet extends BaseDate<Pallet> {
  @Column({
    comment: '托盘编号',
    type: DataType.STRING(255),
  })
  declare pallet_code: string

  @Column({
    type: DataType.STRING(255),
    comment: '托盘规格',
  })
  declare pallet_spec: string

  @Default(true)
  @Column({
    comment: '状态（启用/禁用）',
    type: DataType.BOOLEAN,
  })
  declare status: boolean

  @HasOne(() => PalletDetail)
  declare palletDetail: PalletDetail
}
