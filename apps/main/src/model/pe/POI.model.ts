import { Table, Column, Model, DataType, ForeignKey, Unique, Index } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Material } from '@model/base/material.model'
import { ProductionOrder } from '@model/pe/productionOrder.model'
import { Process } from '@model/pm/process.model'
import { SYSOrg } from '@model/sys/SYSOrg.model'
import { DefectiveItem } from '@model/qm/defectiveItem.model'
import { POP } from '@model/pe/POP.model'

@Table({ tableName: `pe_POI`, freezeTableName: true, timestamps: true, comment: '生产工单工序关联不良品项表' })
export class POI extends BaseDate<POI> {
  //工单ID
  @ForeignKey(() => POP)
  @Column({
    comment: '工序任务Id',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare popId: number

  @ForeignKey(() => DefectiveItem)
  @Column({
    comment: '不良品项ID',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare defectiveItemId: number
}
