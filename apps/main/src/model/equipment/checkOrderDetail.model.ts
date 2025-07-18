import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/sys/user.model'
import { CheckStandard } from '@model/equipment/checkStandard.model'
import { CheckOrder } from '@model/equipment/checkOrder.model'

@Table({ tableName: `equipment_check_order_detail`, freezeTableName: true, timestamps: true, comment: '点检单明细表' })
export class CheckOrderDetail extends BaseDate<CheckOrderDetail> {
  @ForeignKey(() => CheckOrder)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '检验单Id',
  })
  declare checkOrderId: number

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '检查项名称',
  })
  declare name: string

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '点检方法',
  })
  declare method: string

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '最小值',
  })
  declare min: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '最大值',
  })
  declare max: number

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '检查结果',
  })
  declare result: string

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '其他',
  })
  declare another: number

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '拍照',
  })
  declare images: string[]
}
