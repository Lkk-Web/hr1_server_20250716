import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { Material } from '@model/base/material.model'
import { POP } from '@model/production/POP.model'
import { POB } from '@model/production/POB.model'
import { ProcessTask } from '@model/production/processTask.model'
import { SalesOrder } from '@model/plan/salesOrder.model'
import { StrBaseModel } from '@model/shared/strBase.model'
import { ProductionOrderDetail } from './productionOrderDetail.model'

@Table({ tableName: `production_order`, freezeTableName: true, timestamps: true, comment: '生产订单表' })
export class ProductionOrder extends StrBaseModel<ProductionOrder> {
  @Column({
    comment: '金蝶编号',
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare kingdeeCode: string

  @Column({
    comment: '单据日期',
    type: DataType.DATE,
  })
  declare orderDate: Date

  @ForeignKey(() => SalesOrder)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '销售订单Id',
  })
  declare salesOrderId: number

  // 状态
  @Column({
    comment: '单据状态',
    type: DataType.STRING(10),
    allowNull: false, // 必填项
  })
  declare status: string

  // 优先级
  @Column({
    comment: '优先级 (加急, 暂停, 无)',
    type: DataType.STRING(10),
    allowNull: false, // 必填项
    defaultValue: '无',
  })
  declare priority: string

  // 计划开始时间
  @Column({
    comment: '计划开始时间',
    type: DataType.DATE,
    allowNull: true, // 可选项
  })
  declare startTime: Date

  // 计划结束时间
  @Column({
    comment: '计划结束时间',
    type: DataType.DATE,
    allowNull: true, // 可选项
  })
  declare endTime: Date

  // 实际产出
  @Column({
    comment: '实际产出 (数量)',
    type: DataType.INTEGER,
    allowNull: true, // 可选项
    defaultValue: 0,
  })
  declare actualOutput: number

  // 实际开始时间
  @Column({
    comment: '实际开始时间',
    type: DataType.DATE,
    allowNull: true, // 可选项
  })
  declare actualStartTime: Date

  // 实际结束时间
  @Column({
    comment: '实际结束时间',
    type: DataType.DATE,
    allowNull: true, // 可选项
  })
  declare actualEndTime: Date

  // 累计工时
  @Column({
    comment: '累计工时',
    type: DataType.INTEGER,
    allowNull: true, // 可选项
  })
  declare totalWorkingHours: number

  // 当前工序
  @Column({
    comment: '当前工序',
    type: DataType.STRING(50),
    allowNull: true, // 可选项
  })
  declare currentProcess: string

  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string

  @Column({
    comment: '单据类型',
    type: DataType.STRING,
  })
  declare billType: string

  @HasMany(() => POP)
  declare processes: POP[]

  @BelongsTo(() => SalesOrder)
  declare salesOrder: SalesOrder

  @HasMany(() => ProductionOrderDetail)
  declare productionOrderDetail: ProductionOrderDetail[]

  @HasMany(() => ProcessTask)
  declare tasks: ProcessTask[]
}
