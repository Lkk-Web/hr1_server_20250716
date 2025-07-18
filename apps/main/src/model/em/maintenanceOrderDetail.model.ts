import { Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { MaintenanceOrder } from '@model/em/maintenanceOrder.model'

@Table({ tableName: `em_maintenance_order_detail`, freezeTableName: true, timestamps: true, comment: '保养单明细表' })
export class MaintenanceOrderDetail extends BaseDate<MaintenanceOrderDetail> {
  @ForeignKey(()=>MaintenanceOrder)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '保养单Id',
  })
  declare maintenanceOrderId: number

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '保养项名称',
  })
  declare name: string

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '保养方法',
  })
  declare method: string

  @Column({
    type: DataType.STRING(10),
    allowNull: true,
    comment: '类型',
  })
  declare type: string

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '数值',
  })
  declare val: number

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    comment: '保养结果',
  })
  declare bol: boolean

}
