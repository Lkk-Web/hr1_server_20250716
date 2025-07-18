import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Material } from '@model/base/material.model'
import { ProductionOrder } from '@model/pe/productionOrder.model'
import { Process } from '@model/process/process.model'
import { SYSOrg } from '@model/sys/SYSOrg.model'
import { POP } from '@model/pe/POP.model'

@Table({ tableName: `pe_POD`, freezeTableName: true, timestamps: true, comment: '生产工单工序关联部门表' })
export class POD extends BaseDate<POD> {
  //工单ID
  @ForeignKey(() => POP)
  @Column({
    comment: '工序任务Id',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare popId: number

  @ForeignKey(() => SYSOrg)
  @Column({
    comment: '部门ID',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare deptId: number
}
