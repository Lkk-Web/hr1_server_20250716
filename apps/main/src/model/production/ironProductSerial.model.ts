import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Material } from '@model/base/material.model'
import { BOM } from '@model/base/bom.model'
import { POBDetail } from '@model/production/POBDetail.model'
import { ProductionOrderDetail } from './productionOrderDetail.model'
import { ProductSerial } from './productSerial.model'

@Table({ tableName: `iron_product_serial`, freezeTableName: true, timestamps: true, comment: '铁芯序列号绑定序列号表' })
export class IronProductSerial extends BaseDate<IronProductSerial> {
  @Column({
    comment: '铁芯序列号',
    type: DataType.STRING(255),
  })
  declare ironSerial: string

  //产品序列号id
  @ForeignKey(() => ProductSerial)
  @Column({
    comment: '产品序列号id',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare serialId: number

  @BelongsTo(() => ProductSerial)
  declare serial: ProductSerial
}
